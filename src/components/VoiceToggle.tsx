import { Mic, MicOff, Volume2, Volume1 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceToggleProps {
  enabled: boolean;
  onToggle: () => void;
  supported: boolean;
  quiet: boolean;
  onQuietToggle: () => void;
}

export function VoiceToggle({ enabled, onToggle, supported, quiet, onQuietToggle }: VoiceToggleProps) {
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
      <Button
        variant="ghost"
        size="icon"
        onClick={onQuietToggle}
        disabled={!enabled}
        className="hover:bg-card/80 h-8 w-8"
        title={quiet ? 'Quiet mode on — tap for normal volume' : 'Normal volume — tap for quiet mode'}
      >
        {quiet ? (
          <Volume1 className="h-4 w-4 text-warning" />
        ) : (
          <Volume2 className="h-4 w-4 text-primary" />
        )}
      </Button>
    </div>
  );
}
