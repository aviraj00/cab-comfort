import { motion } from 'framer-motion';
import { Download, Trash2, Pause, Play, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataExportPanelProps {
  dataCount: number;
  isCollecting: boolean;
  onExport: () => void;
  onClear: () => void;
  onToggleCollection: () => void;
}

export function DataExportPanel({
  dataCount,
  isCollecting,
  onExport,
  onClear,
  onToggleCollection,
}: DataExportPanelProps) {
  return (
    <motion.div
      className="glass-card p-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Data Points</p>
            <p className="text-sm font-mono font-medium text-foreground">{dataCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleCollection}
            title={isCollecting ? 'Pause collection' : 'Resume collection'}
          >
            {isCollecting ? (
              <Pause className="w-4 h-4 text-warning" />
            ) : (
              <Play className="w-4 h-4 text-success" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onExport}
            disabled={dataCount === 0}
            title="Export to Excel/CSV"
          >
            <Download className="w-4 h-4 text-primary" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClear}
            disabled={dataCount === 0}
            title="Clear data"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
      
      {isCollecting && (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Recording every 3s</span>
        </div>
      )}
    </motion.div>
  );
}
