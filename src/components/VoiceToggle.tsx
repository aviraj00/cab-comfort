import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceToggleProps {
  enabled: boolean;
  onToggle: () => void;
  supported: boolean;
}

export function VoiceToggle({ enabled, onToggle, supported }: VoiceToggleProps) {
  if (!supported) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="bg-card/50 backdrop-blur-sm hover:bg-card/80"
      title={enabled ? 'Disable voice recommendations' : 'Enable voice recommendations'}
    >
      {enabled ? (
        <Mic className="h-5 w-5 text-primary" />
      ) : (
        <MicOff className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
