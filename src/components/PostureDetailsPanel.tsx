import { motion, AnimatePresence } from 'framer-motion';
import { RULAScores } from '@/utils/rulaCalculations';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PostureDetailsPanelProps {
  scores: RULAScores | null;
}

const ScoreItem = ({ label, score, maxScore }: { label: string; score: number; maxScore: number }) => {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (percentage <= 33) return 'text-success';
    if (percentage <= 66) return 'text-warning';
    return 'text-destructive';
  };
  const getBgColor = () => {
    if (percentage <= 33) return 'bg-success';
    if (percentage <= 66) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getBgColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span className={`text-xs font-mono ${getColor()} w-8 text-right`}>{score}/{maxScore}</span>
    </div>
  );
};

export function PostureDetailsPanel({ scores }: PostureDetailsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!scores) return null;

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-foreground">Body Part Scores</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Body Part Scores */}
            <div className="px-3 pb-3 space-y-2">
              <ScoreItem label="Neck" score={scores.neck} maxScore={6} />
              <ScoreItem label="Trunk" score={scores.trunk} maxScore={6} />
              <ScoreItem label="Upper Arm" score={scores.upperArm} maxScore={6} />
              <ScoreItem label="Elbow Angle" score={scores.lowerArm} maxScore={3} />
              <ScoreItem label="Wrist" score={scores.wrist} maxScore={4} />
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50 mx-3" />

            {/* Recommendations */}
            <div className="p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Recommendations</h4>
              <ul className="space-y-1.5">
                {scores.recommendations.map((rec, i) => (
                  <motion.li
                    key={i}
                    className="text-xs text-foreground/80 flex items-start gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
