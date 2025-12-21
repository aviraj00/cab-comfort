import { motion } from 'framer-motion';
import { RULAScores } from '@/utils/rulaCalculations';

interface BodyDiagramProps {
  scores: RULAScores | null;
}

const getScoreColor = (score: number, maxScore: number) => {
  const percentage = score / maxScore;
  if (percentage <= 0.33) return '#22c55e'; // success
  if (percentage <= 0.66) return '#eab308'; // warning
  return '#ef4444'; // destructive
};

export function BodyDiagram({ scores }: BodyDiagramProps) {
  const neckColor = scores ? getScoreColor(scores.neck, 6) : '#64748b';
  const trunkColor = scores ? getScoreColor(scores.trunk, 6) : '#64748b';
  const upperArmColor = scores ? getScoreColor(scores.upperArm, 6) : '#64748b';
  const lowerArmColor = scores ? getScoreColor(scores.lowerArm, 3) : '#64748b';
  const wristColor = scores ? getScoreColor(scores.wrist, 4) : '#64748b';

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Body Assessment</h3>
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 280"
          className="w-full max-w-[180px] h-auto"
        >
          {/* Head */}
          <motion.circle
            cx="100"
            cy="30"
            r="25"
            fill="none"
            stroke={neckColor}
            strokeWidth="3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          
          {/* Neck */}
          <motion.line
            x1="100"
            y1="55"
            x2="100"
            y2="75"
            stroke={neckColor}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Shoulders */}
          <motion.line
            x1="60"
            y1="85"
            x2="140"
            y2="85"
            stroke={upperArmColor}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          
          {/* Trunk */}
          <motion.rect
            x="75"
            y="75"
            width="50"
            height="80"
            rx="5"
            fill="none"
            stroke={trunkColor}
            strokeWidth="3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
          
          {/* Left Upper Arm */}
          <motion.line
            x1="60"
            y1="85"
            x2="45"
            y2="135"
            stroke={upperArmColor}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          
          {/* Right Upper Arm */}
          <motion.line
            x1="140"
            y1="85"
            x2="155"
            y2="135"
            stroke={upperArmColor}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          
          {/* Left Lower Arm */}
          <motion.line
            x1="45"
            y1="135"
            x2="35"
            y2="185"
            stroke={lowerArmColor}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          />
          
          {/* Right Lower Arm */}
          <motion.line
            x1="155"
            y1="135"
            x2="165"
            y2="185"
            stroke={lowerArmColor}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          />
          
          {/* Left Wrist/Hand */}
          <motion.circle
            cx="35"
            cy="195"
            r="8"
            fill="none"
            stroke={wristColor}
            strokeWidth="3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          />
          
          {/* Right Wrist/Hand */}
          <motion.circle
            cx="165"
            cy="195"
            r="8"
            fill="none"
            stroke={wristColor}
            strokeWidth="3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          />
          
          {/* Left Leg (seated) */}
          <motion.path
            d="M 85 155 Q 70 180 50 220"
            fill="none"
            stroke="#64748b"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          />
          
          {/* Right Leg (seated) */}
          <motion.path
            d="M 115 155 Q 130 180 150 220"
            fill="none"
            stroke="#64748b"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          />
          
          {/* Seat indicator */}
          <motion.rect
            x="40"
            y="155"
            width="120"
            height="10"
            rx="3"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          />
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Good</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">Fair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Poor</span>
        </div>
      </div>
    </div>
  );
}
