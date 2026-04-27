import { useEffect, useRef, useState, useCallback } from 'react';
import { RULAScores } from '@/utils/rulaCalculations';

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

const MESSAGES: Record<PartKey, string> = {
  neck: 'Please straighten your neck and look forward.',
  trunk: 'Sit upright and align your back with the seat.',
  upperArm: 'Relax your shoulders and lower your upper arms.',
  lowerArm: 'Adjust your elbow angle, keep it near ninety degrees.',
  wrist: 'Keep your wrists straight on the steering wheel.',
};

const PREFIX = { warn: 'Posture warning. ', critical: 'Critical posture alert. ' };

export function useVoiceRecommendations(scores: RULAScores | null, enabled: boolean) {
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

  const pickBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const en = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    if (!en.length) return null;
    // Preferred high-quality voices across browsers/OSes (ordered)
    const preferred = [
      'Google UK English Female',
      'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft Aria',
      'Microsoft Jenny',
      'Samantha',
      'Karen',
      'Daniel',
    ];
    for (const name of preferred) {
      const m = en.find(v => v.name === name);
      if (m) return m;
    }
    // Prefer "natural"/"online" voices
    const natural = en.find(v => /natural|online|neural/i.test(v.name));
    if (natural) return natural;
    // Prefer non-default local voices over the OS default
    const nonDefault = en.find(v => !v.default);
    return nonDefault || en[0];
  }, []);

  const speakNext = useCallback(() => {
    if (!supported) return;
    if (speakingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    speakingRef.current = true;
    try {
      const utter = new SpeechSynthesisUtterance(next);
      utter.rate = 0.95;
      utter.pitch = 1.05;
      utter.volume = 1;
      utter.lang = 'en-US';

      const voice = pickBestVoice();
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      }

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
  }, [supported]);

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
        .sort((a, b) => (s as any)[b] - (s as any)[a])
        .slice(0, 3);

      if (offending.length === 0) return;

      const prefix = s.finalScore >= 6 ? PREFIX.critical : PREFIX.warn;
      offending.forEach((p, idx) => {
        const text = (idx === 0 ? prefix : '') + MESSAGES[p];
        queueRef.current.push(text);
        lastSpokenAtRef.current[p] = now;
      });

      speakNext();
    };

    const id = window.setInterval(tick, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, supported, speakNext]);

  useEffect(() => {
    if (!supported) return;
    if (!enabled) {
      window.speechSynthesis.cancel();
      queueRef.current = [];
      speakingRef.current = false;
    }
  }, [enabled, supported]);

  return { supported };
}
