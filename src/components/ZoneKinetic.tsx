import React, { useState, useRef, useEffect } from 'react';
import { Language, KineticRunResult } from '../types';
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
import { KineticComparisonMode } from './KineticComparisonMode';
import {
  playRatchetSound,
  playLaunchSound,
  playImpactSound,
  playSkidSound,
  playSuccessChime,
} from '../utils/sound';
import {
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  History,
  Trash2,
  Flame,
  Clock,
  MoveHorizontal,
  Layers,
  Sliders,
  Info,
  Car,
  Truck,
  Bike,
  Box,
  ShieldAlert,
  Gauge,
  Zap,
  Scale,
} from 'lucide-react';

interface ZoneKineticProps {
  lang: Language;
}

export const ZoneKinetic: React.FC<ZoneKineticProps> = ({ lang }) => {
  const t = DICTIONARY[lang];
  const kText = t.kineticZone;

  // View Mode: 'compare' (Side-by-side comparison) or 'single' (Detailed single track exploration)
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('compare');

  // 1. Vehicle Selection State
  const [vehicleCategory, setVehicleCategory] = useState<'lab' | 'real'>('lab');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('lab-1');

  const selectedVehicle: VehicleModel =
    ALL_VEHICLES.find((v) => v.id === selectedVehicleId) || LAB_VEHICLES[0];

  // Mass of car (customizable with slider / presets)
  const [mass, setMass] = useState<number>(selectedVehicle.defaultMass);

  // Speed of car in m/s
  const [speed, setSpeed] = useState<number>(selectedVehicle.defaultSpeed);

  // Pullback distance (pixels, 25 to 125px)
  const maxVehicleSpeed = selectedVehicle.maxSpeed;
  const initialPullback = Math.max(
    25,
    Math.min(125, Math.round((selectedVehicle.defaultSpeed / maxVehicleSpeed) * 120))
  );
  const [pullback, setPullback] = useState<number>(initialPullback);

  // 2. Obstacle Selection State
  const [selectedObstacleId, setSelectedObstacleId] = useState<string>('foam');
  const selectedObstacle: ObstacleModel =
    OBSTACLE_MODELS.find((o) => o.id === selectedObstacleId) || OBSTACLE_MODELS[0];

  // Mass of obstacle in kg (customizable with slider / presets)
  const [obstacleMass, setObstacleMass] = useState<number>(selectedObstacle.defaultMass);

  // Surface roughness multiplier (0.5 = trơn, 1.0 = chuẩn, 2.0 = nhám)
  const [roughnessFactor, setRoughnessFactor] = useState<number>(1.0);

  // Obstacle distance from start line (120 to 380 cm)
  const [obstacleDistance, setObstacleDistance] = useState<number>(240);
  const [isDraggingObstacle, setIsDraggingObstacle] = useState<boolean>(false);

  // Dynamic Simulation State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);

  const [carX, setCarX] = useState<number>(-initialPullback);
  const [blockX, setBlockX] = useState<number>(0);
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [impactSpark, setImpactSpark] = useState<boolean>(false);
  const [simPhase, setSimPhase] = useState<'idle' | 'spring' | 'cruise' | 'impact' | 'stopped'>('idle');

  // Outcome of latest run
  const [lastOutcome, setLastOutcome] = useState<{
    meters: number;
    formattedDist: string;
    energyFormatted: { main: string; sub?: string };
    obstacleDistance: number;
    obstacleName: string;
    vehicleName: string;
  } | null>(null);

  // Run history log
  const [history, setHistory] = useState<KineticRunResult[]>([
    {
      mass: 1,
      speed: 2,
      kineticEnergy: 2,
      impactDistance: 20,
      timestamp: 1,
      obstacleType: 'friction',
      obstacleDistance: 240,
      resistanceValue: 10,
      vehicleName: 'Xe nhỏ (1 kg)',
      obstacleName: 'Khối xốp SGK',
      obstacleMass: 1,
      impactUnit: 'cm',
    },
    {
      mass: 1,
      speed: 4,
      kineticEnergy: 8,
      impactDistance: 80,
      timestamp: 2,
      obstacleType: 'friction',
      obstacleDistance: 240,
      resistanceValue: 10,
      vehicleName: 'Xe nhỏ (1 kg)',
      obstacleName: 'Khối xốp SGK',
      obstacleMass: 1,
      impactUnit: 'cm',
    },
  ]);

  // Prediction Mode
  const [predictionActive, setPredictionActive] = useState<boolean>(false);
  const [predictedValue, setPredictedValue] = useState<number>(8);
  const [predictionFeedback, setPredictionFeedback] = useState<string | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number>(0);
  const initialPullbackRef = useRef<number>(0);
  const obstacleDragStartRef = useRef<number>(0);
  const obstacleInitialPosRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Physics Calculations
  // Wđ = 1/2 * m * v^2
  const calculatedEnergy = calculateKineticEnergy(mass, speed);
  const energyDisplay = formatEnergy(calculatedEnergy);

  // Friction resistance force: Fc = mu * M * g * roughness (g = 10 N/kg)
  const frictionForce =
    Math.round(selectedObstacle.frictionCoeff * obstacleMass * 10 * roughnessFactor * 10) / 10;

  // Theoretical slide distance in meters: s = Wđ / Fc
  const theoreticalDistMeters = Math.max(0.01, calculatedEnergy / Math.max(1, frictionForce));
  const theoreticalDistFormatted = formatDistance(theoreticalDistMeters);

  // Equivalent spring force
  const springForce =
    Math.round(((calculatedEnergy * 2) / Math.max(0.1, pullback * 0.01)) * 10) / 10;

  // Sync Car position on pullback change when idle
  useEffect(() => {
    if (!isSimulating && simPhase === 'idle') {
      setCarX(-pullback);
    }
  }, [pullback, isSimulating, simPhase]);

  // Handle switching vehicle
  const handleSelectVehicle = (vehicle: VehicleModel) => {
    if (isSimulating) return;
    setSelectedVehicleId(vehicle.id);
    setMass(vehicle.defaultMass);
    setSpeed(vehicle.defaultSpeed);
    const newPull = Math.max(
      25,
      Math.min(125, Math.round((vehicle.defaultSpeed / vehicle.maxSpeed) * 120))
    );
    setPullback(newPull);
    setCarX(-newPull);
    setBlockX(0);
    setSimPhase('idle');
    playRatchetSound(1.0);
  };

  // Handle switching obstacle
  const handleSelectObstacle = (obs: ObstacleModel) => {
    if (isSimulating) return;
    setSelectedObstacleId(obs.id);
    setObstacleMass(obs.defaultMass);
    setBlockX(0);
    setSimPhase('idle');
    playRatchetSound(1.1);
  };

  // Handle speed preset selection
  const handleSelectSpeedPreset = (targetSpeed: number) => {
    if (isSimulating) return;
    setSpeed(targetSpeed);
    const targetPullback = Math.max(
      25,
      Math.min(125, Math.round((targetSpeed / selectedVehicle.maxSpeed) * 120))
    );
    setPullback(targetPullback);
    setCarX(-targetPullback);
    setSimPhase('idle');
    setBlockX(0);
    playRatchetSound(1.0);
  };

  // Pointer Dragging for Pullback (Car)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSimulating) return;
    setIsDragging(true);
    dragStartRef.current = e.clientX;
    initialPullbackRef.current = pullback;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isSimulating) return;
    const delta = dragStartRef.current - e.clientX;
    const newPull = Math.max(25, Math.min(125, initialPullbackRef.current + delta));
    setPullback(newPull);
    setCarX(-newPull);

    // Calculate speed proportionally
    const speedRatio = newPull / 120;
    const rawSpeed = speedRatio * selectedVehicle.maxSpeed;
    const roundedSpeed = Math.max(
      selectedVehicle.minSpeed,
      Math.min(selectedVehicle.maxSpeed, Math.round(rawSpeed * 10) / 10)
    );
    setSpeed(roundedSpeed);

    setWheelAngle((prev) => (prev - delta * 3) % 360);

    if (Math.abs(delta) % 15 < 2) {
      playRatchetSound(0.9 + newPull / 140);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Obstacle Dragging
  const handleObstaclePointerDown = (e: React.PointerEvent) => {
    if (isSimulating) return;
    e.stopPropagation();
    setIsDraggingObstacle(true);
    obstacleDragStartRef.current = e.clientX;
    obstacleInitialPosRef.current = obstacleDistance;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleObstaclePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingObstacle || isSimulating) return;
    const deltaX = e.clientX - obstacleDragStartRef.current;
    const newDist = Math.max(
      120,
      Math.min(380, Math.round((obstacleInitialPosRef.current + deltaX) / 10) * 10)
    );
    if (newDist !== obstacleDistance) {
      setObstacleDistance(newDist);
      playRatchetSound(1.15);
    }
  };

  const handleObstaclePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingObstacle) return;
    setIsDraggingObstacle(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Launch Simulation
  const launchCar = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setBlockX(0);
    setImpactSpark(false);
    playLaunchSound(Math.min(10, speed));

    const actualSpeed = speed;
    const energy = calculatedEnergy;
    const timeScale = isSlowMo ? 3.0 : 1.0;
    const barrierX = obstacleDistance;

    // Check prediction if active
    if (predictionActive) {
      const errorMargin = energy * 0.15;
      if (Math.abs(predictedValue - energy) <= Math.max(1, errorMargin)) {
        setPredictionFeedback(
          lang === 'vi'
            ? `🎉 Tuyệt vời! Dự đoán ${predictedValue} J rất sát kết quả thực tế Wđ = ${energyDisplay.main}. (Áp dụng đúng Wđ = ½·m·v²).`
            : `🎉 Excellent! Your prediction was very close to Wđ = ${energyDisplay.main}!`
        );
        playSuccessChime();
      } else {
        setPredictionFeedback(
          lang === 'vi'
            ? `💡 Kết quả thực tế là Wđ = ${energyDisplay.main} (Bạn dự đoán ${predictedValue} J). Chú ý v² = ${actualSpeed}² = ${Math.round(actualSpeed * actualSpeed)}!`
            : `💡 Actual kinetic energy is Wđ = ${energyDisplay.main} (You guessed ${predictedValue} J). Notice v² = ${Math.round(actualSpeed * actualSpeed)}!`
        );
      }
    }

    const startPull = pullback;

    // Calculate visual slide displacement in px (scaled smoothly between 15px and 280px)
    let visualSlidePx = 0;
    if (selectedVehicle.category === 'lab' && selectedObstacle.id === 'foam') {
      // Textbook model: exactly 0.8px per cm (e.g. 80cm -> 64px, 320cm -> 256px)
      visualSlidePx = Math.min(280, (theoreticalDistMeters * 100) * 0.8);
    } else {
      // Real-world dynamic scaling: proportional to slide severity
      const ratio = Math.min(1, theoreticalDistMeters / 25);
      visualSlidePx = Math.min(280, Math.max(15, 20 + ratio * 240));
    }

    // Stage Durations
    const springDuration = (180 + Math.min(500, mass * 15)) * timeScale;
    const cruiseDuration =
      Math.max(180, (barrierX / Math.max(10, actualSpeed * 18)) * 550) * timeScale;
    const impactDuration = (450 + Math.min(600, energy * 0.05)) * timeScale;

    const t0 = performance.now();
    setSimPhase('spring');

    const loop = (now: number) => {
      const elapsed = now - t0;

      if (elapsed < springDuration) {
        // Stage 1: Spring release acceleration
        const p = elapsed / springDuration;
        const currentCarPos = -startPull + startPull * (p * p);
        setCarX(currentCarPos);
        setWheelAngle((prev) => (prev + actualSpeed * 15 * (1 / timeScale)) % 360);
        animFrameRef.current = requestAnimationFrame(loop);
      } else if (elapsed < springDuration + cruiseDuration) {
        // Stage 2: Free rollout at speed v
        setSimPhase('cruise');
        const cruiseElapsed = elapsed - springDuration;
        const p = Math.min(1, cruiseElapsed / cruiseDuration);
        const currentCarPos = barrierX * p;
        setCarX(currentCarPos);
        setWheelAngle((prev) => (prev + actualSpeed * 20 * (1 / timeScale)) % 360);
        animFrameRef.current = requestAnimationFrame(loop);
      } else if (elapsed < springDuration + cruiseDuration + impactDuration) {
        // Stage 3: Impact and push obstacle
        const impactElapsed = elapsed - springDuration - cruiseDuration;
        const p = Math.min(1, impactElapsed / impactDuration);

        if (simPhase !== 'impact') {
          setSimPhase('impact');
          setImpactSpark(true);
          playImpactSound(Math.min(100, energy));
          playSkidSound();
          setTimeout(() => setImpactSpark(false), 300);
        }

        const easeOut = 1 - Math.pow(1 - p, 3);
        const currentSlide = visualSlidePx * easeOut;

        setBlockX(currentSlide);
        setCarX(barrierX + currentSlide);
        if (p < 0.8) {
          setWheelAngle((prev) => (prev + actualSpeed * 8 * (1 - p)) % 360);
        }

        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        // FINISH
        setSimPhase('stopped');
        setIsSimulating(false);
        setBlockX(visualSlidePx);
        setCarX(barrierX + visualSlidePx);

        setLastOutcome({
          meters: theoreticalDistMeters,
          formattedDist: theoreticalDistFormatted.label,
          energyFormatted: energyDisplay,
          obstacleDistance: barrierX,
          obstacleName: selectedObstacle.shortName,
          vehicleName: selectedVehicle.shortName,
        });

        setHistory((prev) => [
          {
            mass,
            speed: actualSpeed,
            kineticEnergy: energy,
            impactDistance: theoreticalDistFormatted.rawCm,
            timestamp: Date.now(),
            obstacleType: 'friction',
            obstacleDistance: barrierX,
            resistanceValue: frictionForce,
            vehicleId: selectedVehicle.id,
            vehicleName: selectedVehicle.nameVi,
            obstacleId: selectedObstacle.id,
            obstacleName: selectedObstacle.nameVi,
            obstacleMass,
            impactUnit: theoreticalDistFormatted.unit,
          },
          ...prev.slice(0, 5),
        ]);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const resetCar = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsSimulating(false);
    setSimPhase('idle');
    setCarX(-pullback);
    setBlockX(0);
    setImpactSpark(false);
    setPredictionFeedback(null);
  };

  // Spring Drawing Coordinates
  const springAnchorX = 24;
  const springEndY = 85;
  const springEndX =
    simPhase === 'cruise' || simPhase === 'impact' || simPhase === 'stopped'
      ? 140
      : Math.max(springAnchorX + 20, 140 + carX);

  const obstacleScreenLeft = 140 + obstacleDistance;

  return (
    <div className="space-y-6">
      {/* Zone Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {kText.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Mô phỏng động năng với đầy đủ xe thí nghiệm (1, 2, 4kg) đến xe thực tế (Xe máy, Ô tô, Xe tải) & đa dạng vật cản tùy chỉnh
          </p>
        </div>

        {/* Action badges & controls */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono font-bold text-xs sm:text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Wđ = ½ · m · v²</span>
          </div>

          <button
            onClick={() => setIsSlowMo(!isSlowMo)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              isSlowMo
                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isSlowMo ? 'Quay chậm 0.25x' : 'Tốc độ thực 1.0x'}</span>
          </button>

          <button
            id="toggle-prediction-btn"
            onClick={() => setPredictionActive(!predictionActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              predictionActive
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>{predictionActive ? 'Đang dự đoán' : 'Thử tài dự đoán Wđ'}</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher: Single Track vs Side-by-Side Comparison */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            id="kinetic-mode-compare-btn"
            onClick={() => setViewMode('compare')}
            className={`py-2 px-3.5 rounded-lg font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'compare'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md ring-1 ring-amber-400/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>⚡ So sánh song song 2 xe (Đối chứng KHTN 9)</span>
            <span
              className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold ${
                viewMode === 'compare' ? 'bg-slate-950/40 text-slate-950' : 'bg-amber-400/20 text-amber-300'
              }`}
            >
              Mới
            </span>
          </button>

          <button
            id="kinetic-mode-single-btn"
            onClick={() => setViewMode('single')}
            className={`py-2 px-3.5 rounded-lg font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'single'
                ? 'bg-slate-200 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>🏃‍♂️ Đường đua đơn (Khám phá chuyên sâu)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          {viewMode === 'compare'
            ? '🔬 Chế độ so sánh: Chạy đồng thời 2 xe với khối lượng/tốc độ khác nhau'
            : '🎯 Chế độ đơn: Tùy chỉnh chi tiết 1 xe, kéo nạp thế năng và thử tài dự đoán Wđ'}
        </div>
      </div>

      {viewMode === 'compare' ? (
        <KineticComparisonMode lang={lang} />
      ) : (
        <>
          {/* Prediction Banner */}
      {predictionActive && (
        <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-purple-200">
              Dự đoán động năng xe ({mass} kg, {speed} m/s ≈ {(speed * 3.6).toFixed(0)} km/h):
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={predictedValue}
              onChange={(e) => setPredictedValue(Number(e.target.value))}
              className="w-24 px-2 py-1 bg-slate-900 border border-purple-400 rounded text-center text-purple-200 font-mono font-bold"
              placeholder="Nhập J..."
            />
            <span className="font-mono font-bold text-purple-300">Joule</span>
          </div>
          {predictionFeedback && (
            <div className="w-full text-xs font-medium text-purple-200 pt-1 border-t border-purple-900/50">
              {predictionFeedback}
            </div>
          )}
        </div>
      )}

      {/* MAIN SIMULATION STAGE */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-lg">
        {/* Quick Launch & Status Bar directly atop the track */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Phương tiện:</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {selectedVehicle.nameVi} ({mass.toLocaleString('vi-VN')} kg)
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Vật cản:</span>
            <span className="font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              {selectedObstacle.nameVi} ({obstacleMass.toLocaleString('vi-VN')} kg)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="top-quick-launch-btn"
              disabled={isSimulating}
              onClick={launchCar}
              className="py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Thả tay phóng xe 🚀</span>
            </button>

            <button
              id="top-quick-reset-btn"
              onClick={resetCar}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 active:scale-95 transition flex items-center gap-1 cursor-pointer"
              title="Đặt lại đường đua"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Dashboard Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Scale className="w-3 h-3 text-amber-400" />
              <span>Khối lượng xe (m)</span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {mass.toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">kg</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-sky-400" />
              <span>Tốc độ xe (v)</span>
            </div>
            <div className="text-base font-bold font-mono text-sky-400 mt-0.5">
              {speed} <span className="text-xs text-slate-400 font-normal">m/s</span>{' '}
              <span className="text-xs text-sky-300 font-sans font-normal">
                ({(speed * 3.6).toFixed(0)} km/h)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Động năng xe (Wđ)</span>
            </div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5 flex items-baseline gap-1.5">
              <span>{energyDisplay.main}</span>
              {energyDisplay.sub && (
                <span className="text-[10px] text-slate-400 font-sans font-normal">
                  ({energyDisplay.sub})
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-orange-400" />
              <span>Lực cản vật cản (Fc)</span>
            </div>
            <div className="text-base font-bold font-mono text-orange-400 mt-0.5">
              {frictionForce.toLocaleString('vi-VN')}{' '}
              <span className="text-xs text-slate-400 font-normal">N</span>{' '}
              <span className="text-[10px] text-slate-400 font-sans">
                (M = {obstacleMass.toLocaleString('vi-VN')}kg)
              </span>
            </div>
          </div>
        </div>

        {/* Physical Track Canvas */}
        <div
          ref={trackRef}
          className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 overflow-x-auto shadow-inner select-none p-2"
        >
          <div className="min-w-[760px] h-48 relative overflow-hidden">
            {/* Background Distance Rulers */}
            <div className="absolute inset-x-0 bottom-6 h-6 border-t border-slate-700/60 flex items-center">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  style={{ left: `${140 + i * 50}px` }}
                  className="absolute h-2 border-l border-slate-600 flex flex-col items-center"
                >
                  <span className="text-[9px] font-mono text-slate-500 -mt-3">
                    {i * 50}cm
                  </span>
                </div>
              ))}
            </div>

            {/* Road / Track Bed */}
            <div className="absolute inset-x-0 bottom-6 h-4 bg-slate-800/80 border-y border-slate-700">
              {/* Lane dashes for real-world road feel */}
              <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,#fff_0,#fff_20px,transparent_20px,transparent_40px)]" />
            </div>

            {/* Start Line Marker (x = 0) */}
            <div
              style={{ left: '140px' }}
              className="absolute top-0 bottom-6 w-0.5 bg-amber-500/80 z-10 pointer-events-none"
            >
              <div className="absolute top-1 -left-6 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-mono text-[9px] font-extrabold rounded shadow">
                VẠCH XUẤT PHÁT (0cm)
              </div>
            </div>

            {/* Obstacle Target Guide Line */}
            <div
              style={{ left: `${obstacleScreenLeft}px` }}
              className="absolute top-0 bottom-6 w-0.5 border-r-2 border-dashed border-indigo-400/60 z-10 pointer-events-none"
            >
              <div
                onPointerDown={handleObstaclePointerDown}
                onPointerMove={handleObstaclePointerMove}
                onPointerUp={handleObstaclePointerUp}
                className="absolute -top-1 -left-14 px-2 py-0.5 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 font-mono text-[9px] font-bold rounded-full border border-indigo-500/50 shadow-md cursor-grab active:cursor-grabbing pointer-events-auto flex items-center gap-1 z-30 transition-colors"
                title="Chạm và kéo để di chuyển vị trí vật cản gần/xa"
              >
                <MoveHorizontal className="w-2.5 h-2.5" />
                <span>+{obstacleDistance}cm</span>
              </div>
            </div>

            {/* SVG Anchor Post, Spring, and Impact Effects */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
              {/* Wall Anchor Post */}
              <rect x="14" y="55" width="10" height="65" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="2" />
              <circle cx="24" cy="85" r="5" fill="#f59e0b" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Spring Coil */}
              {(() => {
                const coils = 12;
                const dx = (springEndX - springAnchorX) / coils;
                let pathStr = `M ${springAnchorX},${springEndY}`;
                for (let i = 0; i < coils; i++) {
                  const cx1 = springAnchorX + (i + 0.25) * dx;
                  const cy1 = springEndY - (i % 2 === 0 ? 10 : -10);
                  const cx2 = springAnchorX + (i + 0.75) * dx;
                  const cy2 = springEndY + (i % 2 === 0 ? 10 : -10);
                  const endX = springAnchorX + (i + 1) * dx;
                  pathStr += ` C ${cx1},${cy1} ${cx2},${cy2} ${endX},${springEndY}`;
                }
                return (
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })()}

              {/* Elastic Tension Vector */}
              {simPhase === 'idle' && (
                <g transform={`translate(${140 + carX + 35}, 45)`}>
                  <line x1="0" y1="0" x2={Math.min(50, pullback * 0.5)} y2="0" stroke="#f59e0b" strokeWidth="2.5" />
                  <polygon
                    points={`${Math.min(50, pullback * 0.5)},0 ${Math.min(50, pullback * 0.5) - 6},-4 ${Math.min(50, pullback * 0.5) - 6},4`}
                    fill="#f59e0b"
                  />
                  <text x={Math.min(25, pullback * 0.25)} y="-6" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
                    F_kéo = {springForce} N
                  </text>
                </g>
              )}

              {/* Impact Flash & Sparks */}
              {impactSpark && (
                <g transform={`translate(${obstacleScreenLeft}, 85)`}>
                  <circle r="24" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.9" />
                  <circle r="40" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />
                  <line x1="-16" y1="-16" x2="16" y2="16" stroke="#ffffff" strokeWidth="2.5" />
                  <line x1="-16" y1="16" x2="16" y2="-16" stroke="#ffffff" strokeWidth="2.5" />
                </g>
              )}
            </svg>

            {/* THE CAR COMPONENT */}
            <div
              id="kinetic-car"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                transform: `translateX(${140 + carX}px)`,
                cursor: isSimulating ? 'default' : isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
              }}
              className="absolute top-10 z-20 select-none transition-none"
            >
              <VehicleGraphic
                vehicle={selectedVehicle}
                mass={mass}
                speed={speed}
                wheelAngle={wheelAngle}
                isSimulating={isSimulating}
                pullback={pullback}
                simPhase={simPhase}
                onLaunch={launchCar}
              />
            </div>

            {/* THE OBSTACLE COMPONENT */}
            <ObstacleGraphic
              obstacle={selectedObstacle}
              obstacleMass={obstacleMass}
              frictionForce={frictionForce}
              obstacleDistance={obstacleDistance}
              blockX={blockX}
              isSimulating={isSimulating}
              isDraggingObstacle={isDraggingObstacle}
              onPointerDown={handleObstaclePointerDown}
              onPointerMove={handleObstaclePointerMove}
              onPointerUp={handleObstaclePointerUp}
            />

            {/* Laser Bracket Measurement for Push Distance */}
            {simPhase === 'stopped' && lastOutcome && (
              <div
                className="absolute top-36 h-6 flex items-center z-10 pointer-events-none"
                style={{
                  left: `${obstacleScreenLeft}px`,
                  width: `${Math.max(40, blockX)}px`,
                }}
              >
                <div className="w-full border-b-2 border-emerald-400 flex items-center justify-center relative">
                  <div className="absolute -top-4 bg-slate-950 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40 rounded shadow whitespace-nowrap">
                    Đẩy vật cản: Δs = +{lastOutcome.formattedDist} (Wđ = {lastOutcome.energyFormatted.main})
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PANEL 1: ĐIỀU KHIỂN VẬT CẢN (OBSTACLE CONTROLS) */}
        {/* ============================================================ */}
        <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Box className="w-4 h-4 text-amber-400" />
              <span>TÙY CHỌN VẬT CẢN & KHỐI LƯỢNG (M_cản)</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Lực cản ma sát: <strong>Fc = μ · M_cản · g = {frictionForce} N</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 1. Chọn loại vật cản */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Chọn loại vật cản:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {OBSTACLE_MODELS.map((obs) => (
                  <button
                    key={obs.id}
                    disabled={isSimulating}
                    onClick={() => handleSelectObstacle(obs)}
                    className={`p-2 rounded-lg text-left transition border cursor-pointer flex flex-col justify-between ${
                      selectedObstacleId === obs.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-bold text-[11px]">{obs.shortName}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      ~{obs.defaultMass} kg
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tùy chỉnh khối lượng vật cản (M_cản) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-300">
                  Khối lượng M_cản:
                </label>
                <span className="font-mono font-bold text-amber-400 bg-slate-900 px-1.5 py-0.2 rounded border border-amber-500/30">
                  {obstacleMass.toLocaleString('vi-VN')} kg
                </span>
              </div>
              <input
                type="range"
                min={selectedObstacle.minMass}
                max={selectedObstacle.maxMass}
                step={selectedObstacle.massStep}
                value={obstacleMass}
                disabled={isSimulating}
                onChange={(e) => {
                  setObstacleMass(Number(e.target.value));
                  resetCar();
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex items-center gap-1">
                {selectedObstacle.massPresets.map((mVal) => (
                  <button
                    key={mVal}
                    disabled={isSimulating}
                    onClick={() => {
                      setObstacleMass(mVal);
                      resetCar();
                    }}
                    className={`flex-1 py-0.5 rounded text-[9px] font-mono font-bold transition border cursor-pointer ${
                      obstacleMass === mVal
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {mVal}kg
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Độ nhám mặt đường / Hệ số ma sát */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-300">
                  Độ nhám mặt sàn:
                </label>
                <span className="font-mono font-bold text-slate-300">
                  {roughnessFactor === 0.5 ? 'Trơn 0.5x' : roughnessFactor === 1.0 ? 'Chuẩn 1.0x' : 'Nhám 2.0x'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { factor: 0.5, label: 'Sàn trơn' },
                  { factor: 1.0, label: 'Tiêu chuẩn' },
                  { factor: 2.0, label: 'Mặt nhám' },
                ].map((item) => (
                  <button
                    key={item.factor}
                    disabled={isSimulating}
                    onClick={() => {
                      setRoughnessFactor(item.factor);
                      resetCar();
                    }}
                    className={`py-1 rounded text-[10px] font-bold transition cursor-pointer border ${
                      roughnessFactor === item.factor
                        ? 'bg-slate-200 text-slate-950 border-white shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="text-[9.5px] text-slate-400 text-center font-mono">
                Dự kiến trượt: <strong className="text-amber-300">{theoreticalDistFormatted.label}</strong>
              </div>
            </div>
          </div>

          {/* Vị trí đặt vật cản gần/xa */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs">
              <MoveHorizontal className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>Vị trí đặt vật cản trên đường chạy (+{obstacleDistance}cm):</span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="range"
                min="120"
                max="380"
                step="10"
                value={obstacleDistance}
                disabled={isSimulating}
                onChange={(e) => {
                  setObstacleDistance(Number(e.target.value));
                  resetCar();
                }}
                className="flex-1 accent-indigo-500 cursor-pointer"
              />
              <div className="flex items-center gap-1">
                {[
                  { dist: 140, label: 'Gần 140cm' },
                  { dist: 240, label: 'Chuẩn 240cm' },
                  { dist: 340, label: 'Xa 340cm' },
                ].map((item) => (
                  <button
                    key={item.dist}
                    disabled={isSimulating}
                    onClick={() => {
                      setObstacleDistance(item.dist);
                      resetCar();
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                      obstacleDistance === item.dist
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PANEL 2: ĐIỀU KHIỂN PHƯƠNG TIỆN (VEHICLE CONTROLS) */}
        {/* ============================================================ */}
        <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-3">
          {/* Header & Category Switch */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Car className="w-4 h-4 text-sky-400" />
              <span>CHỌN PHƯƠNG TIỆN & TỐC ĐỘ DI CHUYỂN</span>
            </div>

            {/* Category Toggle Tabs */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                disabled={isSimulating}
                onClick={() => {
                  setVehicleCategory('lab');
                  handleSelectVehicle(LAB_VEHICLES[0]);
                }}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                  vehicleCategory === 'lab'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🔬 Thí nghiệm SGK (1, 2, 4 kg)</span>
              </button>
              <button
                disabled={isSimulating}
                onClick={() => {
                  setVehicleCategory('real');
                  handleSelectVehicle(REAL_VEHICLES[0]);
                }}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                  vehicleCategory === 'real'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🚗 Phương tiện thực tế (Xe máy, Ô tô, Tải)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Vehicle Cards Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300 block">
                1. Chọn xe ({vehicleCategory === 'lab' ? 'Mô hình phòng Lab' : 'Phương tiện giao thông'}):
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(vehicleCategory === 'lab' ? LAB_VEHICLES : REAL_VEHICLES).map((veh) => (
                  <button
                    key={veh.id}
                    disabled={isSimulating}
                    onClick={() => handleSelectVehicle(veh)}
                    className={`p-2 rounded-lg text-left transition border cursor-pointer flex flex-col justify-between ${
                      selectedVehicleId === veh.id
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-1 ring-sky-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {veh.iconType === 'bike' ? (
                        <Bike className="w-3.5 h-3.5 text-cyan-400" />
                      ) : veh.iconType === 'truck' ? (
                        <Truck className="w-3.5 h-3.5 text-orange-400" />
                      ) : (
                        <Car className="w-3.5 h-3.5 text-purple-400" />
                      )}
                      <span className="font-bold text-[11px] truncate">{veh.shortName}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">
                      {veh.defaultMass.toLocaleString('vi-VN')} kg
                    </span>
                  </button>
                ))}
              </div>

              {/* Mass Slider for selected vehicle */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] text-slate-400">
                    Tùy chỉnh khối lượng xe ({mass.toLocaleString('vi-VN')} kg):
                  </span>
                  <span className="font-mono font-bold text-amber-300 text-xs">
                    {mass.toLocaleString('vi-VN')} kg
                  </span>
                </div>
                <input
                  type="range"
                  min={selectedVehicle.minMass}
                  max={selectedVehicle.maxMass}
                  step={selectedVehicle.massStep}
                  value={mass}
                  disabled={isSimulating}
                  onChange={(e) => {
                    setMass(Number(e.target.value));
                    resetCar();
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 2. Speed Controller (m/s and km/h) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-300">
                  2. Tốc độ di chuyển (v):
                </label>
                <div className="font-mono text-xs text-right">
                  <span className="font-bold text-sky-400">{speed} m/s</span>{' '}
                  <span className="text-sky-300 text-[11px]">
                    ({(speed * 3.6).toFixed(0)} km/h)
                  </span>
                </div>
              </div>

              {/* Benchmark Speed Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                {selectedVehicle.speedPresets.map((preset) => (
                  <button
                    key={preset.mps}
                    disabled={isSimulating}
                    onClick={() => handleSelectSpeedPreset(preset.mps)}
                    className={`py-1.5 px-1 rounded text-center transition cursor-pointer border ${
                      Math.abs(speed - preset.mps) < 0.2
                        ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-mono">{preset.mps} m/s</div>
                    <div className="text-[8.5px] opacity-80">
                      {(preset.mps * 3.6).toFixed(0)} km/h
                    </div>
                  </button>
                ))}
              </div>

              {/* Continuous Speed Slider */}
              <div className="pt-1">
                <input
                  type="range"
                  min={selectedVehicle.minSpeed}
                  max={selectedVehicle.maxSpeed}
                  step={selectedVehicle.speedStep}
                  value={speed}
                  disabled={isSimulating}
                  onChange={(e) => {
                    const newV = Number(e.target.value);
                    setSpeed(newV);
                    const newPull = Math.max(
                      25,
                      Math.min(125, Math.round((newV / selectedVehicle.maxSpeed) * 120))
                    );
                    setPullback(newPull);
                    setCarX(-newPull);
                    resetCar();
                  }}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>{selectedVehicle.minSpeed} m/s</span>
                  <span>{selectedVehicle.maxSpeed} m/s</span>
                </div>
              </div>
            </div>

            {/* 3. Launch Trigger Actions */}
            <div className="space-y-2 flex flex-col justify-between">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  3. Kích hoạt phóng xe:
                </label>
                <p className="text-[10.5px] text-slate-400 mb-2">
                  Bấm phóng hoặc kéo lùi trực tiếp xe trên đường đua để nạp thế năng rồi thả tay!
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  id="launch-car-btn"
                  disabled={isSimulating}
                  onClick={launchCar}
                  className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>Thả tay (Phóng xe) 🚀</span>
                </button>

                <button
                  id="reset-car-btn"
                  onClick={resetCar}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition active:scale-95 border border-slate-700 cursor-pointer"
                  title={t.common.reset}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* KEY SCIENTIFIC & REAL-WORLD INSIGHT BENCHMARK MATRIX */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Core Law Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 p-4 rounded-xl border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>QUY LUẬT VÀNG KHTN 9 & AN TOÀN GIAO THÔNG</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-amber-300 font-semibold block">
                Tốc độ v tăng gấp đôi → Động năng Wđ tăng gấp 4 (v²)!
              </span>
              <span className="text-[11px] text-slate-400">
                Ô tô chạy từ 50 km/h lên 100 km/h: quãng đường phanh và sức tàn phá tăng gấp 4 lần!
              </span>
            </div>

            <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-orange-300 font-semibold block">
                Khối lượng xe càng lớn → Động năng Wđ càng khổng lồ!
              </span>
              <span className="text-[11px] text-slate-400">
                Ở cùng tốc độ 54 km/h: Xe máy (120kg) có Wđ = 13,5 kJ, còn xe tải (8 tấn) có Wđ = 900 kJ (gấp gần 67 lần xe máy)!
              </span>
            </div>

            <p className="text-[11px] text-amber-200/80 italic pt-1">
              Định lí động năng: Công lực cản A_c = Fc · s = Wđ. Do đó, muốn xe dừng lại an toàn hoặc hấp thụ xung lực khi va chạm vật cản nặng (như khối bê tông dải phân cách), lực cản và sự biến dạng là cực kì lớn!
            </p>
          </div>
        </div>

        {/* Comparison Benchmark Table */}
        <div className="lg:col-span-2 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-sky-400" />
              <span>Bảng dữ liệu thực tế & đối chuẩn KHTN 9 (Wđ = ½ · m · v²)</span>
            </h3>
            <span className="text-[10px] text-slate-400">
              So sánh quy mô từ mô hình nhỏ đến phương tiện lớn
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1.5 px-2">Phương tiện</th>
                  <th className="py-1.5 px-2">m (kg)</th>
                  <th className="py-1.5 px-2">v (m/s & km/h)</th>
                  <th className="py-1.5 px-2 text-emerald-400">Wđ (Động năng)</th>
                  <th className="py-1.5 px-2 text-sky-400">Trượt khối xốp / cản</th>
                  <th className="py-1.5 px-2 text-right">Nạp mẫu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {[
                  { name: 'Xe nhỏ (SGK)', vehId: 'lab-1', obsId: 'foam', m: 1, v: 2, eText: '2 J', sText: '20 cm' },
                  { name: 'Xe nhỏ (SGK)', vehId: 'lab-1', obsId: 'foam', m: 1, v: 4, eText: '8 J', sText: '80 cm' },
                  { name: 'Xe vừa (SGK)', vehId: 'lab-2', obsId: 'foam', m: 2, v: 4, eText: '16 J', sText: '160 cm' },
                  { name: 'Xe lớn (SGK)', vehId: 'lab-4', obsId: 'foam', m: 4, v: 4, eText: '32 J', sText: '320 cm' },
                  { name: 'Xe máy (54km/h)', vehId: 'real-moto', obsId: 'wood', m: 120, v: 15, eText: '13.5 kJ', sText: '168.8 m (gỗ)' },
                  { name: 'Ô tô (72km/h)', vehId: 'real-car', obsId: 'barrel', m: 1500, v: 20, eText: '300 kJ', sText: '363.6 m (thùng)' },
                  { name: 'Xe tải (54km/h)', vehId: 'real-truck', obsId: 'concrete', m: 8000, v: 15, eText: '900 kJ', sText: '120 m (bê tông)' },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-800/40 transition ${
                      selectedVehicleId === row.vehId && Math.abs(speed - row.v) < 0.5 ? 'bg-amber-500/10 text-amber-300' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2 font-sans font-medium text-slate-200">{row.name}</td>
                    <td className="py-1.5 px-2 font-bold">{row.m.toLocaleString('vi-VN')}</td>
                    <td className="py-1.5 px-2 font-bold">
                      {row.v} m/s <span className="text-[10px] text-slate-400">({(row.v * 3.6).toFixed(0)}km/h)</span>
                    </td>
                    <td className="py-1.5 px-2 font-bold text-emerald-400">{row.eText}</td>
                    <td className="py-1.5 px-2 font-bold text-sky-400">+{row.sText}</td>
                    <td className="py-1.5 px-2 text-right">
                      <button
                        onClick={() => {
                          const veh = ALL_VEHICLES.find((v) => v.id === row.vehId);
                          const obs = OBSTACLE_MODELS.find((o) => o.id === row.obsId);
                          if (veh) {
                            setVehicleCategory(veh.category);
                            setSelectedVehicleId(veh.id);
                            setMass(row.m);
                            setSpeed(row.v);
                            const newPull = Math.max(
                              25,
                              Math.min(125, Math.round((row.v / veh.maxSpeed) * 120))
                            );
                            setPullback(newPull);
                            setCarX(-newPull);
                          }
                          if (obs) {
                            setSelectedObstacleId(obs.id);
                            setObstacleMass(obs.defaultMass);
                          }
                          resetCar();
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[10px] font-sans border border-slate-700 cursor-pointer"
                      >
                        Nạp mẫu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* History Log */}
      {history.length > 0 && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>{kText.runHistory}</span>
            </div>
            <button
              onClick={() => setHistory([])}
              className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{kText.clearHistory}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {history.slice(0, 4).map((item, idx) => {
              const formattedEnergy = formatEnergy(item.kineticEnergy);
              return (
                <div
                  key={idx}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono space-y-1"
                >
                  <div className="flex justify-between text-[11px] text-slate-300 font-sans font-medium">
                    <span>{item.vehicleName || `${item.mass} kg`}</span>
                    <span className="text-sky-400 font-mono font-bold">{item.speed} m/s</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                    <span>Cản: {item.obstacleName || 'Khối cản'}</span>
                    <span>M = {item.obstacleMass || 1}kg</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-800/60">
                    <span className="text-emerald-400 font-bold text-sm">
                      Wđ = {formattedEnergy.main}
                    </span>
                    <span className="text-amber-300 font-bold text-xs">
                      +{item.impactDistance} {item.impactUnit || 'cm'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
