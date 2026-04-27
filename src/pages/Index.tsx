import { useCallback, useState } from 'react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { WebcamView } from '@/components/WebcamView';
import { RULAScoreDisplay } from '@/components/RULAScoreDisplay';
import { PostureAlert } from '@/components/PostureAlert';
import { PostureDetailsPanel } from '@/components/PostureDetailsPanel';
import { DataExportPanel } from '@/components/DataExportPanel';
import { VoiceToggle } from '@/components/VoiceToggle';
import { usePostureDataCollection } from '@/hooks/usePostureDataCollection';
import { useVoiceRecommendations } from '@/hooks/useVoiceRecommendations';

const Index = () => {
  const { isLoading, rulaScores, landmarks, startDetection, isDetecting } = usePoseDetection();
  const { dataCount, isCollecting, exportToCSV, clearData, toggleCollection } = usePostureDataCollection(rulaScores, 3000);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const { supported: voiceSupported } = useVoiceRecommendations(rulaScores, voiceEnabled);

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
      <div className="absolute top-4 left-4 z-30">
        <VoiceToggle
          enabled={voiceEnabled}
          onToggle={() => setVoiceEnabled((v) => !v)}
          supported={voiceSupported}
        />
      </div>
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 max-w-[280px]">
        <RULAScoreDisplay scores={rulaScores} compact />
        <DataExportPanel
          dataCount={dataCount}
          isCollecting={isCollecting}
          onExport={exportToCSV}
          onClear={clearData}
          onToggleCollection={toggleCollection}
        />
        <PostureDetailsPanel scores={rulaScores} />
      </div>
      <PostureAlert scores={rulaScores} />
    </div>
  );
};

export default Index;
