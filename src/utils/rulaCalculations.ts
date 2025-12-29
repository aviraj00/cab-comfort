// RULA (Rapid Upper Limb Assessment) Score Calculation
// Based on McAtamney & Corlett (1993)
// Adapted for side-view camera (left or right of driver)

export interface PostureLandmarks {
  nose?: { x: number; y: number; z?: number };
  leftShoulder?: { x: number; y: number; z?: number };
  rightShoulder?: { x: number; y: number; z?: number };
  leftElbow?: { x: number; y: number; z?: number };
  rightElbow?: { x: number; y: number; z?: number };
  leftWrist?: { x: number; y: number; z?: number };
  rightWrist?: { x: number; y: number; z?: number };
  leftHip?: { x: number; y: number; z?: number };
  rightHip?: { x: number; y: number; z?: number };
  leftEar?: { x: number; y: number; z?: number };
  rightEar?: { x: number; y: number; z?: number };
}

export interface RULAScores {
  upperArm: number;
  lowerArm: number;
  wrist: number;
  neck: number;
  trunk: number;
  finalScore: number;
  risk: 'low' | 'medium' | 'high' | 'very-high';
  recommendations: string[];
  cameraSide: 'left' | 'right' | 'unknown';
}

export type CameraSide = 'left' | 'right' | 'unknown';

