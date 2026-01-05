import { useCallback } from 'react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { WebcamView } from '@/components/WebcamView';
import { RULAScoreDisplay } from '@/components/RULAScoreDisplay';

const Index = () => {
  const { isLoading, rulaScores, landmarks, startDetection, isDetecting } = usePoseDetection();

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    startDetection(video);
  }, [startDetection]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
      <WebcamView
        onVideoReady={handleVideoReady}
        isLoading={isLoading}
        landmarks={landmarks}
        isDetecting={isDetecting}
        rulaScores={rulaScores}
      />
      <RULAScoreDisplay scores={rulaScores} />
    </div>
  );
};

export default Index;
