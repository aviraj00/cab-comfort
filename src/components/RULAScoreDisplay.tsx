import { motion, AnimatePresence } from 'framer-motion';
import { RULAScores } from '@/utils/rulaCalculations';
import { AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';

interface RULAScoreDisplayProps {
  scores: RULAScores | null;
}

const riskConfig = {
  'low': {
    label: 'Good Posture',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    icon: CheckCircle,
    glowClass: 'glow-success',
  },
  'medium': {
    label: 'Fair Posture',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30',
    icon: Activity,
    glowClass: 'glow-warning',
  },
  'high': {
    label: 'Poor Posture',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    icon: AlertTriangle,
    glowClass: 'glow-warning',
  },
  'very-high': {
    label: 'Critical',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    icon: XCircle,
    glowClass: 'glow-danger',
  },
};

const ScoreBar = ({ label, score, maxScore }: { label: string; score: number; maxScore: number }) => {
  const percentage = (score / maxScore) * 100;
  const getBarColor = () => {
    if (percentage <= 33) return 'bg-success';
    if (percentage <= 66) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{score}/{maxScore}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getBarColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export function RULAScoreDisplay({ scores }: RULAScoreDisplayProps) {
  if (!scores) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded animate-pulse w-24" />
            <div className="h-3 bg-muted rounded animate-pulse w-16" />
          </div>
        </div>
      </div>
    );
  }

  const config = riskConfig[scores.risk];
  const Icon = config.icon;

  return (
    <motion.div
      className={`glass-card p-6 space-y-5 ${config.glowClass}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with main score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            className={`w-14 h-14 rounded-xl ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className={`w-7 h-7 ${config.color}`} />
          </motion.div>
          <div>
            <h3 className={`text-lg font-semibold ${config.color}`}>
              {config.label}
            </h3>
            <p className="text-sm text-muted-foreground">RULA Assessment</p>
          </div>
        </div>
        <div className="text-right">
          <motion.span
            key={scores.finalScore}
            className={`text-4xl font-bold font-mono ${config.color}`}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {scores.finalScore}
          </motion.span>
          <span className="text-muted-foreground text-sm">/7</span>
        </div>
      </div>

      {/* Individual scores */}
      <div className="space-y-3">
        <ScoreBar label="Neck" score={scores.neck} maxScore={6} />
        <ScoreBar label="Trunk" score={scores.trunk} maxScore={6} />
        <ScoreBar label="Upper Arm" score={scores.upperArm} maxScore={6} />
        <ScoreBar label="Lower Arm" score={scores.lowerArm} maxScore={3} />
        <ScoreBar label="Wrist" score={scores.wrist} maxScore={4} />
      </div>

      {/* Recommendations */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scores.recommendations.join(',')}
          className={`p-4 rounded-lg ${config.bgColor} ${config.borderColor} border`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <h4 className="text-sm font-medium text-foreground mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {scores.recommendations.map((rec, i) => (
              <motion.li
                key={i}
                className="text-sm text-muted-foreground flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className={`${config.color} mt-1`}>•</span>
                {rec}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
