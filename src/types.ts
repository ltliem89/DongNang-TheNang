export type Language = 'vi' | 'en';

export type ActiveTab = 'kinetic' | 'potential' | 'hydro' | 'challenges';

export interface CarConfig {
  id: string;
  nameVi: string;
  nameEn: string;
  mass: number; // 1, 2, 4 kg
  color: string;
  iconType: 'compact' | 'sedan' | 'truck';
}

export interface KineticRunResult {
  mass: number;
  speed: number;
  kineticEnergy: number;
  impactDistance: number;
  timestamp: number;
  obstacleType?: 'friction' | 'elastic' | 'viscous';
  obstacleDistance?: number;
  resistanceValue?: number;
  vehicleId?: string;
  vehicleName?: string;
  obstacleId?: string;
  obstacleName?: string;
  obstacleMass?: number;
  impactUnit?: 'cm' | 'm';
}

export interface PotentialData {
  mass: number; // 1, 2, 4 kg
  height: number; // 1 to 5 m
  gravity: number; // 10 N/kg
  slopeVisualAngle: number; // visual angle: 30, 45, 60 deg
}

export interface HydroState {
  initialHeight: number; // e.g. 4 m or 8 m
  mass: number; // e.g. 2 kg or 4 kg
  g: number; // 10
  progress: number; // 0 (top) to 1 (bottom)
  isPlaying: boolean;
  speedFactor: number;
}

export interface Challenge {
  id: number;
  titleVi: string;
  titleEn: string;
  questionVi: string;
  questionEn: string;
  optionsVi: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationVi: string;
  explanationEn: string;
  hintVi: string;
  hintEn: string;
  misconceptionRef?: string;
}

export interface MisconceptionItem {
  id: string;
  code: string;
  titleVi: string;
  titleEn: string;
  misconceptionVi: string;
  misconceptionEn: string;
  scientificFeedbackVi: string;
  scientificFeedbackEn: string;
  formulaHighlight: string;
}
