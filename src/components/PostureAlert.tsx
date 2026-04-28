import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RULAScores } from '@/utils/rulaCalculations';
import { AlertTriangle } from 'lucide-react';

interface PostureAlertProps {
  scores: RULAScores | null;
}

export function PostureAlert({ scores }: PostureAlertProps) {
  const [showAlert, setShowAlert] = useState(false);
  const soundEnabled = true;
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  const playAlertSound = () => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      oscillator.frequency.setValueAtTime(550, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  useEffect(() => {
    if (!scores) return;
    
    const now = Date.now();
    const shouldAlert = scores.finalScore >= 4 && scores.finalScore <= 7;
    
    if (shouldAlert && now - lastAlertTimeRef.current > 5000) {
      setShowAlert(true);
      playAlertSound();
      lastAlertTimeRef.current = now;
      
      setTimeout(() => setShowAlert(false), 4000);
    }
  }, [scores, soundEnabled]);

  const getAlertConfig = (score: number) => {
    if (score >= 6) {
      return {
        title: 'Critical Posture Alert',
        message: 'Immediate posture correction required to prevent strain!',
        bgClass: 'bg-destructive/20 border-destructive/40',
        textClass: 'text-destructive',
      };
    } else if (score >= 4) {
      return {
        title: 'Posture Warning',
        message: 'Your posture needs correction. Please adjust your sitting position.',
        bgClass: 'bg-warning/20 border-warning/40',
        textClass: 'text-warning',
      };
    }
    return null;
  };

  const config = scores ? getAlertConfig(scores.finalScore) : null;

  return (
    <>
      {/* Alert banner */}
      <AnimatePresence>
        {showAlert && config && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md"
          >
            <div className={`${config.bgClass} border rounded-xl p-4 backdrop-blur-lg flex items-start gap-3`}>
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <AlertTriangle className={`w-6 h-6 ${config.textClass} flex-shrink-0 mt-0.5`} />
              </motion.div>
              <div>
                <h4 className={`font-semibold ${config.textClass}`}>{config.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{config.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
