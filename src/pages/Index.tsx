import { useCallback } from 'react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { WebcamView } from '@/components/WebcamView';
import { RULAScoreDisplay } from '@/components/RULAScoreDisplay';
import { PostureAlert } from '@/components/PostureAlert';
import { PostureDetailsPanel } from '@/components/PostureDetailsPanel';

const Index = () => {
  const { isLoading, rulaScores, landmarks, startDetection, isDetecting } = usePoseDetection();

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    startDetection(video);
  }, [startDetection]);

  return (
    <div className="fixed inset-0 bg-black">
      <WebcamView
        onVideoReady={handleVideoReady}
        isLoading={isLoading}
        landmarks={landmarks}
        isDetecting={isDetecting}
        rulaScores={rulaScores}
        fullscreen
      />
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 max-w-[280px]">
        <RULAScoreDisplay scores={rulaScores} compact />
        <PostureDetailsPanel scores={rulaScores} />
      </div>
      <PostureAlert scores={rulaScores} />
    </div>
  );
};

export default Index;