// Auto-detect camera side based on which body parts are more visible
// Camera on RIGHT of driver: sees driver's LEFT side (left landmarks visible, facing left in image)
// Camera on LEFT of driver: sees driver's RIGHT side (right landmarks visible, facing right in image)
function detectCameraSide(landmarks: PostureLandmarks): CameraSide {
  const leftScore = [
    landmarks.leftShoulder,
    landmarks.leftElbow,
    landmarks.leftWrist,
    landmarks.leftHip,
    landmarks.leftEar,
  ].filter(Boolean).length;
  
  const rightScore = [
    landmarks.rightShoulder,
    landmarks.rightElbow,
    landmarks.rightWrist,
    landmarks.rightHip,
    landmarks.rightEar,
  ].filter(Boolean).length;
  
  // If we see more left landmarks, camera is on right side of driver
  // If we see more right landmarks, camera is on left side of driver
  if (leftScore > rightScore) return 'right';
  if (rightScore > leftScore) return 'left';
  
  // If equal, check nose position relative to shoulders for facing direction
  if (landmarks.nose && landmarks.leftShoulder && landmarks.rightShoulder) {
    const shoulderMidX = (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2;
    // If nose is left of shoulder center, likely facing left (camera on right)
    if (landmarks.nose.x < shoulderMidX) return 'right';
    return 'left';
  }
  
  return 'unknown';
}

// Get primary landmarks based on camera side
function getPrimaryLandmarks(landmarks: PostureLandmarks, cameraSide: CameraSide) {
  // Camera on right sees left side, camera on left sees right side
  const useLeft = cameraSide === 'right' || cameraSide === 'unknown';
  
  return {
    shoulder: useLeft ? (landmarks.leftShoulder || landmarks.rightShoulder) : (landmarks.rightShoulder || landmarks.leftShoulder),
    elbow: useLeft ? (landmarks.leftElbow || landmarks.rightElbow) : (landmarks.rightElbow || landmarks.leftElbow),
    wrist: useLeft ? (landmarks.leftWrist || landmarks.rightWrist) : (landmarks.rightWrist || landmarks.leftWrist),
    hip: useLeft ? (landmarks.leftHip || landmarks.rightHip) : (landmarks.rightHip || landmarks.leftHip),
    ear: useLeft ? (landmarks.leftEar || landmarks.rightEar) : (landmarks.rightEar || landmarks.leftEar),
  };
}

// Calculate angle between three points (returns 0-180)
function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// Calculate angle of a limb from DOWNWARD vertical (arm hanging = 0°, arm forward = positive)
// In image coords: y increases downward, x increases rightward
function calculateArmAngleFromDown(
  shoulder: { x: number; y: number },
  elbow: { x: number; y: number },
  cameraSide: CameraSide
): number {
  // Vector from shoulder to elbow
  let dx = elbow.x - shoulder.x;
  const dy = elbow.y - shoulder.y; // Positive = elbow below shoulder
  
  // For left-side camera, driver faces right, so forward is +x
  // For right-side camera, driver faces left, so forward is -x
  // Normalize so forward is always positive dx
  if (cameraSide === 'right') {
    dx = -dx;
  }
  
  // atan2(dx, dy): angle from downward vertical
  // dx=0, dy>0 (arm hanging): 0°
  // dx>0, dy=0 (arm horizontal forward): 90°
  // dx>0, dy>0 (arm forward and down): 0-90°
  const angle = Math.atan2(dx, dy) * (180 / Math.PI);
  
  return angle;
}

// Upper Arm Score (1-4) - Angle from vertical (hanging down)
// Good driving: arm extended forward 45-90° from vertical toward steering wheel
function getUpperArmScore(landmarks: PostureLandmarks, cameraSide: CameraSide): number {
  const { shoulder, elbow } = getPrimaryLandmarks(landmarks, cameraSide);
  
  if (!shoulder || !elbow) return 2;
  
  const armAngle = calculateArmAngleFromDown(shoulder, elbow, cameraSide);
  
  console.log('Upper arm angle from vertical:', armAngle.toFixed(1), '°');
  
  // Driving position: arms forward to steering wheel
  // 45-90° forward from hanging position is ideal
  if (armAngle >= 30 && armAngle <= 90) return 1; // Ideal driving position
  if (armAngle >= 15 && armAngle < 30) return 2; // Arms a bit low
  if (armAngle > 90 && armAngle <= 110) return 2; // Arms high but ok
  if (armAngle >= 0 && armAngle < 15) return 3; // Arms hanging too low
  if (armAngle > 110) return 3; // Arms too high
  return 4; // Poor position (arms behind or very awkward)
}

// Lower Arm Score (1-3) - Elbow bend angle (inner angle at elbow)
// Good driving: elbow bent at 60-120° for comfortable wheel grip
function getLowerArmScore(landmarks: PostureLandmarks, cameraSide: CameraSide): number {
  const { shoulder, elbow, wrist } = getPrimaryLandmarks(landmarks, cameraSide);
  
  if (!shoulder || !elbow || !wrist) return 2;
  
  // Calculate the inner angle at the elbow
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  
  console.log('Elbow bend angle:', elbowAngle.toFixed(1), '°');
  
  // For driving, elbow typically bent 60-120° when gripping steering wheel
  if (elbowAngle >= 60 && elbowAngle <= 120) return 1; // Ideal
  if (elbowAngle >= 45 && elbowAngle < 60) return 2; // Slightly tight bend
  if (elbowAngle > 120 && elbowAngle <= 150) return 2; // Arms slightly straight
  return 3; // Too bent or too straight
}

// Wrist Score (1-4) - Limited from side view
function getWristScore(): number {
  return 1; // Cannot accurately assess wrist from side view
}

// Neck Score (1-4) - Forward head posture check
function getNeckScore(landmarks: PostureLandmarks, cameraSide: CameraSide): number {
  const { ear, shoulder } = getPrimaryLandmarks(landmarks, cameraSide);
  
  if (!ear || !shoulder) return 2;
  
  const verticalDist = Math.abs(shoulder.y - ear.y);
  if (verticalDist === 0) return 2;
  
  // Calculate forward head displacement
  // For right-side camera: ear.x < shoulder.x = forward head (bad)
  // For left-side camera: ear.x > shoulder.x = forward head (bad)
  let headForward: number;
  if (cameraSide === 'left') {
    headForward = ear.x - shoulder.x; // Positive = forward
  } else {
    headForward = shoulder.x - ear.x; // Positive = forward
  }
  
  const forwardRatio = headForward / verticalDist;
  
  if (forwardRatio <= 0.15) return 1; // Excellent - head aligned/back
  if (forwardRatio <= 0.3) return 2; // Slight forward head
  if (forwardRatio <= 0.5) return 3; // Moderate forward head
  return 4; // Severe forward head posture
}

// Trunk Score (1-4) - Spine angle from vertical
function getTrunkScore(landmarks: PostureLandmarks, cameraSide: CameraSide): number {
  const { shoulder, hip } = getPrimaryLandmarks(landmarks, cameraSide);
  
  if (!shoulder || !hip) return 2;
  
  // Calculate trunk lean from vertical
  // Vector from hip (lower) to shoulder (upper)
  let dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y; // Negative when shoulder is above hip (normal)
  
  // Normalize direction based on camera side
  // Left-side camera: driver faces right, forward lean = shoulder.x > hip.x = positive dx
  // Right-side camera: driver faces left, forward lean = shoulder.x < hip.x = negative dx
  if (cameraSide === 'right') {
    dx = -dx;
  }
  
  // Calculate angle from UPWARD vertical
  // For upright sitting: dx ≈ 0, dy < 0 → angle ≈ 0
  // For forward lean: dx > 0 → positive angle
  // For recline: dx < 0 → negative angle
  const trunkAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
  
  console.log('Trunk angle from vertical:', trunkAngle.toFixed(1), '°');
  
  // Good driving: slight recline (-25°) to slightly forward (20°)
  if (trunkAngle >= -25 && trunkAngle <= 20) return 1; // Ideal
  if (trunkAngle > 20 && trunkAngle <= 35) return 2; // Slight forward lean
  if (trunkAngle < -25 && trunkAngle >= -40) return 2; // Reclined but ok
  if (trunkAngle > 35 && trunkAngle <= 50) return 3; // Forward slouch
  return 4; // Poor trunk position
}

// RULA Table A (Wrist/Arm scores)
const tableA: number[][][] = [
  // Wrist 1
  [[1, 2, 2, 2, 3], [2, 2, 2, 2, 3], [2, 3, 3, 3, 4]],
  // Wrist 2
  [[2, 2, 2, 3, 3], [2, 2, 2, 3, 3], [2, 3, 3, 3, 4]],
  // Wrist 3
  [[2, 3, 3, 3, 4], [2, 3, 3, 3, 4], [2, 3, 4, 4, 5]],
  // Wrist 4
  [[3, 3, 3, 4, 4], [3, 3, 3, 4, 4], [3, 3, 4, 4, 5]],
];

// RULA Table B (Neck/Trunk scores)
const tableB: number[][] = [
  [1, 2, 3, 5, 7, 8],
  [2, 2, 3, 5, 7, 8],
  [3, 3, 3, 5, 7, 8],
  [5, 5, 5, 6, 7, 8],
  [7, 7, 7, 7, 7, 8],
  [8, 8, 8, 8, 8, 8],
];

// Final RULA Table C
const tableC: number[][] = [
  [1, 2, 3, 3, 4, 5, 5],
  [2, 2, 3, 4, 4, 5, 5],
  [3, 3, 3, 4, 4, 5, 6],
  [3, 3, 3, 4, 5, 6, 6],
  [4, 4, 4, 5, 6, 7, 7],
  [4, 4, 5, 6, 6, 7, 7],
  [5, 5, 6, 6, 7, 7, 7],
  [5, 5, 6, 7, 7, 7, 7],
];

function getRecommendations(scores: Partial<RULAScores>): string[] {
  const recommendations: string[] = [];
  
  if ((scores.upperArm || 0) >= 3) {
    recommendations.push("Adjust steering wheel height - arms should be relaxed at 9 and 3 position");
  }
  if ((scores.lowerArm || 0) >= 3) {
    recommendations.push("Move seat closer/further - elbows should be slightly bent");
  }
  if ((scores.neck || 0) >= 3) {
    recommendations.push("Adjust headrest - keep head against it while looking at road");
  }
  if ((scores.trunk || 0) >= 3) {
    recommendations.push("Adjust seat recline - slight backward tilt reduces back strain");
  }
  if ((scores.wrist || 0) >= 3) {
    recommendations.push("Relax grip on wheel - wrists should be straight, not bent");
  }
  if (recommendations.length === 0) {
    recommendations.push("Excellent driving posture! Stay safe on the road!");
  }
  
  return recommendations;
}

export function calculateRULAScore(landmarks: PostureLandmarks): RULAScores {
  // Auto-detect camera side
  const cameraSide = detectCameraSide(landmarks);
  
  const upperArm = getUpperArmScore(landmarks, cameraSide);
  const lowerArm = getLowerArmScore(landmarks, cameraSide);
  const wrist = getWristScore();
  const neck = getNeckScore(landmarks, cameraSide);
  const trunk = getTrunkScore(landmarks, cameraSide);
  
  // Get Table A score (wrist/arm)
  const wristIdx = Math.min(wrist - 1, 3);
  const lowerArmIdx = Math.min(lowerArm - 1, 2);
  const upperArmIdx = Math.min(upperArm - 1, 4);
  const scoreA = tableA[wristIdx]?.[lowerArmIdx]?.[upperArmIdx] || 3;
  
  // Get Table B score (neck/trunk)
  const neckIdx = Math.min(neck - 1, 5);
  const trunkIdx = Math.min(trunk - 1, 5);
  const scoreB = tableB[neckIdx]?.[trunkIdx] || 4;
  
  // Get Final Score from Table C
  const finalScore = tableC[Math.min(scoreA - 1, 7)]?.[Math.min(scoreB - 1, 6)] || 5;
  
  // Determine risk level
  let risk: 'low' | 'medium' | 'high' | 'very-high';
  if (finalScore <= 2) risk = 'low';
  else if (finalScore <= 4) risk = 'medium';
  else if (finalScore <= 6) risk = 'high';
  else risk = 'very-high';
  
  const recommendations = getRecommendations({ upperArm, lowerArm, wrist, neck, trunk });
  
  return {
    upperArm,
    lowerArm,
    wrist,
    neck,
    trunk,
    finalScore,
    risk,
    recommendations,
    cameraSide,
  };
}
