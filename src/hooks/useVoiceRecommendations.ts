import { useEffect, useRef, useState, useCallback } from 'react';
import { RULAScores } from '@/utils/rulaCalculations';

// Normal mode timings — generous spacing so the driver isn't nagged
const NORMAL_PART_COOLDOWN_MS = 45000; // don't repeat same body-part advice for 45s
const NORMAL_GAP_BETWEEN_PHRASES_MS = 3000; // 3s pause between consecutive recommendations
const NORMAL_VOLUME = 1;

// Quiet mode — softer + a bit tighter, but still calm
const QUIET_PART_COOLDOWN_MS = 25000;
const QUIET_GAP_BETWEEN_PHRASES_MS = 1500;
const QUIET_VOLUME = 0.35;

// Minimum gap between any two spoken alerts, regardless of source
const MIN_ALERT_INTERVAL_MS = 5000;

const CHECK_INTERVAL_MS = 2000;

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

export function useVoiceRecommendations(
  scores: RULAScores | null,
  enabled: boolean,
  quiet: boolean = false,
) {
  const [supported, setSupported] = useState(false);
  const lastSpokenAtRef = useRef<Record<PartKey, number>>({
    neck: 0, trunk: 0, upperArm: 0, lowerArm: 0, wrist: 0,
  });
  const queueRef = useRef<string[]>([]);
  const speakingRef = useRef(false);
  const scoresRef = useRef<RULAScores | null>(null);
  const quietRef = useRef(quiet);

  useEffect(() => { quietRef.current = quiet; }, [quiet]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handler = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = handler;
      return () => { window.speechSynthesis.onvoiceschanged = null; };
    }
  }, []);

  useEffect(() => { scoresRef.current = scores; }, [scores]);

  const pickBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const en = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    if (!en.length) return null;
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
    const natural = en.find(v => /natural|online|neural/i.test(v.name));
    if (natural) return natural;
    const nonDefault = en.find(v => !v.default);
    return nonDefault || en[0];
  }, []);

  const speakNext = useCallback(() => {
    if (!supported) return;
    if (speakingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    speakingRef.current = true;
    const isQuiet = quietRef.current;
    const gap = isQuiet ? QUIET_GAP_BETWEEN_PHRASES_MS : NORMAL_GAP_BETWEEN_PHRASES_MS;
    try {
      const utter = new SpeechSynthesisUtterance(next);
      utter.rate = isQuiet ? 1.05 : 0.95;
      utter.pitch = isQuiet ? 1 : 1.05;
      utter.volume = isQuiet ? QUIET_VOLUME : NORMAL_VOLUME;
      utter.lang = 'en-US';

      const voice = pickBestVoice();
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      }

      utter.onend = () => {
        speakingRef.current = false;
        setTimeout(() => speakNext(), gap);
      };
      utter.onerror = () => {
        speakingRef.current = false;
        setTimeout(() => speakNext(), gap);
      };
      window.speechSynthesis.speak(utter);
    } catch (e) {
      speakingRef.current = false;
      console.log('Speech synthesis failed', e);
    }
  }, [supported, pickBestVoice]);

  useEffect(() => {
    if (!enabled || !supported) return;

    const tick = () => {
      const s = scoresRef.current;
      if (!s) return;
      if (s.finalScore < 4) return;

      const now = Date.now();
      const cooldown = quietRef.current ? QUIET_PART_COOLDOWN_MS : NORMAL_PART_COOLDOWN_MS;
      const parts: PartKey[] = ['neck', 'trunk', 'upperArm', 'lowerArm', 'wrist'];
      const offending = parts
        .filter(p => (s as any)[p] >= PART_THRESHOLDS[p])
        .filter(p => now - lastSpokenAtRef.current[p] >= cooldown)
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
