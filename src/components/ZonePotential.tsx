import React, { useState } from 'react';
import { Language } from '../types';
import { DICTIONARY } from '../locales/i18n';
import { playWaterDropSound } from '../utils/sound';
import { WaterfallCanvas } from './WaterfallCanvas';
import {
  Droplets,
  ArrowUpDown,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  CheckCircle,
  Eye,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Gauge,
  Wind,
  Waves,
} from 'lucide-react';

interface ZonePotentialProps {
  lang: Language;
}

export const ZonePotential: React.FC<ZonePotentialProps> = ({ lang }) => {
  const t = DICTIONARY[lang];
  const pText = t.potentialZone;

  // Mass of water: 1, 2, or 4 kg
  const [mWater, setMWater] = useState<number>(2);
  // Height above reference: 1, 2, 3, 4, 5 m
  const [height, setHeight] = useState<number>(4);
  // g = 10 N/kg
  const g = 10;
  // Visual slope angle: 30 deg, 45 deg, 75 deg
  const [visualSlope, setVisualSlope] = useState<number>(45);

  // Realistic waterfall simulation state
  const [isFlowing, setIsFlowing] = useState<boolean>(true); // Continuous flowing waterfall
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false); // 0.25x Slow motion
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false); // Audio synthesizer
  const [batchCount, setBatchCount] = useState<number>(0); // Discrete batch release trigger
  const [showVectors, setShowVectors] = useState<boolean>(false); // Show real-time velocity vectors

  // Compare mode: Reservoir A vs Reservoir B
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [mWaterB, setMWaterB] = useState<number>(2);
  const [heightB, setHeightB] = useState<number>(2);

  // Weight P = m * g
  const weight = mWater * g;
  // Potential Energy Wt = P * h = m * g * h
  const potentialEnergy = mWater * g * height;
  // Theoretical impact velocity v = sqrt(2 * g * h)
  const impactVelocity = Math.round(Math.sqrt(2 * g * height) * 10) / 10;

  // Comparison B potential
  const weightB = mWaterB * g;
  const potentialEnergyB = mWaterB * g * heightB;

  const handleHeightChange = (h: number) => {
    setHeight(h);
    playWaterDropSound(0.8 + h * 0.15);
  };

  const handleMassChange = (m: number) => {
    setMWater(m);
    playWaterDropSound(0.9 + m * 0.1);
  };

  // Trigger discrete batch test release
  const triggerBatchRelease = () => {
    setBatchCount((prev) => prev + 1);
    playWaterDropSound(1.2);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {pText.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {pText.subtitle}
          </p>
        </div>

        {/* Formula Display & Actions */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono font-bold text-sm sm:text-base">
            <span>Wt = P · h = m · g · h</span>
          </div>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              compareMode
                ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {compareMode ? 'Đóng so sánh 2 hồ' : 'So sánh 2 hồ nước'}
          </button>
        </div>
      </div>

      {/* Main Simulation Stage & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Realistic Waterfall Particle Simulation (7 Cols) */}
        <div className="lg:col-span-7 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Top lake metrics bar */}
          <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800 text-xs font-mono gap-2">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{t.common.waterVolume}:</span>
              <span className="text-amber-400 font-bold font-sans text-sm">{mWater} kg</span>
              <span className="text-slate-400">({weight} N)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Vận tốc chạm đáy (v):</span>
              <span className="text-sky-300 font-bold font-mono text-sm">{impactVelocity} m/s</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-400">{t.common.potentialEnergy}:</span>
              <span className="text-sky-400 font-bold font-sans text-base">
                {potentialEnergy} J
              </span>
            </div>
          </div>

          {/* REALISTIC WATERFALL CANVAS SIMULATION */}
          <div className="mt-3 relative">
            <WaterfallCanvas
              heightMeters={height}
              mWaterKg={mWater}
              visualSlopeDeg={visualSlope}
              isFlowing={isFlowing}
              isSlowMo={isSlowMo}
              soundEnabled={soundEnabled}
              batchReleaseCount={batchCount}
              showVectors={showVectors}
            />

            {/* Quick status overlays */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl backdrop-blur-md border text-xs font-medium transition cursor-pointer ${
                  soundEnabled
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 shadow-lg'
                    : 'bg-slate-900/70 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
                title={soundEnabled ? 'Tắt âm thanh thác nước' : 'Bật âm thanh thác nước'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsSlowMo(!isSlowMo)}
                className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold font-mono transition cursor-pointer ${
                  isSlowMo
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-lg'
                    : 'bg-slate-900/70 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
                title="Chế độ quay chậm để quan sát hạt nước li ti"
              >
                {isSlowMo ? '🐢 0.25x' : '⚡ 1.0x'}
              </button>
            </div>
          </div>

          {/* Interactive Waterfall Control Bar */}
          <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Continuous stream toggle */}
              <button
                onClick={() => setIsFlowing(!isFlowing)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isFlowing
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isFlowing ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Dừng dòng thác</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Chảy liên tục</span>
                  </>
                )}
              </button>

              {/* Batch test release */}
              <button
                onClick={triggerBatchRelease}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 shadow active:scale-95 transition cursor-pointer"
              >
                <Droplets className="w-3.5 h-3.5 fill-current" />
                <span>Xả khối nước thử nghiệm</span>
              </button>

              {/* Show vectors */}
              <button
                onClick={() => setShowVectors(!showVectors)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  showVectors
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {showVectors ? '✓ Véc-tơ v(y)' : 'Hiện véc-tơ v(y)'}
              </button>
            </div>

            {/* Cliff Slope Angle selector */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-slate-400 text-[11px]">Độ dốc sườn:</span>
              <div className="flex gap-1">
                {[
                  { angle: 30, label: '30°' },
                  { angle: 45, label: '45°' },
                  { angle: 75, label: '75°' },
                ].map((item) => (
                  <button
                    key={item.angle}
                    onClick={() => setVisualSlope(item.angle)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                      visualSlope === item.angle
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Controls & Scientific Feedback (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Slider 1: Reservoir Height (h) */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <ArrowUpDown className="w-4 h-4 text-sky-400" />
                <span>{pText.reservoirHeight}</span>
              </label>
              <span className="text-sm font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                h = {height} m
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              {[1, 2, 3, 4, 5].map((hVal) => (
                <button
                  key={hVal}
                  id={`height-btn-${hVal}`}
                  onClick={() => handleHeightChange(hVal)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                    height === hVal
                      ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-300 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {hVal} m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {pText.proportions.heightRule}
            </p>
          </div>

          {/* Slider 2: Water Volume / Mass (m) */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-amber-400" />
                <span>{pText.waterVolume}</span>
              </label>
              <span className="text-sm font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                m = {mWater} kg
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1, 2, 4].map((mVal) => (
                <button
                  key={mVal}
                  id={`water-mass-${mVal}`}
                  onClick={() => handleMassChange(mVal)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                    mWater === mVal
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mVal} kg ({mVal * g} N)
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {pText.proportions.massRule}
            </p>
          </div>

          {/* Live Energy Gauge Display Card */}
          <div className="bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-900 p-4 rounded-xl border border-sky-500/30">
            <div className="text-xs font-semibold text-slate-400 mb-1">
              {t.common.potentialEnergy} tính theo công thức KHTN 9:
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-sky-400">
                {potentialEnergy}
              </span>
              <span className="text-lg font-bold text-sky-300">Joule (J)</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 font-mono bg-slate-950/60 p-2 rounded border border-slate-800">
              Wt = m · g · h = {mWater} kg × 10 N/kg × {height} m = {potentialEnergy} J
            </div>
          </div>

          {/* CRITICAL SCIENTIFIC WARNING */}
          <div className="p-3.5 bg-red-950/30 border border-red-500/40 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{pText.scientificWarningTitle}</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {pText.scientificWarningContent}
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED SCIENTIFIC CRITERIA: NATURAL WATERFALL FLUID MECHANICS */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-sky-400">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Cơ Chế Vật Lí Thủy Động Lực Học Của Dòng Chảy Thác Nước Tự Nhiên
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Criterion 1 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold">
              <ArrowUpDown className="w-4 h-4 text-sky-400" />
              <span>1. Gia Tốc Rơi Tự Do (g)</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Nước tràn qua mép đá với vận tốc ngang ban đầu <span className="font-mono text-slate-200">vx0</span>, sau đó rơi nhanh dần đều với gia tốc <span className="font-mono text-slate-200">g = 10 m/s²</span> theo quỹ đạo parabol. Vận tốc chạm đáy <span className="font-mono text-sky-300 font-bold">v = √(2gh)</span>.
            </p>
          </div>

          {/* Criterion 2 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Droplets className="w-4 h-4 text-amber-400" />
              <span>2. Phân Rã Thành Hạt Li Ti</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Hiện tượng bất ổn định Rayleigh-Plateau: Dòng nước bị kéo giãn và ma sát không khí làm dải nước bị xé rách thành hàng nghìn hạt nước li ti, bọt khí trắng xóa (<span className="text-slate-200 font-medium">aeration / white water</span>) và các vệt tốc độ dài.
            </p>
          </div>

          {/* Criterion 3 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <Waves className="w-4 h-4 text-emerald-400" />
              <span>3. Va Chạm Hồ Chân Thác</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Tại mốc <span className="font-mono text-slate-200">h = 0m</span>, toàn bộ thế năng chuyển hóa thành động năng <span className="font-mono text-emerald-300 font-bold">Wđ = ½mv² = mgh</span>, làm giải phóng năng lượng thành sóng nước đồng tâm, bọt sủi tăm và các giọt bắn ngược lên cao (<span className="text-slate-200 font-medium">rebound spray</span>).
            </p>
          </div>

          {/* Criterion 4 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
              <Wind className="w-4 h-4 text-indigo-400" />
              <span>4. Bụi Nước Sương Mù (Mist)</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Luồng gió cuộn do cột nước rơi (downdraft displacement) thổi các hạt vi nước bốc lên thành đám mây sương mù hơi ẩm bảng lảng bao quanh chân thác, tạo nên vẻ đẹp tự nhiên và sự thanh mát thực tế.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Drawer if Active: Lake A vs Lake B */}
      {compareMode && (
        <div className="bg-slate-900 p-4 rounded-2xl border-2 border-sky-500/40 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Thực nghiệm so sánh: Hồ A vs Hồ B</span>
            </h3>
            <span className="text-xs text-sky-400 font-mono font-bold">
              Chỉ có độ cao h và khối lượng m quyết định Wt!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lake A */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="font-bold text-amber-400 text-xs mb-2">HỒ CHỨA A</div>
              <div className="text-xs space-y-1 font-mono text-slate-300">
                <div>Khối lượng nước m = {mWater} kg</div>
                <div>Độ cao h = {height} m</div>
                <div className="text-sm font-bold text-sky-400 pt-1">
                  Wt(A) = {potentialEnergy} J
                </div>
              </div>
            </div>

            {/* Lake B */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sky-400 text-xs">HỒ CHỨA B</span>
                <div className="flex gap-2">
                  <select
                    value={mWaterB}
                    onChange={(e) => setMWaterB(Number(e.target.value))}
                    className="bg-slate-900 text-xs border border-slate-700 rounded px-1 py-0.5 text-white"
                  >
                    <option value={1}>1 kg</option>
                    <option value={2}>2 kg</option>
                    <option value={4}>4 kg</option>
                  </select>
                  <select
                    value={heightB}
                    onChange={(e) => setHeightB(Number(e.target.value))}
                    className="bg-slate-900 text-xs border border-slate-700 rounded px-1 py-0.5 text-white"
                  >
                    <option value={1}>1 m</option>
                    <option value={2}>2 m</option>
                    <option value={3}>3 m</option>
                    <option value={4}>4 m</option>
                    <option value={5}>5 m</option>
                  </select>
                </div>
              </div>
              <div className="text-xs space-y-1 font-mono text-slate-300">
                <div>Khối lượng nước m = {mWaterB} kg</div>
                <div>Độ cao h = {heightB} m</div>
                <div className="text-sm font-bold text-sky-400 pt-1">
                  Wt(B) = {potentialEnergyB} J
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2.5 bg-slate-800/60 rounded-lg text-xs text-slate-300 flex items-center justify-between">
            <span>
              {potentialEnergy > potentialEnergyB
                ? `👉 Thế năng Hồ A lớn hơn Hồ B (+${potentialEnergy - potentialEnergyB} J)`
                : potentialEnergy < potentialEnergyB
                ? `👉 Thế năng Hồ B lớn hơn Hồ A (+${potentialEnergyB - potentialEnergy} J)`
                : '👉 Hai hồ có thế năng hoàn toàn bằng nhau!'}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Tỉ lệ Wt(A)/Wt(B) = {(potentialEnergy / (potentialEnergyB || 1)).toFixed(2)}x
            </span>
          </div>
        </div>
      )}

      {/* Standard Educational Data Table (SPEC Section 3) */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h3 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Bảng dữ liệu giáo dục mẫu chuẩn KHTN 9 (g = 10 N/kg)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 px-2">m (kg)</th>
                <th className="py-1.5 px-2">h (m)</th>
                <th className="py-1.5 px-2 text-sky-400">Wt (J)</th>
                <th className="py-1.5 px-2 text-slate-300">Quy tắc trực quan</th>
                <th className="py-1.5 px-2 text-right">Nạp mẫu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {[
                { m: 1, h: 2, wt: 20, rule: 'Chuẩn ban đầu' },
                { m: 1, h: 4, wt: 40, rule: 'Cùng m: h tăng gấp 2 → Wt tăng gấp 2' },
                { m: 2, h: 4, wt: 80, rule: 'Cùng h: m tăng gấp 2 → Wt tăng gấp 2' },
                { m: 4, h: 4, wt: 160, rule: 'Cùng h: m tăng gấp 4 → Wt tăng gấp 4' },
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/40 transition ${
                    mWater === row.m && height === row.h ? 'bg-sky-500/10 text-sky-300' : ''
                  }`}
                >
                  <td className="py-1.5 px-2 font-bold">{row.m}</td>
                  <td className="py-1.5 px-2 font-bold">{row.h}</td>
                  <td className="py-1.5 px-2 font-bold text-sky-400">{row.wt}</td>
                  <td className="py-1.5 px-2 text-[11px] text-slate-400">{row.rule}</td>
                  <td className="py-1.5 px-2 text-right">
                    <button
                      onClick={() => {
                        setMWater(row.m);
                        setHeight(row.h);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[10px] font-sans border border-slate-700 cursor-pointer"
                    >
                      Chọn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

