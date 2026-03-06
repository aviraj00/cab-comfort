import { useState, useEffect, useRef, useCallback } from 'react';
import { RULAScores } from '@/utils/rulaCalculations';

export interface PostureDataPoint {
  timestamp: string;
  neck: number;
  trunk: number;
  upperArm: number;
  elbowAngle: number;
  wrist: number;
  finalScore: number;
  risk: string;
}

export function usePostureDataCollection(scores: RULAScores | null, intervalMs: number = 5000) {
  const [dataPoints, setDataPoints] = useState<PostureDataPoint[]>([]);
  const [isCollecting, setIsCollecting] = useState(true);
  const lastCollectionRef = useRef<number>(0);

  useEffect(() => {
    if (!scores || !isCollecting) return;

    const now = Date.now();
    if (now - lastCollectionRef.current >= intervalMs) {
      lastCollectionRef.current = now;
      
      const dataPoint: PostureDataPoint = {
        timestamp: new Date().toISOString(),
        neck: scores.neck,
        trunk: scores.trunk,
        upperArm: scores.upperArm,
        elbowAngle: scores.lowerArm,
        wrist: scores.wrist,
        finalScore: scores.finalScore,
        risk: scores.risk,
      };

      setDataPoints(prev => [...prev, dataPoint]);
      console.log('Collected posture data point:', dataPoint);
    }
  }, [scores, intervalMs, isCollecting]);

  const exportToCSV = useCallback(() => {
    if (dataPoints.length === 0) {
      console.log('No data to export');
      return;
    }

    const headers = ['Timestamp', 'Neck', 'Trunk', 'Upper Arm', 'Lower Arm', 'Wrist', 'Final Score', 'Risk Level', 'Camera Side'];
    const csvRows = [
      headers.join(','),
      ...dataPoints.map(point => [
        point.timestamp,
        point.neck,
        point.trunk,
        point.upperArm,
        point.lowerArm,
        point.wrist,
        point.finalScore,
        point.risk,
        point.cameraSide,
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `posture_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Exported ${dataPoints.length} data points to CSV`);
  }, [dataPoints]);

  const clearData = useCallback(() => {
    setDataPoints([]);
    lastCollectionRef.current = 0;
  }, []);

  const toggleCollection = useCallback(() => {
    setIsCollecting(prev => !prev);
  }, []);

  return {
    dataPoints,
    isCollecting,
    exportToCSV,
    clearData,
    toggleCollection,
    dataCount: dataPoints.length,
  };
}
