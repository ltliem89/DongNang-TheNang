import React, { useState, useRef } from 'react';
import { Language } from '../types';
import { DICTIONARY } from '../locales/i18n';
import { HydroCanvas } from './HydroCanvas';
import {
  playWaterDropSound,
  playLaunchSound,
  playTurbineWhir,
  playWaterSplash,
} from '../utils/sound';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Lightbulb,
  Droplets,
  Activity,
  CheckCircle2,
  Info,
  Waves,
  Gauge,
  Volume2,
  VolumeX,
  ArrowUp,
  Mountain,
} from 'lucide-react';

interface ZoneHydroElectricProps {
  lang: Language;
}

export const ZoneHydroElectric: React.FC<ZoneHydroElectricProps> = ({ lang }) => {
  const t = DICTIONARY[lang];
  const hText = t.hydroZone;

  // Mass of water packet: 1, 2, 4 kg
  const [mass, setMass] = useState<number>(2);
  // Reservoir elevation / head of water: 0 to 6 meters (Hồ lên cao thì nước mới chảy được)
  const [heightMeters, setHeightMeters] = useState<number>(4);
  const totalH = heightMeters;
  const g = 10;
  const totalWc = mass * g * heightMeters;

  // Mode: 'packet' (1 water block) or 'continuous' (steady plant generation)
  const [generationMode, setGenerationMode] = useState<'packet' | 'continuous'>('packet');

  // Progress of water flow: 0 to 1.25
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Turbine physical state
  const [turbineRpm, setTurbineRpm] = useState<number>(0); // 0 to 1500 RPM
  const [bulbGlowState, setBulbGlowState] = useState<number>(0); // 0 to 1
  const [isWaterAtTurbine, setIsWaterAtTurbine] = useState<boolean>(false);

  // Determine current vertical height h based on water front position
  const pipeProgress = Math.min(1, Math.max(0, (progress - 0.05) / 0.75));
  const currentH = heightMeters === 0 ? 0 : Math.max(0, Math.round((heightMeters * (1 - pipeProgress)) * 10) / 10);
  const currentWt = Math.round(mass * g * currentH * 10) / 10;
  const currentWd = Math.round((totalWc - currentWt) * 10) / 10;
  const currentSpeed = heightMeters === 0 ? 0 : Math.round(Math.sqrt((2 * Math.max(0, currentWd)) / mass) * 10) / 10;

  // Jump to specific landmark state
  const jumpToLandmark = (landmark: 'top' | 'mid' | 'turbine') => {
    if (heightMeters === 0) {
      setHeightMeters(4); // Auto-elevate if currently at ground level
    }
    setIsPlaying(false);
    if (landmark === 'top') {
      setProgress(0);
      setTurbineRpm(0);
      setBulbGlowState(0);
      setIsWaterAtTurbine(false);
      playWaterDropSound(1);
    } else if (landmark === 'mid') {
      setProgress(0.42);
      setTurbineRpm(0);
      setBulbGlowState(0);
      setIsWaterAtTurbine(false);
      playWaterDropSound(1.2);
    } else {
      setProgress(0.85);
      const effectiveH = heightMeters === 0 ? 4 : heightMeters;
      const speedScale = Math.sqrt(effectiveH / 4);
      const targetR = Math.round((mass === 1 ? 750 : mass === 2 ? 1150 : 1600) * speedScale);
      setTurbineRpm(targetR);
      setBulbGlowState(1);
      setIsWaterAtTurbine(true);
      playTurbineWhir(1);
      playWaterSplash(1.2);
    }
  };

  const handlePlayToggle = () => {
    if (progress >= 1.2) {
      setProgress(0);
      setTurbineRpm(0);
      setBulbGlowState(0);
      setIsWaterAtTurbine(false);
    }
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      playLaunchSound(2.5);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
    setTurbineRpm(0);
    setBulbGlowState(0);
    setIsWaterAtTurbine(false);
  };

  // Determine current active landmark
  const currentLandmark =
    progress < 0.2 ? 'top' : progress < 0.75 ? 'mid' : 'low';

  // Penstock path coordinates: from dam intake (160, 110) to nozzle (360, 230)
  const penstockStartX = 160;
  const penstockStartY = 110;
  const penstockEndX = 360;
  const penstockEndY = 230;

  // Current water front point inside penstock
  const waterFrontFraction = Math.min(1, Math.max(0, (progress - 0.08) / 0.74));
  const waterFrontX = penstockStartX + waterFrontFraction * (penstockEndX - penstockStartX);
  const waterFrontY = penstockStartY + waterFrontFraction * (penstockEndY - penstockStartY);

  // Tail water discharge level (0 to 1)
  const dischargeProgress = Math.max(0, Math.min(1, (progress - 0.82) / 0.35));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {hText.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {hText.subtitle}
          </p>
        </div>

        {/* Conservation Formula, Reservoir Height (Cột nước h), Flow Density, and Mode Selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono font-bold text-xs sm:text-sm">
            <span>Wc = Wt + Wđ = {totalWc} J</span>
          </div>

          {/* Reservoir Height (Cột nước h) Selector */}
          <div className="bg-slate-800/95 p-1 rounded-lg border border-sky-500/40 flex items-center gap-1.5 text-xs shadow-sm">
            <span className="text-[10px] text-sky-300 px-1.5 font-bold whitespace-nowrap flex items-center gap-1">
              <Mountain className="w-3 h-3 text-sky-400" />
              <span>Cột nước hồ (h):</span>
            </span>
            {[
              { val: 0, label: '0m (Đáy - Tắt)', title: 'Hồ ở đáy: Wt = 0 J, nước KHÔNG CHẢY' },
              { val: 2, label: '2m', title: 'Hồ thấp: Chảy chậm, thế năng 40 J' },
              { val: 4, label: '4m (Chuẩn)', title: 'Hồ chuẩn: Chảy xiết, thế năng 80 J' },
              { val: 6, label: '6m (Núi cao)', title: 'Hồ núi cao: Chảy cực mạnh, thế năng 120 J' },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => {
                  setHeightMeters(item.val);
                  handleReset();
                }}
                className={`px-2 py-1 rounded-md transition cursor-pointer font-bold ${
                  heightMeters === item.val
                    ? item.val === 0
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
                }`}
                title={item.title}
              >
                {item.label}
              </button>
            ))}

            {/* Slider for precision adjustment */}
            <div className="hidden sm:flex items-center gap-1 pl-1.5 border-l border-slate-700">
              <input
                type="range"
                min="0"
                max="6"
                step="0.5"
                value={heightMeters}
                onChange={(e) => {
                  setHeightMeters(parseFloat(e.target.value));
                  handleReset();
                }}
                className="w-16 accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                title="Kéo thanh trượt để nâng hạ mực nước hồ chứa"
              />
              <span className="font-mono text-sky-300 font-bold w-7 text-right text-[11px]">
                {heightMeters}m
              </span>
            </div>
          </div>

          {/* Flow Density (Mật độ dòng nước) Selector */}
          <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-semibold whitespace-nowrap">
              Mật độ nước:
            </span>
            {[
              { val: 1, label: '1 kg/s (Thưa)' },
              { val: 2, label: '2 kg/s (Chuẩn)' },
              { val: 4, label: '4 kg/s (Đậm đặc)' },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => {
                  setMass(item.val);
                  handleReset();
                }}
                className={`px-2 py-1 rounded-md transition cursor-pointer font-bold ${
                  mass === item.val
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Mật độ dòng nước ${item.val} kg/s`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex text-xs">
            <button
              onClick={() => {
                setGenerationMode('packet');
                handleReset();
              }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                generationMode === 'packet'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1 đợt xả nước
            </button>
            <button
              onClick={() => {
                setGenerationMode('continuous');
                handleReset();
              }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                generationMode === 'continuous'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Xả liên tục
            </button>
          </div>
        </div>
      </div>

      {/* Expansive Hydro Simulation Stage (Full Width, Large Area) */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden space-y-4">
        {/* Top Real-time Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Cột nước hồ (h):</span>
              <strong className={`font-sans text-sm ${heightMeters > 0 ? 'text-sky-400' : 'text-amber-400'}`}>
                {heightMeters} m
              </strong>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Độ cao tức thời (h_tức thời):</span>
              <strong className="text-sky-300 font-sans text-sm">{currentH} m</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Tốc độ nước (v):</span>
              <strong className="text-amber-400 font-sans text-sm">{currentSpeed} m/s</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Tốc độ Turbine:</span>
              <strong
                className={`font-sans text-sm font-bold ${
                  turbineRpm > 100 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                }`}
              >
                {Math.round(turbineRpm)} RPM
              </strong>
            </div>
          </div>

          {/* Quick Playback Triggers */}
          <div className="flex items-center gap-2">
            <button
              id="hydro-play-btn"
              onClick={handlePlayToggle}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? t.common.pause : 'Mở van xả nước 💧'}</span>
            </button>

            <button
              id="hydro-reset-btn"
              onClick={handleReset}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95 cursor-pointer border border-slate-700"
              title={t.common.reset}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSlowMo(!isSlowMo)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                isSlowMo
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Xem chậm 0.25x để quan sát các hạt nước tăng tốc & va đập tua-bin"
            >
              {isSlowMo ? 'Quay chậm 0.25x' : '1.0x'}
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition cursor-pointer border ${
                soundEnabled
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Physical Reaction Notice Banner */}
        <div className="px-3 py-2 rounded-xl text-xs font-medium border transition-colors duration-200">
          {heightMeters === 0 ? (
            <div className="flex items-center justify-between gap-2 text-amber-300 bg-amber-950/50 border-amber-600/50 w-full p-2.5 rounded-lg">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  ⚠️ <strong>Hồ ở ngang đáy (h = 0m)</strong>: Không có thế năng trọng trường (Wt = 0 J) → Nước <strong>KHÔNG THỂ CHẢY</strong> vào ống! Hồ phải lên cao thì nước mới chảy được.
                </span>
              </div>
              <button
                onClick={() => {
                  setHeightMeters(4);
                  handleReset();
                }}
                className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap"
              >
                🌊 Nâng hồ lên 4m
              </button>
            </div>
          ) : !isWaterAtTurbine ? (
            <div className="flex items-center gap-2 text-sky-300 bg-sky-950/40 border-sky-600/40 w-full p-2 rounded-lg">
              <Droplets className="w-4 h-4 text-sky-400 flex-shrink-0 animate-bounce" />
              <span>
                {progress === 0
                  ? `Nước sẵn sàng ở hồ chứa cao (h = ${heightMeters}m, Wt = ${totalWc} J). Bấm "Mở van xả nước" để các hạt nước lao xuống sườn đập!`
                  : 'Dòng các hạt nước đang lao dốc trong ống áp lực... Khi hạt nước vừa chạm cánh quạt, tua-bin sẽ quay từ chậm lên nhanh theo mật độ nước!'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-300 bg-amber-950/40 border-amber-600/40 w-full p-2 rounded-lg animate-pulse">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                ⚡ Các hạt nước đang va đập trực tiếp vào cánh tua-bin! Động năng dòng nước (mật độ {mass} kg/s, cột nước {heightMeters}m) làm tua-bin tăng tốc ({Math.round(turbineRpm)} RPM) → Máy phát điện thắp sáng bóng đèn!
              </span>
            </div>
          )}
        </div>

        {/* Large Expansive Hydro Canvas Simulation */}
        <div className="relative w-full">
          <HydroCanvas
            mass={mass}
            heightMeters={heightMeters}
            generationMode={generationMode}
            isPlaying={isPlaying}
            progress={progress}
            onProgressUpdate={(p) => setProgress(p)}
            isSlowMo={isSlowMo}
            soundEnabled={soundEnabled}
            onTurbineMetrics={(rpm, glow, striking) => {
              setTurbineRpm(rpm);
              setBulbGlowState(glow);
              setIsWaterAtTurbine(striking);
            }}
            onElevateReservoir={() => {
              setHeightMeters(4);
              handleReset();
            }}
          />
        </div>

        {/* Observation Controls & Location Selector */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Khảo sát vị trí theo bài học KHTN 9:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => jumpToLandmark('top')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentLandmark === 'top'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. Đỉnh đập (h = {heightMeters}m, Wt max = {totalWc}J)
            </button>
            <button
              onClick={() => jumpToLandmark('mid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentLandmark === 'mid'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. Giữa ống (h = {(heightMeters / 2).toFixed(1)}m, Wt = Wđ = {Math.round(totalWc / 2)}J)
            </button>
            <button
              onClick={() => jumpToLandmark('turbine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentLandmark === 'low'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              3. Chân turbine (h = 0m, Wđ max = {totalWc}J)
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Energy Gauges & Electromechanical Telemetry Dashboard (Grid below canvas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Energy Bar Chart (Wt + Wđ = Wc) (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Thước đo cơ năng thời gian thực (Wc = Wt + Wđ)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              Wc = {totalWc} J
            </span>
          </div>

          <div className="space-y-3.5">
            {/* 1. Potential Energy Bar (Wt) */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-sky-400 font-semibold">Thế năng trọng trường (Wt = m·g·h):</span>
                <span className="text-sky-300 font-bold">{currentWt} J</span>
              </div>
              <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-100"
                  style={{ width: totalWc > 0 ? `${(currentWt / totalWc) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* 2. Kinetic Energy Bar (Wđ) */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-amber-400 font-semibold">Động năng dòng nước (Wđ = ½·m·v²):</span>
                <span className="text-amber-300 font-bold">{currentWd} J</span>
              </div>
              <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-100"
                  style={{ width: totalWc > 0 ? `${(currentWd / totalWc) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* 3. Total Mechanical Energy Bar (Wc) */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-emerald-400 font-semibold">Tổng cơ năng (Wc = Wt + Wđ):</span>
                <span className="text-emerald-300 font-bold">{totalWc} J {totalWc > 0 ? '(BẢO TOÀN)' : '(Hồ ở đáy)'}</span>
              </div>
              <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-100"
                  style={{ width: totalWc > 0 ? '100%' : '0%' }}
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 rounded-xl text-xs text-slate-300 font-mono flex items-center justify-between border border-slate-800">
            <span>{currentWt} J (Wt) + {currentWd} J (Wđ)</span>
            <strong className="text-emerald-400">= {totalWc} J (Wc = const)</strong>
          </div>
        </div>

        {/* Right: Electromechanical Meters & Energy Comparison Table (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Real-time Generator & Output Meters */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trạng thái Tua-bin Pelton</span>
              </div>
              <div className="text-base font-bold text-white font-sans">
                {turbineRpm > 10 ? `${Math.round(turbineRpm)} RPM` : '0 RPM (Đang dừng)'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isWaterAtTurbine ? 'Tia hạt nước đang đập vào cánh' : 'Không có hạt nước tiếp xúc'}
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Phát điện & Đèn</span>
              </div>
              <div className="text-base font-bold text-amber-400 font-sans">
                {bulbGlowState > 0.05 ? `${Math.round(bulbGlowState * 100)}% Phát sáng` : 'Tắt (0 W)'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {bulbGlowState > 0.05 ? `Công suất điện: ${(bulbGlowState * totalWc).toFixed(0)} W` : 'Chưa kích hoạt'}
              </div>
            </div>
          </div>

          {/* Standard Energy State Comparison Table */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>{hText.statesTableTitle}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1.5 px-2">Trạng thái</th>
                    <th className="py-1.5 px-2 text-sky-400">Wt (J)</th>
                    <th className="py-1.5 px-2 text-amber-400">Wđ (J)</th>
                    <th className="py-1.5 px-2 text-emerald-400">Tua-bin & Đèn</th>
                    <th className="py-1.5 px-2 text-right">Xem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr
                    className={`hover:bg-slate-800/40 transition ${
                      currentLandmark === 'top' ? 'bg-sky-500/10 text-sky-300' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2 font-bold font-sans">1. Đỉnh đập</td>
                    <td className="py-1.5 px-2 font-bold text-sky-400">{totalWc} J</td>
                    <td className="py-1.5 px-2 font-bold text-amber-400">0 J</td>
                    <td className="py-1.5 px-2 text-slate-400">Đứng yên (0 RPM, Tắt)</td>
                    <td className="py-1.5 px-2 text-right">
                      <button
                        onClick={() => jumpToLandmark('top')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[10px] cursor-pointer"
                      >
                        Chọn
                      </button>
                    </td>
                  </tr>
                  <tr
                    className={`hover:bg-slate-800/40 transition ${
                      currentLandmark === 'mid' ? 'bg-amber-500/10 text-amber-300' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2 font-bold font-sans">2. Giữa dốc</td>
                    <td className="py-1.5 px-2 font-bold text-sky-400">{Math.round(totalWc / 2)} J</td>
                    <td className="py-1.5 px-2 font-bold text-amber-400">{Math.round(totalWc / 2)} J</td>
                    <td className="py-1.5 px-2 text-sky-300">Nước chưa tới (Tắt)</td>
                    <td className="py-1.5 px-2 text-right">
                      <button
                        onClick={() => jumpToLandmark('mid')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] cursor-pointer"
                      >
                        Chọn
                      </button>
                    </td>
                  </tr>
                  <tr
                    className={`hover:bg-slate-800/40 transition ${
                      currentLandmark === 'low' ? 'bg-emerald-500/10 text-emerald-300' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2 font-bold font-sans">3. Chân tua-bin</td>
                    <td className="py-1.5 px-2 font-bold text-sky-400">0 J</td>
                    <td className="py-1.5 px-2 font-bold text-amber-400">{totalWc} J</td>
                    <td className="py-1.5 px-2 font-bold text-emerald-400">
                      Quay nhanh & Sáng ({mass === 1 ? '775' : mass === 2 ? '1150' : '1600'} RPM)
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <button
                        onClick={() => jumpToLandmark('turbine')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] cursor-pointer"
                      >
                        Chọn
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 italic leading-relaxed">
              * Ghi nhớ KHTN 9: Hồ chứa phải ở trên cao (h &gt; 0m) thì mới có thế năng hấp dẫn Wt = m·g·h để nước tự chảy dốc xuống. Khi chảy dọc ống áp lực, thế năng chuyển dần thành động năng Wđ. Tua-bin chỉ quay khi các hạt nước va đập trực tiếp vào cánh quạt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

