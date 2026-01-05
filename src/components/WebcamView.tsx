import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostureLandmarks, RULAScores } from '@/utils/rulaCalculations';

interface WebcamViewProps {
  onVideoReady: (video: HTMLVideoElement) => void;
  isLoading: boolean;
  rulaScores: RULAScores | null;
  landmarks: PostureLandmarks | null;
  isDetecting: boolean;
  fullscreen?: boolean;
}

// MediaPipe pose connections for skeleton drawing
const POSE_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], // left shoulder to left elbow
  [13, 15], // left elbow to left wrist
  [12, 14], // right shoulder to right elbow
  [14, 16], // right elbow to right wrist
  [11, 23], // left shoulder to left hip
  [12, 24], // right shoulder to right hip
  [23, 24], // hips
];

const riskConfig = {
  'low': { label: 'Good', color: 'text-success', bgColor: 'bg-success/20', borderColor: 'border-success' },
  'medium': { label: 'Fair', color: 'text-accent', bgColor: 'bg-accent/20', borderColor: 'border-accent' },
  'high': { label: 'Poor', color: 'text-warning', bgColor: 'bg-warning/20', borderColor: 'border-warning' },
  'very-high': { label: 'Critical', color: 'text-destructive', bgColor: 'bg-destructive/20', borderColor: 'border-destructive' },
};

export function WebcamView({ onVideoReady, isLoading, landmarks, isDetecting, rulaScores, fullscreen = false }: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
          onVideoReady(videoRef.current!);
        };
      }
    } catch (err) {
      setCameraError('Unable to access camera. Please check permissions.');
    }
  }, [onVideoReady]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  // Get color based on score
  const getScoreColor = (score: number, maxScore: number): string => {
    const percentage = score / maxScore;
    if (percentage <= 0.33) return 'rgba(34, 197, 94, 0.9)'; // green - success
    if (percentage <= 0.66) return 'rgba(234, 179, 8, 0.9)'; // yellow - warning
    return 'rgba(239, 68, 68, 0.9)'; // red - danger
  };

  // Map connections to body parts for coloring
  const getConnectionColor = (start: number, end: number): string => {
    if (!rulaScores) return 'rgba(34, 197, 94, 0.9)';
    
    // Shoulders line
    if ((start === 11 && end === 12)) {
      return getScoreColor(rulaScores.trunk, 6);
    }
    // Upper arms (shoulder to elbow)
    if ((start === 11 && end === 13) || (start === 12 && end === 14)) {
      return getScoreColor(rulaScores.upperArm, 6);
    }
    // Lower arms (elbow to wrist)
    if ((start === 13 && end === 15) || (start === 14 && end === 16)) {
      return getScoreColor(rulaScores.lowerArm, 3);
    }
    // Trunk (shoulders to hips)
    if ((start === 11 && end === 23) || (start === 12 && end === 24)) {
      return getScoreColor(rulaScores.trunk, 6);
    }
    // Hips
    if (start === 23 && end === 24) {
      return getScoreColor(rulaScores.trunk, 6);
    }
    
    return 'rgba(34, 197, 94, 0.9)';
  };

  // Draw skeleton overlay
  useEffect(() => {
    if (!landmarks || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    const landmarkArray = [
      undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, landmarks.leftEar, landmarks.rightEar,
      undefined, undefined,
      landmarks.leftShoulder, landmarks.rightShoulder,
      landmarks.leftElbow, landmarks.rightElbow,
      landmarks.leftWrist, landmarks.rightWrist,
      undefined, undefined, undefined, undefined,
      undefined, undefined,
      landmarks.leftHip, landmarks.rightHip,
    ];

    // Draw connections with individual colors
    POSE_CONNECTIONS.forEach(([start, end]) => {
      const startLandmark = landmarkArray[start];
      const endLandmark = landmarkArray[end];
      
      if (startLandmark && endLandmark) {
        const color = getConnectionColor(start, end);
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(startLandmark.x * canvas.width, startLandmark.y * canvas.height);
        ctx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw head/neck indicator
    if (landmarks.nose && landmarks.leftShoulder && landmarks.rightShoulder) {
      const neckColor = rulaScores ? getScoreColor(rulaScores.neck, 6) : 'rgba(34, 197, 94, 0.9)';
      const shoulderMidX = (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2;
      const shoulderMidY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
      
      ctx.strokeStyle = neckColor;
      ctx.beginPath();
      ctx.moveTo(shoulderMidX * canvas.width, shoulderMidY * canvas.height);
      ctx.lineTo(landmarks.nose.x * canvas.width, landmarks.nose.y * canvas.height);
      ctx.stroke();
      
      // Draw head circle
      ctx.beginPath();
      ctx.arc(landmarks.nose.x * canvas.width, landmarks.nose.y * canvas.height, 15, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw landmark points with matching colors
    const getLandmarkColor = (key: string): string => {
      if (!rulaScores) return '#22c55e';
      
      if (key === 'nose' || key === 'leftEar' || key === 'rightEar') {
        return getScoreColor(rulaScores.neck, 6).replace('0.9', '1');
      }
      if (key === 'leftShoulder' || key === 'rightShoulder') {
        return getScoreColor(rulaScores.upperArm, 6).replace('0.9', '1');
      }
      if (key === 'leftElbow' || key === 'rightElbow') {
        return getScoreColor(rulaScores.lowerArm, 3).replace('0.9', '1');
      }
      if (key === 'leftWrist' || key === 'rightWrist') {
        return getScoreColor(rulaScores.wrist, 4).replace('0.9', '1');
      }
      if (key === 'leftHip' || key === 'rightHip') {
        return getScoreColor(rulaScores.trunk, 6).replace('0.9', '1');
      }
      return '#22c55e';
    };

    Object.entries(landmarks).forEach(([key, landmark]) => {
      if (landmark) {
        ctx.fillStyle = getLandmarkColor(key);
        ctx.beginPath();
        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = getLandmarkColor(key);
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }, [landmarks, rulaScores]);

  return (
    <div className={fullscreen ? "w-full h-full" : "glass-card overflow-hidden"}>
      <div className={`relative bg-background ${fullscreen ? "w-full h-full" : "aspect-video"}`}>
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {cameraError ? (
              <>
                <CameraOff className="w-16 h-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center px-4">{cameraError}</p>
                <Button onClick={startCamera} variant="default">
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Camera className="w-12 h-12 text-primary" />
                </motion.div>
                <p className="text-muted-foreground text-sm">Enable camera for posture detection</p>
                <Button onClick={startCamera} className="gap-2">
                  <Camera className="w-4 h-4" />
                  Start Camera
                </Button>
              </>
            )}
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)', display: cameraActive ? 'block' : 'none' }}
          playsInline
          muted
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Initializing AI model...</p>
            </div>
          </div>
        )}


        {/* Camera side indicator */}
        {cameraActive && rulaScores && rulaScores.cameraSide !== 'unknown' && (
          <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-xs text-muted-foreground">
              Camera: {rulaScores.cameraSide === 'left' ? 'Left side' : 'Right side'}
            </span>
          </div>
        )}

        {/* Status indicator */}
        {cameraActive && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <motion.div
              className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-success' : 'bg-warning'}`}
              animate={{ opacity: isDetecting ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs text-muted-foreground">
              {isDetecting ? 'Analyzing' : 'Waiting...'}
            </span>
          </div>
        )}

        {/* Stop button */}
        {cameraActive && (
          <Button
            onClick={stopCamera}
            variant="ghost"
            size="sm"
            className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm hover:bg-card/90"
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}
