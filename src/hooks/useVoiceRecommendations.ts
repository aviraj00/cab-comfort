import { useEffect, useRef, useState, useCallback } from 'react';
import { RULAScores } from '@/utils/rulaCalculations';

const SPEAK_INTERVAL_MS = 15000; // don't repeat more than once per 15s

export function useVoiceRecommendations(scores: RULAScores | null, enabled: boolean) {
  const [supported, setSupported] = useState(false);
  const lastSpokenAtRef = useRef<number>(0);
  const lastMessageRef = useRef<string>('');

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
      utter.volume = 1;
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.log('Speech synthesis failed', e);
    }
  }, [supported]);

  useEffect(() => {
    if (!enabled || !supported || !scores) return;
    if (scores.finalScore < 4) return; // only speak when correction needed
    if (!scores.recommendations?.length) return;

    const now = Date.now();
    const message = scores.recommendations.slice(0, 2).join('. ');
    if (now - lastSpokenAtRef.current < SPEAK_INTERVAL_MS && message === lastMessageRef.current) {
      return;
    }
    if (now - lastSpokenAtRef.current < SPEAK_INTERVAL_MS) return;

    const prefix = scores.finalScore >= 6 ? 'Critical posture alert. ' : 'Posture warning. ';
    speak(prefix + message);
    lastSpokenAtRef.current = now;
    lastMessageRef.current = message;
  }, [scores, enabled, supported, speak]);

  useEffect(() => {
    if (!enabled && supported) {
      window.speechSynthesis.cancel();
    }
  }, [enabled, supported]);

  return { supported, speak };
}
