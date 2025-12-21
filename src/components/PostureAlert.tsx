import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RULAScores } from '@/utils/rulaCalculations';
import { AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostureAlertProps {
  scores: RULAScores | null;
}

export function PostureAlert({ scores }: PostureAlertProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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
    const shouldAlert = scores.risk === 'high' || scores.risk === 'very-high';
    
    if (shouldAlert && now - lastAlertTimeRef.current > 5000) {
      setShowAlert(true);
      playAlertSound();
      lastAlertTimeRef.current = now;
      
      setTimeout(() => setShowAlert(false), 4000);
    }
  }, [scores, soundEnabled]);

  const alertConfig = {
    'high': {
      title: 'Posture Warning',
      message: 'Your posture needs correction. Please adjust your sitting position.',
      bgClass: 'bg-warning/20 border-warning/40',
      textClass: 'text-warning',
    },
    'very-high': {
      title: 'Critical Posture Alert',
      message: 'Immediate posture correction required to prevent strain!',
      bgClass: 'bg-destructive/20 border-destructive/40',
      textClass: 'text-destructive',
    },
  };

  const config = scores?.risk && (scores.risk === 'high' || scores.risk === 'very-high')
    ? alertConfig[scores.risk]
    : null;

  return (
    <>
      {/* Sound toggle */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="bg-card/50 backdrop-blur-sm hover:bg-card/80"
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5 text-muted-foreground" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </div>

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
