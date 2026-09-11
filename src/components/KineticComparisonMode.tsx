import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { DICTIONARY } from '../locales/i18n';
import {
  ALL_VEHICLES,
  LAB_VEHICLES,
  REAL_VEHICLES,
  OBSTACLE_MODELS,
  VehicleModel,
  ObstacleModel,
  calculateKineticEnergy,
  formatEnergy,
  formatDistance,
} from '../data/kineticData';
import { VehicleGraphic, ObstacleGraphic } from './KineticGraphics';
import {
  playRatchetSound,
  playLaunchSound,
  playImpactSound,
  playSkidSound,
  playSuccessChime,
} from '../utils/sound';
import {
  Flame,
  RotateCcw,
  Clock,
  Sparkles,
  TrendingUp,
  Zap,
  Scale,
  Gauge,
  Car,
  Truck,
  Bike,
  Box,
  CheckCircle2,
  ArrowRight,
  Sliders,
  MoveHorizontal,
  Layers,
} from 'lucide-react';

interface KineticComparisonModeProps {
  lang: Language;
}

interface LaneConfig {
  vehicle: VehicleModel;
  mass: number;
  speed: number;
  pullback: number;
}

interface ComparisonPreset {
  id: string;
  nameVi: string;
  nameEn: string;
  tagVi: string;
  tagEn: string;
  explanationVi: string;
  explanationEn: string;
  lane1: {
    vehicleId: string;
    mass: number;
    speed: number;
  };
  lane2: {
    vehicleId: string;
    mass: number;
    speed: number;
  };
}

const COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    id: 'double-speed',
    nameVi: 'Thí nghiệm 1: Gấp đôi vận tốc (v2 = 2·v1, cùng m = 1 kg)',
    nameEn: 'Experiment 1: Double the Speed (v2 = 2·v1, same m = 1 kg)',
    tagVi: 'Quy luật bình phương v²',
    tagEn: 'Quadratic v² Law',
    explanationVi:
      'Cùng khối lượng 1 kg: Xe 1 (2 m/s) có Wđ = 2 J, Xe 2 (4 m/s) có Wđ = 8 J. Tốc độ tăng 2 lần → Động năng và quãng đường đẩy vật cản tăng GẤP 4 LẦN (2² = 4)!',
    explanationEn:
      'Same mass 1 kg: Car 1 (2 m/s) has Ek = 2 J, Car 2 (4 m/s) has Ek = 8 J. Double speed → Kinetic energy and push distance increase 4 TIMES (2² = 4)!',
    lane1: { vehicleId: 'lab-1', mass: 1, speed: 2 },
    lane2: { vehicleId: 'lab-1', mass: 1, speed: 4 },
  },
  {
    id: 'double-mass',
    nameVi: 'Thí nghiệm 2: Gấp đôi khối lượng (m2 = 2·m1, cùng v = 4 m/s)',
    nameEn: 'Experiment 2: Double the Mass (m2 = 2·m1, same v = 4 m/s)',
    tagVi: 'Tỉ lệ thuận với m',
    tagEn: 'Directly Proportional to m',
    explanationVi:
      'Cùng tốc độ 4 m/s: Xe 1 (1 kg) có Wđ = 8 J, Xe 2 (2 kg) có Wđ = 16 J. Khối lượng tăng 2 lần → Động năng và quãng đường đẩy vật cản tăng GẤP 2 LẦN!',
    explanationEn:
      'Same speed 4 m/s: Car 1 (1 kg) has Ek = 8 J, Car 2 (2 kg) has Ek = 16 J. Double mass → Kinetic energy and push distance increase 2 TIMES!',
    lane1: { vehicleId: 'lab-1', mass: 1, speed: 4 },
    lane2: { vehicleId: 'lab-2', mass: 2, speed: 4 },
  },
  {
    id: 'quad-mass',
    nameVi: 'Thí nghiệm 3: Xe 1 kg vs Xe 4 kg (m2 = 4·m1, cùng v = 4 m/s)',
    nameEn: 'Experiment 3: 1 kg vs 4 kg Cart (m2 = 4·m1, same v = 4 m/s)',
    tagVi: 'Khối lượng tăng 4 lần',
    tagEn: 'Mass increases 4x',
    explanationVi:
      'Cùng tốc độ 4 m/s: Xe 1 kg có Wđ = 8 J (đẩy 80 cm), Xe 4 kg có Wđ = 32 J (đẩy 320 cm). Khối lượng tăng 4 lần → Động năng tăng GẤP 4 LẦN!',
    explanationEn:
      'Same speed 4 m/s: 1 kg cart has Ek = 8 J (slides 80 cm), 4 kg cart has Ek = 32 J (slides 320 cm). Mass 4x → Kinetic energy 4x!',
    lane1: { vehicleId: 'lab-1', mass: 1, speed: 4 },
    lane2: { vehicleId: 'lab-4', mass: 4, speed: 4 },
  },
  {
    id: 'real-moto-vs-car',
    nameVi: 'Thí nghiệm 4: Xe máy (120 kg) vs Ô tô con (1.500 kg) ở 54 km/h',
    nameEn: 'Experiment 4: Motorbike (120 kg) vs Sedan (1,500 kg) at 54 km/h',
    tagVi: 'Giao thông thực tế',
    tagEn: 'Real-world Traffic',
    explanationVi:
      'Ở cùng tốc độ 15 m/s (54 km/h): Xe máy có Wđ = 13,5 kJ, còn ô tô nặng gấp 12,5 lần nên có Wđ = 168,8 kJ (gấp 12,5 lần)! Sức công phá và quán tính của ô tô lớn hơn rất nhiều.',
    explanationEn:
      'At the same speed 15 m/s (54 km/h): Motorbike has Ek = 13.5 kJ, while sedan weighs 12.5x more so Ek = 168.8 kJ (12.5x greater)!',
    lane1: { vehicleId: 'real-moto', mass: 120, speed: 15 },
    lane2: { vehicleId: 'real-car', mass: 1500, speed: 15 },
  },
  {
    id: 'real-speed-doubled',
    nameVi: 'Thí nghiệm 5: Ô tô chạy 54 km/h vs 108 km/h (Cảnh báo tai nạn)',
    nameEn: 'Experiment 5: Car at 54 km/h vs 108 km/h (Crash Severity Warning)',
    tagVi: 'Hiểm họa phóng nhanh v²',
    tagEn: 'Speeding Hazard v²',
    explanationVi:
      'Cùng ô tô 1.500 kg: Tốc độ từ 15 m/s (54 km/h) lên 30 m/s (108 km/h) chỉ gấp đôi, nhưng động năng vọt từ 168,8 kJ lên 675 kJ (TĂNG GẤP 4 LẦN)! Quãng đường phanh và tổn hại tai nạn tăng gấp 4 lần.',
    explanationEn:
      'Same 1,500 kg car: Speed doubles from 54 km/h to 108 km/h, but kinetic energy jumps from 168.8 kJ to 675 kJ (INCREASES 4 TIMES)! Braking distance and crash severity multiply by 4.',
    lane1: { vehicleId: 'real-car', mass: 1500, speed: 15 },
    lane2: { vehicleId: 'real-car', mass: 1500, speed: 30 },
  },
];

