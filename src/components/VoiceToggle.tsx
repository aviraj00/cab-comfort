import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VoiceLang } from '@/hooks/useVoiceRecommendations';

interface VoiceToggleProps {
  enabled: boolean;
  onToggle: () => void;
  supported: boolean;
  lang: VoiceLang;
  onLangChange: (lang: VoiceLang) => void;
}

export function VoiceToggle({ enabled, onToggle, supported, lang, onLangChange }: VoiceToggleProps) {
  if (!supported) return null;
  return (
    <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm rounded-md p-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="hover:bg-card/80 h-8 w-8"
        title={enabled ? 'Disable voice recommendations' : 'Enable voice recommendations'}
      >
        {enabled ? (
          <Mic className="h-4 w-4 text-primary" />
        ) : (
          <MicOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      <button
        onClick={() => onLangChange(lang === 'en' ? 'hi' : 'en')}
        className="text-xs font-medium px-2 py-1 rounded text-foreground hover:bg-card/80 transition-colors"
        title="Toggle language"
      >
        {lang === 'en' ? 'EN' : 'हिं'}
      </button>
    </div>
  );
}
