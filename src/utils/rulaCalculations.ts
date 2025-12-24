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

// Calculate angle from vertical (0° = straight up, positive = forward lean)
// For side view: y increases downward in image coordinates
function calculateAngleFromVertical(
  bottom: { x: number; y: number },
  top: { x: number; y: number }
): number {
  const dx = top.x - bottom.x;
  const dy = bottom.y - top.y; // Invert because y increases downward
  return Math.atan2(dx, dy) * (180 / Math.PI);
}

// Upper Arm Score (1-4) - Side view: shoulder to elbow angle from vertical
// Good driving: arm extended forward ~20-45° from vertical to reach wheel
function getUpperArmScore(landmarks: PostureLandmarks): number {
  const shoulder = landmarks.leftShoulder || landmarks.rightShoulder;
  const elbow = landmarks.leftElbow || landmarks.rightElbow;
  
  if (!shoulder || !elbow) return 2;
  
  const armAngle = Math.abs(calculateAngleFromVertical(shoulder, elbow));
  
  if (armAngle >= 20 && armAngle <= 45) return 1; // Ideal: 20-45° forward
  if (armAngle >= 0 && armAngle < 20) return 2; // Arms too vertical
  if (armAngle > 45 && armAngle <= 60) return 2; // Slightly extended
  if (armAngle > 60 && armAngle <= 90) return 3; // Too far forward
  return 4; // Arms in poor position
}

// Lower Arm Score (1-3) - Elbow bend angle
// Good driving: elbow bent 80-120° for comfortable steering
function getLowerArmScore(landmarks: PostureLandmarks): number {
  const shoulder = landmarks.leftShoulder || landmarks.rightShoulder;
  const elbow = landmarks.leftElbow || landmarks.rightElbow;
  const wrist = landmarks.leftWrist || landmarks.rightWrist;
  
  if (!shoulder || !elbow || !wrist) return 2;
  
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  
  if (elbowAngle >= 80 && elbowAngle <= 120) return 1; // Ideal bend
  if (elbowAngle >= 60 && elbowAngle < 80) return 2; // Slightly acute
  if (elbowAngle > 120 && elbowAngle <= 150) return 2; // Slightly extended
  return 3; // Poor elbow position
}

// Wrist Score (1-4) - Limited from side view, default to neutral
function getWristScore(landmarks: PostureLandmarks): number {
  return 1; // Cannot accurately assess wrist from side view
}

// Neck Score (1-4) - Side view: forward head posture check
// Good driving: ear aligned with or behind shoulder (head against headrest)
function getNeckScore(landmarks: PostureLandmarks): number {
  const ear = landmarks.leftEar || landmarks.rightEar;
  const shoulder = landmarks.leftShoulder || landmarks.rightShoulder;
  
  if (!ear || !shoulder) return 2;
  
  // Forward head: ear ahead of shoulder line
  const headForward = shoulder.x - ear.x; // Positive = head forward
  const verticalDist = Math.abs(shoulder.y - ear.y);
  
  if (verticalDist === 0) return 2;
  
  const forwardRatio = headForward / verticalDist;
  
  if (forwardRatio <= 0.1) return 1; // Excellent - ear aligned/behind shoulder
  if (forwardRatio <= 0.25) return 2; // Slight forward head
  if (forwardRatio <= 0.4) return 3; // Moderate forward head
  return 4; // Severe forward head posture
}

// Trunk Score (1-4) - Side view: spine angle from vertical
// Good driving: upright to slight recline (-5 to 15° from vertical)
function getTrunkScore(landmarks: PostureLandmarks): number {
  const shoulder = landmarks.leftShoulder || landmarks.rightShoulder;
  const hip = landmarks.leftHip || landmarks.rightHip;
  
  if (!shoulder || !hip) return 2;
  
  const trunkAngle = calculateAngleFromVertical(hip, shoulder);
  
  if (trunkAngle >= -20 && trunkAngle <= 15) return 1; // Ideal: slight recline to upright
  if (trunkAngle > 15 && trunkAngle <= 25) return 2; // Slight forward lean
  if (trunkAngle < -20 && trunkAngle >= -35) return 2; // Too reclined but ok
  if (trunkAngle > 25 && trunkAngle <= 40) return 3; // Forward slouch
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