export const KineticComparisonMode: React.FC<KineticComparisonModeProps> = ({ lang }) => {
  const isVi = lang === 'vi';

  // Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('double-speed');

  // Shared Obstacle Model (Standard textbook foam block or customized)
  const [obstacleId, setObstacleId] = useState<string>('foam');
  const obstacle: ObstacleModel =
    OBSTACLE_MODELS.find((o) => o.id === obstacleId) || OBSTACLE_MODELS[0];
  const [obstacleMass, setObstacleMass] = useState<number>(obstacle.defaultMass);
  const obstacleDistance = 240; // Fixed identical distance for fair side-by-side comparison

  // LANE 1 CONFIGURATION (Xe A - Hổ phách/Amber)
  const [lane1VehicleId, setLane1VehicleId] = useState<string>('lab-1');
  const lane1Vehicle = ALL_VEHICLES.find((v) => v.id === lane1VehicleId) || LAB_VEHICLES[0];
  const [lane1Mass, setLane1Mass] = useState<number>(1);
  const [lane1Speed, setLane1Speed] = useState<number>(2);

  // LANE 2 CONFIGURATION (Xe B - Lam/Sky)
  const [lane2VehicleId, setLane2VehicleId] = useState<string>('lab-1');
  const lane2Vehicle = ALL_VEHICLES.find((v) => v.id === lane2VehicleId) || LAB_VEHICLES[0];
  const [lane2Mass, setLane2Mass] = useState<number>(1);
  const [lane2Speed, setLane2Speed] = useState<number>(4);

  // Simulation Controls & Animation States
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);

  // Lane 1 Dynamics
  const [lane1CarX, setLane1CarX] = useState<number>(-50);
  const [lane1BlockX, setLane1BlockX] = useState<number>(0);
  const [lane1WheelAngle, setLane1WheelAngle] = useState<number>(0);
  const [lane1Spark, setLane1Spark] = useState<boolean>(false);
  const [lane1Phase, setLane1Phase] = useState<'idle' | 'spring' | 'cruise' | 'impact' | 'stopped'>('idle');

  // Lane 2 Dynamics
  const [lane2CarX, setLane2CarX] = useState<number>(-80);
  const [lane2BlockX, setLane2BlockX] = useState<number>(0);
  const [lane2WheelAngle, setLane2WheelAngle] = useState<number>(0);
  const [lane2Spark, setLane2Spark] = useState<boolean>(false);
  const [lane2Phase, setLane2Phase] = useState<'idle' | 'spring' | 'cruise' | 'impact' | 'stopped'>('idle');

  const animFrameRef = useRef<number | null>(null);

  // Friction resistance force: Fc = mu * M * g (g = 10 N/kg)
  const frictionForce = Math.max(1, Math.round(obstacle.frictionCoeff * obstacleMass * 10));

  // Physics Calculations for Lane 1
  const energy1 = calculateKineticEnergy(lane1Mass, lane1Speed);
  const energy1Display = formatEnergy(energy1);
  const dist1Meters = energy1 / frictionForce;
  const dist1Formatted = formatDistance(dist1Meters);

  // Physics Calculations for Lane 2
  const energy2 = calculateKineticEnergy(lane2Mass, lane2Speed);
  const energy2Display = formatEnergy(energy2);
  const dist2Meters = energy2 / frictionForce;
  const dist2Formatted = formatDistance(dist2Meters);

  // Comparison Ratios
  const massRatio = lane1Mass > 0 ? (lane2Mass / lane1Mass).toFixed(1) : '1.0';
  const speedRatio = lane1Speed > 0 ? (lane2Speed / lane1Speed).toFixed(1) : '1.0';
  const speedSquaredRatio =
    lane1Speed > 0 ? Math.round(((lane2Speed * lane2Speed) / (lane1Speed * lane1Speed)) * 10) / 10 : 1;
  const energyRatio =
    energy1 > 0 ? Math.round((energy2 / energy1) * 10) / 10 : 1;
  const distanceRatio =
    dist1Meters > 0 ? Math.round((dist2Meters / dist1Meters) * 10) / 10 : 1;

  // Visual Pullback calculation
  const getPullback = (speed: number, maxV: number) => {
    return Math.max(25, Math.min(125, Math.round((speed / maxV) * 120)));
  };

  const lane1Pullback = getPullback(lane1Speed, lane1Vehicle.maxSpeed);
  const lane2Pullback = getPullback(lane2Speed, lane2Vehicle.maxSpeed);

  // Sync Car positions on idle
  useEffect(() => {
    if (!isSimulating) {
      setLane1CarX(-lane1Pullback);
      setLane2CarX(-lane2Pullback);
    }
  }, [lane1Pullback, lane2Pullback, isSimulating]);

  // Load Preset
  const handleSelectPreset = (preset: ComparisonPreset) => {
    if (isSimulating) return;
    setSelectedPresetId(preset.id);

    const v1 = ALL_VEHICLES.find((v) => v.id === preset.lane1.vehicleId) || LAB_VEHICLES[0];
    const v2 = ALL_VEHICLES.find((v) => v.id === preset.lane2.vehicleId) || LAB_VEHICLES[0];

    setLane1VehicleId(v1.id);
    setLane1Mass(preset.lane1.mass);
    setLane1Speed(preset.lane1.speed);

    setLane2VehicleId(v2.id);
    setLane2Mass(preset.lane2.mass);
    setLane2Speed(preset.lane2.speed);

    // Auto-adjust obstacle if comparing real vehicles
    if (v1.category === 'real' || v2.category === 'real') {
      setObstacleId('wood');
      setObstacleMass(80);
    } else {
      setObstacleId('foam');
      setObstacleMass(1);
    }

    resetBothLanes();
    playRatchetSound(1.2);
  };

  // Reset Both Lanes
  const resetBothLanes = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsSimulating(false);

    setLane1Phase('idle');
    setLane1CarX(-lane1Pullback);
    setLane1BlockX(0);
    setLane1Spark(false);

    setLane2Phase('idle');
    setLane2CarX(-lane2Pullback);
    setLane2BlockX(0);
    setLane2Spark(false);
  };

  // Launch Dual Simulation Simultaneously
  const launchSimultaneous = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    setLane1BlockX(0);
    setLane2BlockX(0);
    setLane1Spark(false);
    setLane2Spark(false);

    playLaunchSound(Math.min(10, Math.max(lane1Speed, lane2Speed)));

    const timeScale = isSlowMo ? 3.5 : 1.0;
    const barrierX = obstacleDistance;

    // Visual Slide Scaling in px (capped at 290px to stay nicely on track)
    let visualSlide1 = 0;
    let visualSlide2 = 0;

    if (lane1Vehicle.category === 'lab' && obstacle.id === 'foam') {
      visualSlide1 = Math.min(290, dist1Meters * 100 * 0.8);
    } else {
      const r1 = Math.min(1, dist1Meters / 25);
      visualSlide1 = Math.min(290, Math.max(15, 20 + r1 * 250));
    }

    if (lane2Vehicle.category === 'lab' && obstacle.id === 'foam') {
      visualSlide2 = Math.min(290, dist2Meters * 100 * 0.8);
    } else {
      const r2 = Math.min(1, dist2Meters / 25);
      visualSlide2 = Math.min(290, Math.max(15, 20 + r2 * 250));
    }

    // Lane 1 Durations
    const springDur1 = (180 + Math.min(450, lane1Mass * 15)) * timeScale;
    const cruiseDur1 = Math.max(180, (barrierX / Math.max(10, lane1Speed * 18)) * 550) * timeScale;
    const impactDur1 = (450 + Math.min(500, energy1 * 0.05)) * timeScale;
    const totalTime1 = springDur1 + cruiseDur1 + impactDur1;

    // Lane 2 Durations
    const springDur2 = (180 + Math.min(450, lane2Mass * 15)) * timeScale;
    const cruiseDur2 = Math.max(180, (barrierX / Math.max(10, lane2Speed * 18)) * 550) * timeScale;
    const impactDur2 = (450 + Math.min(500, energy2 * 0.05)) * timeScale;
    const totalTime2 = springDur2 + cruiseDur2 + impactDur2;

    const maxTotalTime = Math.max(totalTime1, totalTime2);
    const t0 = performance.now();

    setLane1Phase('spring');
    setLane2Phase('spring');

    let soundPlayed1 = false;
    let soundPlayed2 = false;

    const loop = (now: number) => {
      const elapsed = now - t0;

      // UPDATE LANE 1
      if (elapsed < springDur1) {
        setLane1Phase('spring');
        const p = elapsed / springDur1;
        setLane1CarX(-lane1Pullback + lane1Pullback * (p * p));
        setLane1WheelAngle((prev) => (prev + lane1Speed * 15 * (1 / timeScale)) % 360);
      } else if (elapsed < springDur1 + cruiseDur1) {
        setLane1Phase('cruise');
        const p = Math.min(1, (elapsed - springDur1) / cruiseDur1);
        setLane1CarX(barrierX * p);
        setLane1WheelAngle((prev) => (prev + lane1Speed * 20 * (1 / timeScale)) % 360);
      } else if (elapsed < totalTime1) {
        setLane1Phase('impact');
        if (!soundPlayed1) {
          soundPlayed1 = true;
          setLane1Spark(true);
          playImpactSound(Math.min(80, energy1));
          playSkidSound();
          setTimeout(() => setLane1Spark(false), 300);
        }
        const p = Math.min(1, (elapsed - springDur1 - cruiseDur1) / impactDur1);
        const easeOut = 1 - Math.pow(1 - p, 3);
        const currentSlide = visualSlide1 * easeOut;
        setLane1BlockX(currentSlide);
        setLane1CarX(barrierX + currentSlide);
      } else {
        setLane1Phase('stopped');
        setLane1BlockX(visualSlide1);
        setLane1CarX(barrierX + visualSlide1);
      }

      // UPDATE LANE 2
      if (elapsed < springDur2) {
        setLane2Phase('spring');
        const p = elapsed / springDur2;
        setLane2CarX(-lane2Pullback + lane2Pullback * (p * p));
        setLane2WheelAngle((prev) => (prev + lane2Speed * 15 * (1 / timeScale)) % 360);
      } else if (elapsed < springDur2 + cruiseDur2) {
        setLane2Phase('cruise');
        const p = Math.min(1, (elapsed - springDur2) / cruiseDur2);
        setLane2CarX(barrierX * p);
        setLane2WheelAngle((prev) => (prev + lane2Speed * 20 * (1 / timeScale)) % 360);
      } else if (elapsed < totalTime2) {
        setLane2Phase('impact');
        if (!soundPlayed2) {
          soundPlayed2 = true;
          setLane2Spark(true);
          playImpactSound(Math.min(80, energy2));
          playSkidSound();
          setTimeout(() => setLane2Spark(false), 300);
        }
        const p = Math.min(1, (elapsed - springDur2 - cruiseDur2) / impactDur2);
        const easeOut = 1 - Math.pow(1 - p, 3);
        const currentSlide = visualSlide2 * easeOut;
        setLane2BlockX(currentSlide);
        setLane2CarX(barrierX + currentSlide);
      } else {
        setLane2Phase('stopped');
        setLane2BlockX(visualSlide2);
        setLane2CarX(barrierX + visualSlide2);
      }

      // Check if both finished
      if (elapsed < maxTotalTime) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        setIsSimulating(false);
        setLane1Phase('stopped');
        setLane2Phase('stopped');
        setLane1BlockX(visualSlide1);
        setLane2BlockX(visualSlide2);
        setLane1CarX(barrierX + visualSlide1);
        setLane2CarX(barrierX + visualSlide2);
        playSuccessChime();
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const currentPreset = COMPARISON_PRESETS.find((p) => p.id === selectedPresetId);

  return (
    <div className="space-y-6">
      {/* 1. CURATED COMPARISON BENCHMARK PRESETS (THÍ NGHIỆM ĐỐI CHỨNG CHUẨN KHTN 9) */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isVi
                  ? 'KỊCH BẢN THÍ NGHIỆM ĐỐI CHỨNG MẪU (BÀI 18 KHTN 9 & AN TOÀN GIAO THÔNG)'
                  : 'CURATED COMPARISON BENCHMARKS (KHTN 9 LESSON 18 & ROAD SAFETY)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isVi
                  ? 'Bấm chọn 1 kịch bản để nạp tự động thông số 2 làn, hoặc tự do tùy chỉnh khối lượng (m) và tốc độ (v) bên dưới'
                  : 'Click a preset to auto-load 2 lanes, or freely customize mass (m) and speed (v) below'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSlowMo(!isSlowMo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                isSlowMo
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isSlowMo ? (isVi ? 'Quay chậm 0.25x' : 'Slow-Mo 0.25x') : (isVi ? 'Tốc độ thực 1.0x' : 'Real-time 1.0x')}</span>
            </button>
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {COMPARISON_PRESETS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                disabled={isSimulating}
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/20 to-sky-500/20 border-amber-400 text-white shadow-md ring-1 ring-amber-400/50'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isVi ? p.tagVi : p.tagEn}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                  </div>
                  <h4 className="text-xs font-bold leading-snug line-clamp-2">
                    {isVi ? p.nameVi : p.nameEn}
                  </h4>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400 flex justify-between font-mono">
                  <span className="text-amber-300 font-semibold">Làn 1: {p.lane1.mass}kg • {p.lane1.speed}m/s</span>
                  <span className="text-sky-300 font-semibold">Làn 2: {p.lane2.mass}kg • {p.lane2.speed}m/s</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Preset Pedagogy Note */}
        {currentPreset && (
          <div className="mt-3 p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/30 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-300">
                {isVi ? 'Phân tích khoa học trọng tâm: ' : 'Core Scientific Principle: '}
              </span>
              <span className="text-slate-200">
                {isVi ? currentPreset.explanationVi : currentPreset.explanationEn}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. MASTER LAUNCH CONTROLLER STRIP */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Dynamic Comparison Telemetry Summary */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-200 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-sans font-medium text-slate-400">Làn 1:</span>
            <span className="font-bold text-white">{lane1Vehicle.shortName}</span>
            <span className="text-slate-400">({lane1Mass}kg, {lane1Speed}m/s)</span>
            <span className="text-amber-400 font-bold ml-1">Wđ1 = {energy1Display.main}</span>
          </div>

          <div className="text-slate-500 font-bold">vs</div>

          <div className="flex items-center gap-1.5 bg-sky-950/60 px-3 py-1.5 rounded-lg border border-sky-500/40 text-sky-200 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="font-sans font-medium text-slate-400">Làn 2:</span>
            <span className="font-bold text-white">{lane2Vehicle.shortName}</span>
            <span className="text-slate-400">({lane2Mass}kg, {lane2Speed}m/s)</span>
            <span className="text-sky-400 font-bold ml-1">Wđ2 = {energy2Display.main}</span>
          </div>

          {/* Ratio Flag */}
          <div className="px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-400/40 text-purple-200 font-mono font-bold text-xs flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-purple-300" />
            <span>Wđ2 / Wđ1 = {energyRatio}x</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="dual-simultaneous-launch-btn"
            disabled={isSimulating}
            onClick={launchSimultaneous}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg active:scale-95 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer animate-pulse"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>{isVi ? 'PHÓNG CÙNG LÚC 2 XE 🚀' : 'SIMULTANEOUS LAUNCH 🚀'}</span>
          </button>

          <button
            id="dual-reset-btn"
            onClick={resetBothLanes}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            title={isVi ? 'Đặt lại cả 2 đường chạy' : 'Reset Both Tracks'}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isVi ? 'Đặt lại' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* 3. TWIN PARALLEL RACE TRACKS (LÀN 1 & LÀN 2 CHẠY SONG SONG) */}
      <div className="space-y-4">
        {/* ======================================================== */}
        {/* TRACK 1 (LÀN A - XE 1) */}
        {/* ======================================================== */}
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-amber-500/30 shadow-md">
          {/* Lane 1 Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="font-extrabold text-amber-300">ĐƯỜNG CHẠY 1 (LÀN A):</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {lane1Vehicle.nameVi} — m₁ = {lane1Mass.toLocaleString('vi-VN')} kg
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-sky-400 font-bold">
                v₁ = {lane1Speed} m/s ({(lane1Speed * 3.6).toFixed(0)} km/h)
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Wđ₁ = {energy1Display.main}
              </span>
              <span className="text-amber-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Dự kiến trượt: +{dist1Formatted.label}
              </span>
            </div>
          </div>

          {/* Lane 1 Canvas Track */}
          <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-800/90 overflow-x-auto shadow-inner select-none p-1.5">
            <div className="min-w-[760px] h-38 relative overflow-hidden">
              {/* Distance Ruler */}
              <div className="absolute inset-x-0 bottom-4 h-5 border-t border-slate-700/60 flex items-center">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ left: `${140 + i * 50}px` }}
                    className="absolute h-2 border-l border-slate-600 flex flex-col items-center"
                  >
                    <span className="text-[8.5px] font-mono text-slate-500 -mt-2.5">
                      {i * 50}cm
                    </span>
                  </div>
                ))}
              </div>

              {/* Lane Bed */}
              <div className="absolute inset-x-0 bottom-4 h-3.5 bg-slate-800/80 border-y border-slate-700">
                <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,#f59e0b_0,#f59e0b_15px,transparent_15px,transparent_30px)]" />
              </div>

              {/* Start Line */}
              <div style={{ left: '140px' }} className="absolute top-0 bottom-4 w-0.5 bg-amber-500/80 z-10 pointer-events-none">
                <div className="absolute top-1 -left-5 px-1 bg-amber-500 text-slate-950 font-mono text-[8px] font-bold rounded">
                  0cm
                </div>
              </div>

              {/* Obstacle Base Line */}
              <div
                style={{ left: `${140 + obstacleDistance}px` }}
                className="absolute top-0 bottom-4 w-0.5 border-r border-dashed border-indigo-400/50 z-10 pointer-events-none"
              >
                <div className="absolute top-1 -left-7 px-1 bg-indigo-950 text-indigo-300 font-mono text-[8px] rounded border border-indigo-500/40">
                  +{obstacleDistance}cm
                </div>
              </div>

              {/* SVG Spring and Visual Effects */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                <rect x="14" y="38" width="8" height="48" fill="#334155" stroke="#64748b" strokeWidth="1" rx="2" />
                <circle cx="22" cy="62" r="4" fill="#f59e0b" />
                {(() => {
                  const springAnchorX = 22;
                  const springEndY = 62;
                  const endX =
                    lane1Phase === 'cruise' || lane1Phase === 'impact' || lane1Phase === 'stopped'
                      ? 140
                      : Math.max(springAnchorX + 15, 140 + lane1CarX);
                  const coils = 10;
                  const dx = (endX - springAnchorX) / coils;
                  let pathStr = `M ${springAnchorX},${springEndY}`;
                  for (let i = 0; i < coils; i++) {
                    const cx1 = springAnchorX + (i + 0.25) * dx;
                    const cy1 = springEndY - (i % 2 === 0 ? 8 : -8);
                    const cx2 = springAnchorX + (i + 0.75) * dx;
                    const cy2 = springEndY + (i % 2 === 0 ? 8 : -8);
                    const eX = springAnchorX + (i + 1) * dx;
                    pathStr += ` C ${cx1},${cy1} ${cx2},${cy2} ${eX},${springEndY}`;
                  }
                  return <path d={pathStr} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />;
                })()}

                {/* Impact Sparks */}
                {lane1Spark && (
                  <g transform={`translate(${140 + obstacleDistance}, 62)`}>
                    <circle r="20" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.9" />
                    <circle r="34" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />
                    <line x1="-12" y1="-12" x2="12" y2="12" stroke="#ffffff" strokeWidth="2" />
                    <line x1="-12" y1="12" x2="12" y2="-12" stroke="#ffffff" strokeWidth="2" />
                  </g>
                )}
              </svg>

              {/* Car 1 */}
              <div
                style={{
                  transform: `translateX(${140 + lane1CarX}px)`,
                  touchAction: 'none',
                }}
                className="absolute top-3 z-20 select-none transition-none"
              >
                <VehicleGraphic
                  vehicle={lane1Vehicle}
                  mass={lane1Mass}
                  speed={lane1Speed}
                  wheelAngle={lane1WheelAngle}
                  isSimulating={isSimulating}
                  pullback={lane1Pullback}
                  simPhase={lane1Phase}
                  onLaunch={launchSimultaneous}
                />
              </div>

              {/* Obstacle 1 */}
              <ObstacleGraphic
                obstacle={obstacle}
                obstacleMass={obstacleMass}
                frictionForce={frictionForce}
                obstacleDistance={obstacleDistance}
                blockX={lane1BlockX}
                isSimulating={isSimulating}
              />

              {/* Slide Measurement Bracket for Lane 1 */}
              {lane1Phase === 'stopped' && (
                <div
                  className="absolute top-26 h-5 flex items-center z-10 pointer-events-none"
                  style={{
                    left: `${140 + obstacleDistance}px`,
                    width: `${Math.max(30, lane1BlockX)}px`,
                  }}
                >
                  <div className="w-full border-b-2 border-amber-400 flex items-center justify-center relative">
                    <div className="absolute -top-3.5 bg-slate-950 px-1.5 py-0.2 text-[8.5px] font-mono font-bold text-amber-300 border border-amber-500/40 rounded whitespace-nowrap">
                      Δs₁ = +{dist1Formatted.label} (Wđ₁ = {energy1Display.main})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TRACK 2 (LÀN B - XE 2) */}
        {/* ======================================================== */}
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-sky-500/30 shadow-md">
          {/* Lane 2 Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
              <span className="font-extrabold text-sky-300">ĐƯỜNG CHẠY 2 (LÀN B):</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {lane2Vehicle.nameVi} — m₂ = {lane2Mass.toLocaleString('vi-VN')} kg
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-cyan-400 font-bold">
                v₂ = {lane2Speed} m/s ({(lane2Speed * 3.6).toFixed(0)} km/h)
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Wđ₂ = {energy2Display.main}
              </span>
              <span className="text-sky-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Dự kiến trượt: +{dist2Formatted.label}
              </span>
            </div>
          </div>

          {/* Lane 2 Canvas Track */}
          <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-800/90 overflow-x-auto shadow-inner select-none p-1.5">
            <div className="min-w-[760px] h-38 relative overflow-hidden">
              {/* Distance Ruler */}
              <div className="absolute inset-x-0 bottom-4 h-5 border-t border-slate-700/60 flex items-center">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ left: `${140 + i * 50}px` }}
                    className="absolute h-2 border-l border-slate-600 flex flex-col items-center"
                  >
                    <span className="text-[8.5px] font-mono text-slate-500 -mt-2.5">
                      {i * 50}cm
                    </span>
                  </div>
                ))}
              </div>

              {/* Lane Bed */}
              <div className="absolute inset-x-0 bottom-4 h-3.5 bg-slate-800/80 border-y border-slate-700">
                <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,#0ea5e9_0,#0ea5e9_15px,transparent_15px,transparent_30px)]" />
              </div>

              {/* Start Line */}
              <div style={{ left: '140px' }} className="absolute top-0 bottom-4 w-0.5 bg-sky-500/80 z-10 pointer-events-none">
                <div className="absolute top-1 -left-5 px-1 bg-sky-500 text-slate-950 font-mono text-[8px] font-bold rounded">
                  0cm
                </div>
              </div>

              {/* Obstacle Base Line */}
              <div
                style={{ left: `${140 + obstacleDistance}px` }}
                className="absolute top-0 bottom-4 w-0.5 border-r border-dashed border-indigo-400/50 z-10 pointer-events-none"
              >
                <div className="absolute top-1 -left-7 px-1 bg-indigo-950 text-indigo-300 font-mono text-[8px] rounded border border-indigo-500/40">
                  +{obstacleDistance}cm
                </div>
              </div>

              {/* SVG Spring and Visual Effects */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                <rect x="14" y="38" width="8" height="48" fill="#334155" stroke="#64748b" strokeWidth="1" rx="2" />
                <circle cx="22" cy="62" r="4" fill="#0ea5e9" />
                {(() => {
                  const springAnchorX = 22;
                  const springEndY = 62;
                  const endX =
                    lane2Phase === 'cruise' || lane2Phase === 'impact' || lane2Phase === 'stopped'
                      ? 140
                      : Math.max(springAnchorX + 15, 140 + lane2CarX);
                  const coils = 10;
                  const dx = (endX - springAnchorX) / coils;
                  let pathStr = `M ${springAnchorX},${springEndY}`;
                  for (let i = 0; i < coils; i++) {
                    const cx1 = springAnchorX + (i + 0.25) * dx;
                    const cy1 = springEndY - (i % 2 === 0 ? 8 : -8);
                    const cx2 = springAnchorX + (i + 0.75) * dx;
                    const cy2 = springEndY + (i % 2 === 0 ? 8 : -8);
                    const eX = springAnchorX + (i + 1) * dx;
                    pathStr += ` C ${cx1},${cy1} ${cx2},${cy2} ${eX},${springEndY}`;
                  }
                  return <path d={pathStr} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />;
                })()}

                {/* Impact Sparks */}
                {lane2Spark && (
                  <g transform={`translate(${140 + obstacleDistance}, 62)`}>
                    <circle r="20" fill="none" stroke="#0ea5e9" strokeWidth="3" opacity="0.9" />
                    <circle r="34" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />
                    <line x1="-12" y1="-12" x2="12" y2="12" stroke="#ffffff" strokeWidth="2" />
                    <line x1="-12" y1="12" x2="12" y2="-12" stroke="#ffffff" strokeWidth="2" />
                  </g>
                )}
              </svg>

              {/* Car 2 */}
              <div
                style={{
                  transform: `translateX(${140 + lane2CarX}px)`,
                  touchAction: 'none',
                }}
                className="absolute top-3 z-20 select-none transition-none"
              >
                <VehicleGraphic
                  vehicle={lane2Vehicle}
                  mass={lane2Mass}
                  speed={lane2Speed}
                  wheelAngle={lane2WheelAngle}
                  isSimulating={isSimulating}
                  pullback={lane2Pullback}
                  simPhase={lane2Phase}
                  onLaunch={launchSimultaneous}
                />
              </div>

              {/* Obstacle 2 */}
              <ObstacleGraphic
                obstacle={obstacle}
                obstacleMass={obstacleMass}
                frictionForce={frictionForce}
                obstacleDistance={obstacleDistance}
                blockX={lane2BlockX}
                isSimulating={isSimulating}
              />

              {/* Slide Measurement Bracket for Lane 2 */}
              {lane2Phase === 'stopped' && (
                <div
                  className="absolute top-26 h-5 flex items-center z-10 pointer-events-none"
                  style={{
                    left: `${140 + obstacleDistance}px`,
                    width: `${Math.max(30, lane2BlockX)}px`,
                  }}
                >
                  <div className="w-full border-b-2 border-sky-400 flex items-center justify-center relative">
                    <div className="absolute -top-3.5 bg-slate-950 px-1.5 py-0.2 text-[8.5px] font-mono font-bold text-sky-300 border border-sky-500/40 rounded whitespace-nowrap">
                      Δs₂ = +{dist2Formatted.label} (Wđ₂ = {energy2Display.main})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SIDE-BY-SIDE CONFIGURATION PANELS (LÀN 1 & LÀN 2 CONTROLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ======================================================== */}
        {/* PANEL LANE 1 CONFIGURATION */}
        {/* ======================================================== */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-amber-500/30 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>{isVi ? 'THIẾT LẬP XE 1 (LÀN A - MÀU HỔ PHÁCH)' : 'LANE 1 CONFIG (CAR A)'}</span>
            </div>
            <span className="text-slate-400 font-mono">
              Wđ₁ = ½·m₁·v₁² = <strong className="text-amber-400">{energy1Display.main}</strong>
            </span>
          </div>

          {/* 1. Vehicle Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              {isVi ? 'Chọn phương tiện Làn 1:' : 'Select Vehicle 1:'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_VEHICLES.map((v) => (
                <button
                  key={v.id}
                  disabled={isSimulating}
                  onClick={() => {
                    setLane1VehicleId(v.id);
                    setLane1Mass(v.defaultMass);
                    setLane1Speed(v.defaultSpeed);
                    resetBothLanes();
                  }}
                  className={`p-1.5 rounded-lg text-left transition border cursor-pointer ${
                    lane1VehicleId === v.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[10.5px] truncate">{v.shortName}</div>
                  <div className="text-[9px] text-slate-400">{v.defaultMass}kg</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Mass Slider */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-300 font-medium">
                {isVi ? 'Khối lượng xe 1 (m₁):' : 'Car 1 Mass (m₁):'}
              </span>
              <span className="font-mono font-bold text-amber-300 text-xs">
                {lane1Mass.toLocaleString('vi-VN')} kg
              </span>
            </div>
            <input
              type="range"
              min={lane1Vehicle.minMass}
              max={lane1Vehicle.maxMass}
              step={lane1Vehicle.massStep}
              value={lane1Mass}
              disabled={isSimulating}
              onChange={(e) => {
                setLane1Mass(Number(e.target.value));
                resetBothLanes();
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* 3. Speed Slider & Presets */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-300 font-medium">
                {isVi ? 'Tốc độ xe 1 (v₁):' : 'Car 1 Speed (v₁):'}
              </span>
              <span className="font-mono font-bold text-sky-400 text-xs">
                {lane1Speed} m/s ({(lane1Speed * 3.6).toFixed(0)} km/h)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {lane1Vehicle.speedPresets.map((preset) => (
                <button
                  key={preset.mps}
                  disabled={isSimulating}
                  onClick={() => {
                    setLane1Speed(preset.mps);
                    resetBothLanes();
                  }}
                  className={`py-1 rounded text-center border cursor-pointer ${
                    Math.abs(lane1Speed - preset.mps) < 0.2
                      ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-mono">{preset.mps}m/s</div>
                  <div className="text-[8px] opacity-75">{(preset.mps * 3.6).toFixed(0)}km/h</div>
                </button>
              ))}
            </div>
            <input
              type="range"
              min={lane1Vehicle.minSpeed}
              max={lane1Vehicle.maxSpeed}
              step={lane1Vehicle.speedStep}
              value={lane1Speed}
              disabled={isSimulating}
              onChange={(e) => {
                setLane1Speed(Number(e.target.value));
                resetBothLanes();
              }}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* PANEL LANE 2 CONFIGURATION */}
        {/* ======================================================== */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-sky-500/30 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-sky-300 font-bold">
              <Scale className="w-4 h-4 text-sky-400" />
              <span>{isVi ? 'THIẾT LẬP XE 2 (LÀN B - MÀU XANH LAM)' : 'LANE 2 CONFIG (CAR B)'}</span>
            </div>
            <span className="text-slate-400 font-mono">
              Wđ₂ = ½·m₂·v₂² = <strong className="text-sky-400">{energy2Display.main}</strong>
            </span>
          </div>

          {/* 1. Vehicle Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              {isVi ? 'Chọn phương tiện Làn 2:' : 'Select Vehicle 2:'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_VEHICLES.map((v) => (
                <button
                  key={v.id}
                  disabled={isSimulating}
                  onClick={() => {
                    setLane2VehicleId(v.id);
                    setLane2Mass(v.defaultMass);
                    setLane2Speed(v.defaultSpeed);
                    resetBothLanes();
                  }}
                  className={`p-1.5 rounded-lg text-left transition border cursor-pointer ${
                    lane2VehicleId === v.id
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[10.5px] truncate">{v.shortName}</div>
                  <div className="text-[9px] text-slate-400">{v.defaultMass}kg</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Mass Slider */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-300 font-medium">
                {isVi ? 'Khối lượng xe 2 (m₂):' : 'Car 2 Mass (m₂):'}
              </span>
              <span className="font-mono font-bold text-sky-300 text-xs">
                {lane2Mass.toLocaleString('vi-VN')} kg
              </span>
            </div>
            <input
              type="range"
              min={lane2Vehicle.minMass}
              max={lane2Vehicle.maxMass}
              step={lane2Vehicle.massStep}
              value={lane2Mass}
              disabled={isSimulating}
              onChange={(e) => {
                setLane2Mass(Number(e.target.value));
                resetBothLanes();
              }}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* 3. Speed Slider & Presets */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-300 font-medium">
                {isVi ? 'Tốc độ xe 2 (v₂):' : 'Car 2 Speed (v₂):'}
              </span>
              <span className="font-mono font-bold text-cyan-400 text-xs">
                {lane2Speed} m/s ({(lane2Speed * 3.6).toFixed(0)} km/h)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {lane2Vehicle.speedPresets.map((preset) => (
                <button
                  key={preset.mps}
                  disabled={isSimulating}
                  onClick={() => {
                    setLane2Speed(preset.mps);
                    resetBothLanes();
                  }}
                  className={`py-1 rounded text-center border cursor-pointer ${
                    Math.abs(lane2Speed - preset.mps) < 0.2
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-mono">{preset.mps}m/s</div>
                  <div className="text-[8px] opacity-75">{(preset.mps * 3.6).toFixed(0)}km/h</div>
                </button>
              ))}
            </div>
            <input
              type="range"
              min={lane2Vehicle.minSpeed}
              max={lane2Vehicle.maxSpeed}
              step={lane2Vehicle.speedStep}
              value={lane2Speed}
              disabled={isSimulating}
              onChange={(e) => {
                setLane2Speed(Number(e.target.value));
                resetBothLanes();
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. SIDE-BY-SIDE VISUAL ENERGY MATRIX & QUANTITATIVE COMPARISON */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white">
              {isVi ? 'BẢNG SO SÁNH ĐỐI CHỨNG ĐỘNG NĂNG & CÔNG CẢN VA CHẠM' : 'KINETIC ENERGY & IMPACT COMPARISON MATRIX'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Định lí động năng: A_c = Fc · Δs = Wđ = ½·m·v²
          </span>
        </div>

        {/* Visual Comparison Bar Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Energy Comparison Bars */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isVi ? 'So sánh Động năng (Wđ):' : 'Kinetic Energy (Wđ):'}</span>
              </span>
              <span className="font-mono text-purple-300 font-bold text-xs bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                Wđ₂ = {energyRatio}x Wđ₁
              </span>
            </div>

            {/* Lane 1 Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-mono text-amber-300">
                <span>Làn 1 ({lane1Vehicle.shortName}):</span>
                <span className="font-bold">{energy1Display.main}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, Math.min(100, (energy1 / Math.max(energy1, energy2)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Lane 2 Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-mono text-sky-300">
                <span>Làn 2 ({lane2Vehicle.shortName}):</span>
                <span className="font-bold">{energy2Display.main}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, Math.min(100, (energy2 / Math.max(energy1, energy2)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Slide Displacement Comparison Bars */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <MoveHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isVi ? 'So sánh Độ dời vật cản (Δs):' : 'Slide Distance (Δs):'}</span>
              </span>
              <span className="font-mono text-emerald-300 font-bold text-xs bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                Δs₂ = {distanceRatio}x Δs₁
              </span>
            </div>

            {/* Lane 1 Slide */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-mono text-amber-300">
                <span>Làn 1 ({dist1Formatted.label}):</span>
                <span className="font-bold">+{dist1Formatted.label}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, Math.min(100, (dist1Meters / Math.max(dist1Meters, dist2Meters)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Lane 2 Slide */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-mono text-sky-300">
                <span>Làn 2 ({dist2Formatted.label}):</span>
                <span className="font-bold">+{dist2Formatted.label}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, Math.min(100, (dist2Meters / Math.max(dist1Meters, dist2Meters)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Side-by-Side Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3">Đại lượng đo lường</th>
                <th className="py-2 px-3 text-amber-300">Xe Làn 1 (A)</th>
                <th className="py-2 px-3 text-sky-300">Xe Làn 2 (B)</th>
                <th className="py-2 px-3 text-purple-300 text-right">Tỉ số so sánh (Làn 2 / Làn 1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-300">Khối lượng xe (m)</td>
                <td className="py-2 px-3 font-bold text-amber-300">{lane1Mass.toLocaleString('vi-VN')} kg</td>
                <td className="py-2 px-3 font-bold text-sky-300">{lane2Mass.toLocaleString('vi-VN')} kg</td>
                <td className="py-2 px-3 text-right font-bold text-purple-300">m₂ / m₁ = {massRatio}x</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-300">Tốc độ xe (v)</td>
                <td className="py-2 px-3 font-bold text-amber-300">{lane1Speed} m/s ({(lane1Speed * 3.6).toFixed(0)} km/h)</td>
                <td className="py-2 px-3 font-bold text-sky-300">{lane2Speed} m/s ({(lane2Speed * 3.6).toFixed(0)} km/h)</td>
                <td className="py-2 px-3 text-right font-bold text-purple-300">v₂ / v₁ = {speedRatio}x</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-300">Bình phương tốc độ (v²)</td>
                <td className="py-2 px-3 font-bold text-amber-300">{lane1Speed * lane1Speed} m²/s²</td>
                <td className="py-2 px-3 font-bold text-sky-300">{lane2Speed * lane2Speed} m²/s²</td>
                <td className="py-2 px-3 text-right font-bold text-purple-300">v₂² / v₁² = {speedSquaredRatio}x</td>
              </tr>
              <tr className="bg-emerald-950/20">
                <td className="py-2 px-3 font-sans font-bold text-emerald-400">Động năng xe (Wđ = ½·m·v²)</td>
                <td className="py-2 px-3 font-bold text-emerald-300">{energy1Display.main}</td>
                <td className="py-2 px-3 font-bold text-emerald-300">{energy2Display.main}</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-400 text-sm">Wđ₂ / Wđ₁ = {energyRatio}x</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-300">Quãng đường xô đẩy cản (Δs = Wđ / Fc)</td>
                <td className="py-2 px-3 font-bold text-amber-300">+{dist1Formatted.label}</td>
                <td className="py-2 px-3 font-bold text-sky-300">+{dist2Formatted.label}</td>
                <td className="py-2 px-3 text-right font-bold text-purple-300">Δs₂ / Δs₁ = {distanceRatio}x</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Core Educational Conclusion Box */}
        <div className="p-3 bg-gradient-to-r from-amber-950/30 via-slate-900 to-sky-950/30 rounded-xl border border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 font-bold text-white mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isVi ? 'KẾT LUẬN QUAN SÁT THỰC NGHIỆM ĐỐI CHỨNG (KHTN 9):' : 'EXPERIMENTAL COMPARISON CONCLUSION:'}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {isVi ? (
              <>
                Khi so sánh trực tiếp 2 làn chạy, ta thấy rõ: Quãng đường vật cản bị xô đẩy <span className="text-amber-300 font-mono font-bold">Δs</span> tỉ lệ thuận với động năng <span className="text-emerald-300 font-mono font-bold">Wđ</span> của xe. 
                {lane1Speed !== lane2Speed && (
                  <span className="text-sky-200">
                    {' '}Đặc biệt khi thay đổi tốc độ <span className="font-bold">v</span> (gấp {speedRatio} lần), động năng và quãng đường đẩy cản tăng theo <span className="font-bold text-purple-300">bình phương tốc độ v² (gấp {speedSquaredRatio} lần)</span> chứ không tăng tuyến tính!
                  </span>
                )}
                {lane1Mass !== lane2Mass && lane1Speed === lane2Speed && (
                  <span className="text-amber-200">
                    {' '}Khi giữ nguyên tốc độ và tăng khối lượng <span className="font-bold">m</span> (gấp {massRatio} lần), động năng tăng tỉ lệ thuận đúng <span className="font-bold text-amber-400">{massRatio} lần</span>.
                  </span>
                )}
              </>
            ) : (
              <>
                Direct comparison shows that the barrier push distance Δs is directly proportional to kinetic energy Ek. Speed variations scale quadratically (v²), while mass variations scale linearly (m).
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
