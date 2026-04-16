export type BodyPart =
  | 'head' | 'neck' | 'leftShoulder' | 'rightShoulder' | 'chest'
  | 'leftArm' | 'rightArm' | 'leftForearm' | 'rightForearm'
  | 'abdomen' | 'leftHip' | 'rightHip' | 'leftThigh' | 'rightThigh'
  | 'leftKnee' | 'rightKnee' | 'leftShin' | 'rightShin'
  | 'leftFoot' | 'rightFoot' | 'lowerBack';

export const MUSCLE_TO_BODY_PARTS: Record<string, BodyPart[]> = {
  pectoralis_major: ['chest'], pectoralis_minor: ['chest'], chest: ['chest'],
  serratus_anterior: ['chest', 'abdomen'],
  deltoid_anterior: ['leftShoulder', 'rightShoulder'],
  deltoid_lateral: ['leftShoulder', 'rightShoulder'],
  deltoid_posterior: ['leftShoulder', 'rightShoulder'],
  deltoids: ['leftShoulder', 'rightShoulder'], shoulders: ['leftShoulder', 'rightShoulder'],
  latissimus_dorsi: ['lowerBack'], lats: ['lowerBack'],
  trapezius: ['leftShoulder', 'rightShoulder', 'neck'], traps: ['leftShoulder', 'rightShoulder', 'neck'],
  rhomboids: ['lowerBack'], erector_spinae: ['lowerBack'], lower_back: ['lowerBack'],
  back: ['lowerBack', 'leftShoulder', 'rightShoulder'],
  teres_major: ['lowerBack', 'leftShoulder', 'rightShoulder'],
  teres_minor: ['lowerBack', 'leftShoulder', 'rightShoulder'],
  infraspinatus: ['lowerBack', 'leftShoulder', 'rightShoulder'],
  supraspinatus: ['leftShoulder', 'rightShoulder'],
  biceps_brachii: ['leftArm', 'rightArm'], biceps: ['leftArm', 'rightArm'],
  brachialis: ['leftArm', 'rightArm'], brachioradialis: ['leftForearm', 'rightForearm'],
  triceps_brachii: ['leftArm', 'rightArm'], triceps: ['leftArm', 'rightArm'],
  triceps_long_head: ['leftArm', 'rightArm'], triceps_lateral_head: ['leftArm', 'rightArm'],
  forearms: ['leftForearm', 'rightForearm'], flexors: ['leftForearm', 'rightForearm'],
  extensors: ['leftForearm', 'rightForearm'], wrist_flexors: ['leftForearm', 'rightForearm'],
  rectus_abdominis: ['abdomen'], abs: ['abdomen'], core: ['abdomen'],
  obliques: ['abdomen', 'leftHip', 'rightHip'], transverse_abdominis: ['abdomen'],
  gluteus_maximus: ['leftHip', 'rightHip'], gluteus_medius: ['leftHip', 'rightHip'],
  gluteus_minimus: ['leftHip', 'rightHip'], glutes: ['leftHip', 'rightHip'],
  hip_flexors: ['leftHip', 'rightHip'], iliopsoas: ['leftHip', 'rightHip'], piriformis: ['leftHip', 'rightHip'],
  quadriceps: ['leftThigh', 'rightThigh'], quads: ['leftThigh', 'rightThigh'],
  rectus_femoris: ['leftThigh', 'rightThigh'], vastus_lateralis: ['leftThigh', 'rightThigh'],
  vastus_medialis: ['leftThigh', 'rightThigh'],
  hamstrings: ['leftThigh', 'rightThigh'], biceps_femoris: ['leftThigh', 'rightThigh'],
  semitendinosus: ['leftThigh', 'rightThigh'], semimembranosus: ['leftThigh', 'rightThigh'],
  adductors: ['leftThigh', 'rightThigh'], abductors: ['leftThigh', 'rightThigh'],
  inner_thigh: ['leftThigh', 'rightThigh'],
  gastrocnemius: ['leftShin', 'rightShin'], soleus: ['leftShin', 'rightShin'],
  calves: ['leftShin', 'rightShin'], tibialis_anterior: ['leftShin', 'rightShin'],
  peroneals: ['leftShin', 'rightShin'],
  full_body: ['chest','abdomen','leftShoulder','rightShoulder','leftArm','rightArm','leftThigh','rightThigh','leftShin','rightShin','lowerBack'],
  cardio: ['chest','abdomen','leftThigh','rightThigh','leftShin','rightShin'],
};

export function musclesToBodyParts(muscles: string[]): BodyPart[] {
  const parts = new Set<BodyPart>();
  for (const muscle of muscles) {
    const normalized = muscle.toLowerCase().replace(/\s+/g, '_');
    const mapped = MUSCLE_TO_BODY_PARTS[normalized];
    if (mapped) { for (const part of mapped) parts.add(part); }
  }
  return Array.from(parts);
}

export function categoryToBodyParts(category: string): BodyPart[] {
  const map: Record<string, BodyPart[]> = {
    chest:     ['chest', 'leftShoulder', 'rightShoulder', 'leftArm', 'rightArm'],
    back:      ['lowerBack', 'leftShoulder', 'rightShoulder'],
    shoulders: ['leftShoulder', 'rightShoulder'],
    biceps:    ['leftArm', 'rightArm'],
    triceps:   ['leftArm', 'rightArm'],
    legs:      ['leftThigh','rightThigh','leftShin','rightShin','leftHip','rightHip'],
    glutes:    ['leftHip', 'rightHip'],
    abs:       ['abdomen'],
    cardio:    ['chest','abdomen','leftThigh','rightThigh','leftShin','rightShin'],
    compound:  ['chest','lowerBack','leftThigh','rightThigh','leftShoulder','rightShoulder'],
    olympic:   ['chest','lowerBack','leftThigh','rightThigh','leftShoulder','rightShoulder','leftArm','rightArm'],
    mobility:  ['leftHip','rightHip','lowerBack','leftShin','rightShin'],
    stretching:['lowerBack','leftThigh','rightThigh','leftHip','rightHip'],
  };
  return map[category] ?? [];
}
