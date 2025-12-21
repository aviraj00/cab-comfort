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

// Upper Arm Score (1-6)
function getUpperArmScore(landmarks: PostureLandmarks): number {
  if (!landmarks.leftShoulder || !landmarks.leftElbow || !landmarks.leftHip) return 3;
  
  const angle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftShoulder,
    landmarks.leftElbow
  );
  
  // Extension/flexion scoring
  if (angle >= 160 && angle <= 200) return 1; // 20° extension to 20° flexion
  if (angle >= 140 && angle < 160) return 2; // 20° to 45° flexion
  if (angle >= 110 && angle < 140) return 3; // 45° to 90° flexion
  if (angle < 110) return 4; // >90° flexion
  if (angle > 200 && angle <= 220) return 2; // extension
  return 4;
}

// Lower Arm Score (1-3)
function getLowerArmScore(landmarks: PostureLandmarks): number {
  if (!landmarks.leftShoulder || !landmarks.leftElbow || !landmarks.leftWrist) return 2;
  
  const angle = calculateAngle(
    landmarks.leftShoulder,
    landmarks.leftElbow,
    landmarks.leftWrist
  );
  
  if (angle >= 60 && angle <= 100) return 1; // 60-100° flexion
  return 2; // <60° or >100°
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

// Neck Score (1-6)
function getNeckScore(landmarks: PostureLandmarks): number {
  if (!landmarks.nose || !landmarks.leftShoulder || !landmarks.rightShoulder) return 3;
  
  // Calculate midpoint of shoulders
  const shoulderMid = {
    x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
    y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2,
  };
  
  // Neck flexion angle
  const neckAngle = calculateVerticalAngle(shoulderMid, landmarks.nose);
  
  if (neckAngle >= 0 && neckAngle <= 10) return 1; // 0-10° flexion
  if (neckAngle > 10 && neckAngle <= 20) return 2; // 10-20° flexion
  if (neckAngle > 20) return 3; // >20° flexion
  if (neckAngle < 0 && neckAngle >= -10) return 2; // Slight extension
  return 4; // Extension
}

// Trunk Score (1-6)
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
  
  const trunkAngle = Math.abs(calculateVerticalAngle(hipMid, shoulderMid));
  
  if (trunkAngle <= 5) return 1; // Upright
  if (trunkAngle <= 20) return 2; // 0-20° flexion
  if (trunkAngle <= 60) return 3; // 20-60° flexion
  return 4; // >60° flexion
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
    recommendations.push("Lower your arms closer to your body");
  }
  if ((scores.neck || 0) >= 3) {
    recommendations.push("Straighten your neck - avoid forward head posture");
  }
  if ((scores.trunk || 0) >= 3) {
    recommendations.push("Sit upright - avoid slouching forward");
  }
  if ((scores.wrist || 0) >= 3) {
    recommendations.push("Keep wrists in neutral position on the wheel");
  }
  if (recommendations.length === 0) {
    recommendations.push("Great posture! Keep it up!");
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
