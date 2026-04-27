import { useEffect, useRef, useState, useCallback } from 'react';
import { RULAScores } from '@/utils/rulaCalculations';

export type VoiceLang = 'en' | 'hi';

const PART_COOLDOWN_MS = 20000; // per-part cooldown
const GAP_BETWEEN_PHRASES_MS = 1200; // pause between body-part messages
const CHECK_INTERVAL_MS = 2000; // how often we look for new things to say

type PartKey = 'neck' | 'trunk' | 'upperArm' | 'lowerArm' | 'wrist';

const PART_THRESHOLDS: Record<PartKey, number> = {
  neck: 3,
  trunk: 3,
  upperArm: 3,
  lowerArm: 2,
  wrist: 3,
};

const MESSAGES: Record<VoiceLang, Record<PartKey, string>> = {
  en: {
    neck: 'Please straighten your neck and look forward.',
    trunk: 'Sit upright and align your back with the seat.',
    upperArm: 'Relax your shoulders and lower your upper arms.',
    lowerArm: 'Adjust your elbow angle, keep it near ninety degrees.',
    wrist: 'Keep your wrists straight on the steering wheel.',
  },
  hi: {
    neck: 'Kripya apni gardan seedhi rakhein aur saamne dekhein.',
    trunk: 'Seedhe baithein aur apni peeth ko seat se lagayein.',
    upperArm: 'Apne kandhe relax karein aur baazu neeche rakhein.',
    lowerArm: 'Apni kohni ka kon theek karein, lagbhag navve degree rakhein.',
    wrist: 'Steering par apni kalai seedhi rakhein.',
  },
};

const PREFIX: Record<VoiceLang, { warn: string; critical: string }> = {
  en: { warn: 'Posture warning. ', critical: 'Critical posture alert. ' },
  hi: { warn: 'Mudra chetavni. ', critical: 'Atyant zaroori mudra sudhar. ' },
};

export function useVoiceRecommendations(
  scores: RULAScores | null,
  enabled: boolean,
  lang: VoiceLang = 'en'
) {
  const [supported, setSupported] = useState(false);
  const lastSpokenAtRef = useRef<Record<PartKey, number>>({
    neck: 0, trunk: 0, upperArm: 0, lowerArm: 0, wrist: 0,
  });
  const queueRef = useRef<string[]>([]);
  const speakingRef = useRef(false);
  const scoresRef = useRef<RULAScores | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  useEffect(() => { scoresRef.current = scores; }, [scores]);

  const speakNext = useCallback(() => {
    if (!supported) return;
    if (speakingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    speakingRef.current = true;
    try {
      const utter = new SpeechSynthesisUtterance(next);
      utter.rate = lang === 'hi' ? 0.95 : 1;
      utter.pitch = 1;
      utter.volume = 1;
      utter.lang = lang === 'hi' ? 'hi-IN' : 'en-US';

      // try to pick a matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.toLowerCase().startsWith(utter.lang.toLowerCase()));
      if (match) utter.voice = match;

      utter.onend = () => {
        speakingRef.current = false;
        setTimeout(() => speakNext(), GAP_BETWEEN_PHRASES_MS);
      };
      utter.onerror = () => {
        speakingRef.current = false;
        setTimeout(() => speakNext(), GAP_BETWEEN_PHRASES_MS);
      };
      window.speechSynthesis.speak(utter);
    } catch (e) {
      speakingRef.current = false;
      console.log('Speech synthesis failed', e);
    }
  }, [supported, lang]);

  // Periodically check which body parts need correction and enqueue messages
  useEffect(() => {
    if (!enabled || !supported) return;

    const tick = () => {
      const s = scoresRef.current;
      if (!s) return;
      if (s.finalScore < 4) return;

      const now = Date.now();
      const parts: PartKey[] = ['neck', 'trunk', 'upperArm', 'lowerArm', 'wrist'];
      const offending = parts
        .filter(p => (s as any)[p] >= PART_THRESHOLDS[p])
        .filter(p => now - lastSpokenAtRef.current[p] >= PART_COOLDOWN_MS)
        // worst first
        .sort((a, b) => (s as any)[b] - (s as any)[a])
        .slice(0, 3);

      if (offending.length === 0) return;

      const prefix = s.finalScore >= 6 ? PREFIX[lang].critical : PREFIX[lang].warn;
      offending.forEach((p, idx) => {
        const text = (idx === 0 ? prefix : '') + MESSAGES[lang][p];
        queueRef.current.push(text);
        lastSpokenAtRef.current[p] = now;
      });

      speakNext();
    };

    const id = window.setInterval(tick, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, supported, lang, speakNext]);

  // Stop everything when disabled or language changes
  useEffect(() => {
    if (!supported) return;
    if (!enabled) {
      window.speechSynthesis.cancel();
      queueRef.current = [];
      speakingRef.current = false;
    }
  }, [enabled, supported]);

  useEffect(() => {
    if (!supported) return;
    // language changed: clear queue so new language is used next time
    window.speechSynthesis.cancel();
    queueRef.current = [];
    speakingRef.current = false;
  }, [lang, supported]);

  return { supported };
}
