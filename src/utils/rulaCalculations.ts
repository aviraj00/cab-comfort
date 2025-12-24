// RULA (Rapid Upper Limb Assessment) Score Calculation
// Based on McAtamney & Corlett (1993)

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
}

// Calculate angle between three points
function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Calculate the vertical angle of a limb
function calculateVerticalAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dx, dy) * (180 / Math.PI);
}

// Upper Arm Score (1-6) - Calibrated for driving posture
// Good driving: arms forward at ~45-70° to reach steering wheel
function getUpperArmScore(landmarks: PostureLandmarks): number {
  if (!landmarks.leftShoulder || !landmarks.leftElbow || !landmarks.leftHip) return 3;
  
  const angle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftShoulder,
    landmarks.leftElbow
  );
  
  // Driving-specific scoring (arms extended forward to wheel)
  if (angle >= 120 && angle <= 160) return 1; // Ideal driving position (45-70° forward)
  if (angle >= 100 && angle < 120) return 2; // Slightly high arms
  if (angle > 160 && angle <= 180) return 2; // Arms slightly low
  if (angle >= 80 && angle < 100) return 3; // Arms too high
  if (angle > 180 && angle <= 200) return 3; // Arms too low
  return 4; // Poor arm position
}

// Lower Arm Score (1-3) - Calibrated for driving posture
// Good driving: elbows bent ~90-120° for comfortable wheel grip
function getLowerArmScore(landmarks: PostureLandmarks): number {
  if (!landmarks.leftShoulder || !landmarks.leftElbow || !landmarks.leftWrist) return 2;
  
  const angle = calculateAngle(
    landmarks.leftShoulder,
    landmarks.leftElbow,
    landmarks.leftWrist
  );
  
  // Driving-specific scoring (relaxed elbow bend for steering)
  if (angle >= 90 && angle <= 140) return 1; // Ideal for steering wheel grip
  if (angle >= 70 && angle < 90) return 2; // Slightly tight
  if (angle > 140 && angle <= 160) return 2; // Arms slightly extended
  return 3; // Poor elbow position
}

// Wrist Score (1-4)
function getWristScore(landmarks: PostureLandmarks): number {
  if (!landmarks.leftElbow || !landmarks.leftWrist) return 2;
  
  // Simplified wrist assessment based on wrist position relative to forearm
  const verticalAngle = calculateVerticalAngle(landmarks.leftElbow, landmarks.leftWrist);
  
  if (Math.abs(verticalAngle) <= 15) return 1; // Neutral
  if (Math.abs(verticalAngle) <= 30) return 2; // Slight deviation
  if (Math.abs(verticalAngle) <= 45) return 3; // Moderate deviation
  return 4; // Significant deviation
}

// Neck Score (1-6) - Calibrated for driving posture
// Good driving: slight forward tilt to watch road, head against headrest
function getNeckScore(landmarks: PostureLandmarks): number {
  if (!landmarks.nose || !landmarks.leftShoulder || !landmarks.rightShoulder) return 3;
  
  // Calculate midpoint of shoulders
  const shoulderMid = {
    x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
    y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2,
  };
  
  // Neck flexion angle
  const neckAngle = calculateVerticalAngle(shoulderMid, landmarks.nose);
  
  // Driving-specific scoring (slight forward lean is natural)
  if (neckAngle >= -5 && neckAngle <= 15) return 1; // Ideal driving neck position
  if (neckAngle > 15 && neckAngle <= 25) return 2; // Slightly forward
  if (neckAngle < -5 && neckAngle >= -15) return 2; // Slight recline (ok for driving)
  if (neckAngle > 25 && neckAngle <= 35) return 3; // Too forward
  return 4; // Poor neck position
}

// Trunk Score (1-6) - Calibrated for driving posture
// Good driving: slight recline (~100-110° seat angle is ideal)
function getTrunkScore(landmarks: PostureLandmarks): number {
  if (!landmarks.leftShoulder || !landmarks.rightShoulder || !landmarks.leftHip || !landmarks.rightHip) return 2;
  
  const shoulderMid = {
    x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
    y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2,
  };
  
  const hipMid = {
    x: (landmarks.leftHip.x + landmarks.rightHip.x) / 2,
    y: (landmarks.leftHip.y + landmarks.rightHip.y) / 2,
  };
  
  const trunkAngle = calculateVerticalAngle(hipMid, shoulderMid);
  
  // Driving-specific scoring (slight recline is optimal)
  if (trunkAngle >= -15 && trunkAngle <= 15) return 1; // Good driving posture (slight recline ok)
  if (trunkAngle > 15 && trunkAngle <= 25) return 2; // Slight forward lean
  if (trunkAngle < -15 && trunkAngle >= -25) return 2; // Reclined (acceptable for driving)
  if (trunkAngle > 25 && trunkAngle <= 40) return 3; // Leaning forward
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
  const upperArm = getUpperArmScore(landmarks);
  const lowerArm = getLowerArmScore(landmarks);
  const wrist = getWristScore(landmarks);
  const neck = getNeckScore(landmarks);
  const trunk = getTrunkScore(landmarks);
  
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
  };
}
