import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { WebcamView } from '@/components/WebcamView';
import { RULAScoreDisplay } from '@/components/RULAScoreDisplay';
import { BodyDiagram } from '@/components/BodyDiagram';
import { PostureAlert } from '@/components/PostureAlert';
import { PostureHistory } from '@/components/PostureHistory';
import { Car, Shield, Activity } from 'lucide-react';

const Index = () => {
  const { isLoading, rulaScores, landmarks, startDetection, isDetecting } = usePoseDetection();

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    startDetection(video);
  }, [startDetection]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Driver Posture Monitor</h1>
                <p className="text-xs text-muted-foreground">RULA Postural Analysis System</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-success" />
                <span className="hidden sm:inline">Safety Monitoring Active</span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Video feed */}
          <motion.div 
            className="lg:col-span-2 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <PostureAlert scores={rulaScores} />
              <WebcamView
                onVideoReady={handleVideoReady}
                isLoading={isLoading}
                landmarks={landmarks}
                isDetecting={isDetecting}
                rulaScores={rulaScores}
              />
            </div>

            {/* Info cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <motion.div 
                className="glass-card p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Real-time</p>
                    <p className="text-xs text-muted-foreground">AI Analysis</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="glass-card p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">RULA Based</p>
                    <p className="text-xs text-muted-foreground">Ergonomic Standard</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="glass-card p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Car className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Driver Safety</p>
                    <p className="text-xs text-muted-foreground">Fatigue Prevention</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right column - Analysis */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <RULAScoreDisplay scores={rulaScores} />
            <BodyDiagram scores={rulaScores} />
            <PostureHistory currentScore={rulaScores} />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 border-t border-border/30 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground">
            Posture analysis based on RULA (Rapid Upper Limb Assessment) methodology • 
            <span className="text-foreground"> Lower scores indicate better posture</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
