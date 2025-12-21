import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RULAScores } from '@/utils/rulaCalculations';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

interface PostureHistoryProps {
  currentScore: RULAScores | null;
}

interface HistoryEntry {
  timestamp: Date;
  score: number;
  risk: string;
}

export function PostureHistory({ currentScore }: PostureHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!currentScore) return;

    const now = new Date();
    const entry: HistoryEntry = {
      timestamp: now,
      score: currentScore.finalScore,
      risk: currentScore.risk,
    };

    setHistory(prev => {
      const newHistory = [...prev, entry];
      // Keep last 20 entries
      return newHistory.slice(-20);
    });
  }, [currentScore?.finalScore]);

  const getAverageScore = () => {
    if (history.length === 0) return 0;
    return history.reduce((sum, h) => sum + h.score, 0) / history.length;
  };

  const getTrend = () => {
    if (history.length < 5) return 'neutral';
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    
    if (older.length === 0) return 'neutral';
    
    const recentAvg = recent.reduce((s, h) => s + h.score, 0) / recent.length;
    const olderAvg = older.reduce((s, h) => s + h.score, 0) / older.length;
    
    if (recentAvg < olderAvg - 0.5) return 'improving';
    if (recentAvg > olderAvg + 0.5) return 'declining';
    return 'neutral';
  };

  const trend = getTrend();
  const avgScore = getAverageScore();

  const trendConfig = {
    improving: { icon: TrendingDown, label: 'Improving', color: 'text-success' },
    declining: { icon: TrendingUp, label: 'Declining', color: 'text-destructive' },
    neutral: { icon: Minus, label: 'Stable', color: 'text-muted-foreground' },
  };

  const TrendIcon = trendConfig[trend].icon;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Session Stats
        </h3>
        <div className={`flex items-center gap-1 text-sm ${trendConfig[trend].color}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{trendConfig[trend].label}</span>
        </div>
      </div>

      {/* Mini chart */}
      <div className="h-20 flex items-end gap-1">
        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Start monitoring to see history
          </div>
        ) : (
          history.slice(-15).map((entry, index) => {
            const height = (entry.score / 7) * 100;
            const getBarColor = () => {
              if (entry.score <= 2) return 'bg-success';
              if (entry.score <= 4) return 'bg-accent';
              if (entry.score <= 6) return 'bg-warning';
              return 'bg-destructive';
            };

            return (
              <motion.div
                key={index}
                className="flex-1 min-w-0"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <div className={`w-full h-full ${getBarColor()} rounded-t-sm opacity-80 hover:opacity-100 transition-opacity`} />
              </motion.div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Average Score</p>
          <p className="text-lg font-mono font-semibold text-foreground">
            {avgScore.toFixed(1)}<span className="text-muted-foreground text-sm">/7</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Readings</p>
          <p className="text-lg font-mono font-semibold text-foreground">{history.length}</p>
        </div>
      </div>
    </div>
  );
}
