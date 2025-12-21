import { useState, useCallback, useRef, useEffect } from 'react';
import { PostureLandmarks, RULAScores, calculateRULAScore } from '@/utils/rulaCalculations';

interface UsePoseDetectionResult {
  isLoading: boolean;
  error: string | null;
  rulaScores: RULAScores | null;
  landmarks: PostureLandmarks | null;
  startDetection: (videoElement: HTMLVideoElement) => Promise<void>;
  stopDetection: () => void;
  isDetecting: boolean;
}

// MediaPipe landmark indices
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

export function usePoseDetection(): UsePoseDetectionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulaScores, setRulaScores] = useState<RULAScores | null>(null);
  const [landmarks, setLandmarks] = useState<PostureLandmarks | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const animationFrameRef = useRef<number | null>(null);
  const poseLandmarkerRef = useRef<any>(null);

  const extractLandmarks = useCallback((poseLandmarks: any[]): PostureLandmarks => {
    const getLandmark = (index: number) => {
      const landmark = poseLandmarks[index];
      if (landmark) {
        return { x: landmark.x, y: landmark.y, z: landmark.z };
      }
      return undefined;
    };

    return {
      nose: getLandmark(POSE_LANDMARKS.NOSE),
      leftEar: getLandmark(POSE_LANDMARKS.LEFT_EAR),
      rightEar: getLandmark(POSE_LANDMARKS.RIGHT_EAR),
      leftShoulder: getLandmark(POSE_LANDMARKS.LEFT_SHOULDER),
      rightShoulder: getLandmark(POSE_LANDMARKS.RIGHT_SHOULDER),
      leftElbow: getLandmark(POSE_LANDMARKS.LEFT_ELBOW),
      rightElbow: getLandmark(POSE_LANDMARKS.RIGHT_ELBOW),
      leftWrist: getLandmark(POSE_LANDMARKS.LEFT_WRIST),
      rightWrist: getLandmark(POSE_LANDMARKS.RIGHT_WRIST),
      leftHip: getLandmark(POSE_LANDMARKS.LEFT_HIP),
      rightHip: getLandmark(POSE_LANDMARKS.RIGHT_HIP),
    };
  }, []);

  const startDetection = useCallback(async (videoElement: HTMLVideoElement) => {
    setIsLoading(true);
    setError(null);

    try {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      setIsLoading(false);
      setIsDetecting(true);

      let lastTimestamp = -1;

      const detectPose = () => {
        if (!poseLandmarkerRef.current || !videoElement || videoElement.paused) {
          animationFrameRef.current = requestAnimationFrame(detectPose);
          return;
        }

        const timestamp = performance.now();
        if (timestamp !== lastTimestamp) {
          lastTimestamp = timestamp;
          
          try {
            const results = poseLandmarkerRef.current.detectForVideo(videoElement, timestamp);
            
            if (results.landmarks && results.landmarks.length > 0) {
              const extractedLandmarks = extractLandmarks(results.landmarks[0]);
              setLandmarks(extractedLandmarks);
              
              const scores = calculateRULAScore(extractedLandmarks);
              setRulaScores(scores);
            }
          } catch (e) {
            // Silently handle detection errors to keep the loop running
          }
        }

        animationFrameRef.current = requestAnimationFrame(detectPose);
      };

      detectPose();
    } catch (e) {
      setError('Failed to initialize pose detection. Please check your camera permissions.');
      setIsLoading(false);
    }
  }, [extractLandmarks]);

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (poseLandmarkerRef.current) {
      poseLandmarkerRef.current.close();
      poseLandmarkerRef.current = null;
    }
    setIsDetecting(false);
    setRulaScores(null);
    setLandmarks(null);
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isLoading,
    error,
    rulaScores,
    landmarks,
    startDetection,
    stopDetection,
    isDetecting,
  };
}
