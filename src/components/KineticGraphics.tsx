import React from 'react';
import { VehicleModel, ObstacleModel } from '../data/kineticData';
import { Flame, MoveHorizontal } from 'lucide-react';

interface VehicleGraphicProps {
  vehicle: VehicleModel;
  mass: number;
  speed: number;
  wheelAngle: number;
  isSimulating: boolean;
  pullback: number;
  simPhase: string;
  onLaunch: () => void;
}

export const VehicleGraphic: React.FC<VehicleGraphicProps> = ({
  vehicle,
  mass,
  speed,
  wheelAngle,
  isSimulating,
  pullback,
  simPhase,
  onLaunch,
}) => {
  const isLab = vehicle.category === 'lab';

  return (
    <div className="relative select-none">
      {/* Direct Release Trigger Button / Pull Hint floating above the vehicle */}
      {!isSimulating && (
        pullback > 15 ? (
          <button
            id="car-direct-release-btn"
            onClick={(e) => {
              e.stopPropagation();
              onLaunch();
            }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-lg border border-amber-200 flex items-center gap-1 cursor-pointer active:scale-95 transition hover:scale-105 z-30 animate-pulse"
            title="Bấm để thả tay phóng xe ngay"
          >
            <Flame className="w-3 h-3 fill-current" />
            <span>Thả tay phóng 🚀</span>
          </button>
        ) : (
          <div className="absolute -top-7 -left-3 whitespace-nowrap bg-amber-500/90 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow pointer-events-none flex items-center gap-1 animate-pulse">
            <span>← Kéo lùi để nạp thế năng</span>
          </div>
        )
      )}

      {/* 1. LAB CAR SCALE (1kg, 2kg, 4kg) */}
      {isLab && (
        <div
          className="relative rounded-xl p-1.5 shadow-xl border flex flex-col justify-between"
          style={{
            backgroundColor: vehicle.color,
            borderColor: vehicle.stroke,
            width: mass <= 1 ? '74px' : mass <= 2 ? '86px' : '102px',
            height: '48px',
          }}
        >
          {/* Rear hitch attached to launch spring */}
          <div className="absolute -left-2 top-4 w-2.5 h-3 bg-slate-800 rounded-l border border-amber-400/80" />

          {/* Internal payload compartment with weights */}
          <div className="w-full h-full bg-slate-950/35 rounded-lg flex items-center justify-center text-white font-bold text-xs tracking-wider gap-1">
            <span>{mass} kg</span>
            {mass >= 2 && (
              <span className="text-[9px] bg-amber-400/30 text-amber-200 px-1 py-0.2 rounded">
                +{mass - 1}kg tải
              </span>
            )}
          </div>

          {/* Wheels */}
          <div
            className="absolute -bottom-3 left-2.5 w-6 h-6 bg-slate-900 rounded-full border-2 border-slate-300 flex items-center justify-center shadow"
            style={{ transform: `rotate(${wheelAngle}deg)` }}
          >
            <div className="w-4 h-0.5 bg-slate-400 absolute" />
            <div className="w-0.5 h-4 bg-slate-400 absolute" />
            <div className="w-2 h-2 bg-amber-400 rounded-full z-10" />
          </div>

          <div
            className="absolute -bottom-3 right-2.5 w-6 h-6 bg-slate-900 rounded-full border-2 border-slate-300 flex items-center justify-center shadow"
            style={{ transform: `rotate(${wheelAngle}deg)` }}
          >
            <div className="w-4 h-0.5 bg-slate-400 absolute" />
            <div className="w-0.5 h-4 bg-slate-400 absolute" />
            <div className="w-2 h-2 bg-amber-400 rounded-full z-10" />
          </div>
        </div>
      )}

      {/* 2. REAL-WORLD MOTORBIKE (Xe máy) */}
      {vehicle.id === 'real-moto' && (
        <div className="relative w-24 h-14 flex items-end">
          {/* Headlight beam */}
          {(simPhase === 'cruise' || simPhase === 'spring') && (
            <div
              className="absolute right-[-45px] top-3 w-16 h-8 pointer-events-none opacity-60"
              style={{
                background: 'radial-gradient(ellipse at left, rgba(56, 189, 248, 0.7) 0%, rgba(56, 189, 248, 0) 75%)',
                clipPath: 'polygon(0% 30%, 100% 0%, 100% 100%, 0% 70%)',
              }}
            />
          )}

          {/* Rear hitch */}
          <div className="absolute left-0 top-6 w-2 h-2.5 bg-slate-700 rounded-l" />

          {/* Motorbike SVG Body */}
          <svg className="w-full h-full overflow-visible" viewBox="0 0 96 56">
            {/* Windshield & Handlebar */}
            <path d="M 68 12 L 62 22 L 56 22" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <path d="M 62 10 L 72 20" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.8" />

            {/* Rider Seat & Gas Tank */}
            <path d="M 28 26 Q 44 22 56 22 L 64 30 L 46 34 L 28 30 Z" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
            <path d="M 32 24 Q 42 26 50 24" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

            {/* Exhaust Pipe */}
            <path d="M 34 38 L 18 36" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

            {/* Headlight LED */}
            <circle cx="70" cy="24" r="3" fill="#38bdf8" />

            {/* Badge label */}
            <rect x="30" y="27" width="28" height="11" rx="3" fill="rgba(15, 23, 42, 0.85)" />
            <text x="44" y="35" fill="#e2e8f0" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              {mass}kg
            </text>

            {/* Front Wheel with Spokes */}
            <g transform={`translate(74, 42) rotate(${wheelAngle})`}>
              <circle r="11" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
              <circle r="8" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
              <circle r="3" fill="#06b6d4" />
            </g>

            {/* Rear Wheel with Spokes */}
            <g transform={`translate(22, 42) rotate(${wheelAngle})`}>
              <circle r="11" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
              <circle r="8" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
              <circle r="3" fill="#06b6d4" />
            </g>
          </svg>
        </div>
      )}

      {/* 3. REAL-WORLD SEDAN CAR (Ô tô con) */}
      {vehicle.id === 'real-car' && (
        <div className="relative w-32 h-14 flex items-end">
          {/* Headlight beam */}
          {(simPhase === 'cruise' || simPhase === 'spring') && (
            <div
              className="absolute right-[-55px] top-4 w-20 h-9 pointer-events-none opacity-50"
              style={{
                background: 'radial-gradient(ellipse at left, rgba(250, 204, 21, 0.8) 0%, rgba(250, 204, 21, 0) 80%)',
                clipPath: 'polygon(0% 30%, 100% 0%, 100% 100%, 0% 70%)',
              }}
            />
          )}

          {/* Rear hitch */}
          <div className="absolute left-0 top-7 w-2 h-2.5 bg-slate-700 rounded-l" />

          {/* Car SVG Body */}
          <svg className="w-full h-full overflow-visible" viewBox="0 0 128 56">
            {/* Streamlined Body */}
            <path
              d="M 6 36 L 16 36 L 24 24 L 52 14 L 86 14 L 104 26 L 122 30 L 124 38 L 116 42 L 12 42 Z"
              fill="#8b5cf6"
              stroke="#7c3aed"
              strokeWidth="2"
            />

            {/* Glass windows */}
            <path
              d="M 28 24 L 50 17 L 66 17 L 66 26 L 28 26 Z"
              fill="#1e1b4b"
              stroke="#a78bfa"
              strokeWidth="1"
            />
            <path
              d="M 70 17 L 84 17 L 98 26 L 70 26 Z"
              fill="#1e1b4b"
              stroke="#a78bfa"
              strokeWidth="1"
            />

            {/* Front Headlight & Rear Taillight */}
            <polygon points="120,31 125,32 123,36 118,35" fill="#facc15" />
            <rect x="6" y="32" width="4" height="6" rx="1" fill="#ef4444" />

            {/* Badge label */}
            <rect x="42" y="29" width="44" height="11" rx="3" fill="rgba(15, 23, 42, 0.9)" />
            <text x="64" y="37.5" fill="#e2e8f0" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              Ô tô {mass}kg
            </text>

            {/* Rear Wheel with 5-spoke Alloy Rim */}
            <g transform={`translate(28, 44) rotate(${wheelAngle})`}>
              <circle r="10.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
              <circle r="3" fill="#8b5cf6" />
            </g>

            {/* Front Wheel with 5-spoke Alloy Rim */}
            <g transform={`translate(100, 44) rotate(${wheelAngle})`}>
              <circle r="10.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
              <circle r="3" fill="#8b5cf6" />
            </g>
          </svg>
        </div>
      )}

      {/* 4. REAL-WORLD HEAVY TRUCK (Xe tải nặng) */}
      {vehicle.id === 'real-truck' && (
        <div className="relative w-40 h-16 flex items-end">
          {/* Headlight beam */}
          {(simPhase === 'cruise' || simPhase === 'spring') && (
            <div
              className="absolute right-[-65px] top-6 w-24 h-10 pointer-events-none opacity-50"
              style={{
                background: 'radial-gradient(ellipse at left, rgba(251, 146, 60, 0.8) 0%, rgba(251, 146, 60, 0) 80%)',
                clipPath: 'polygon(0% 30%, 100% 0%, 100% 100%, 0% 70%)',
              }}
            />
          )}

          {/* Rear hitch */}
          <div className="absolute left-0 top-8 w-2 h-3 bg-slate-700 rounded-l" />

          {/* Truck SVG Body */}
          <svg className="w-full h-full overflow-visible" viewBox="0 0 160 64">
            {/* Cargo Container Box */}
            <rect x="4" y="10" width="102" height="38" rx="3" fill="#ea580c" stroke="#c2410c" strokeWidth="2" />
            {/* Container corrugated steel ribs */}
            <line x1="20" y1="12" x2="20" y2="46" stroke="#c2410c" strokeWidth="1.5" />
            <line x1="38" y1="12" x2="38" y2="46" stroke="#c2410c" strokeWidth="1.5" />
            <line x1="56" y1="12" x2="56" y2="46" stroke="#c2410c" strokeWidth="1.5" />
            <line x1="74" y1="12" x2="74" y2="46" stroke="#c2410c" strokeWidth="1.5" />
            <line x1="92" y1="12" x2="92" y2="46" stroke="#c2410c" strokeWidth="1.5" />

            {/* Truck Driver Cabin */}
            <path
              d="M 108 48 L 108 14 L 134 14 L 148 28 L 154 36 L 154 48 Z"
              fill="#f97316"
              stroke="#ea580c"
              strokeWidth="2"
            />
            {/* Windshield */}
            <polygon points="124,18 132,18 144,30 124,30" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />

            {/* Vertical Chrome Exhaust Pipe */}
            <rect x="105" y="4" width="3" height="16" fill="#cbd5e1" rx="1" />

            {/* Bumper, Grille, and Headlights */}
            <rect x="146" y="38" width="8" height="6" fill="#facc15" rx="1" />
            <rect x="144" y="44" width="12" height="4" fill="#64748b" rx="1" />

            {/* Badge label */}
            <rect x="22" y="24" width="66" height="13" rx="3" fill="rgba(15, 23, 42, 0.85)" />
            <text x="55" y="33.5" fill="#fdba74" fontSize="8.5" fontWeight="bold" textAnchor="middle">
              Xe tải {mass.toLocaleString('vi-VN')} kg
            </text>

            {/* Rear Tandem Wheels */}
            <g transform={`translate(26, 52) rotate(${wheelAngle})`}>
              <circle r="10.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="2.5" />
              <circle r="4" fill="#ea580c" />
            </g>
            <g transform={`translate(48, 52) rotate(${wheelAngle})`}>
              <circle r="10.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="2.5" />
              <circle r="4" fill="#ea580c" />
            </g>

            {/* Front Steering Wheel */}
            <g transform={`translate(132, 52) rotate(${wheelAngle})`}>
              <circle r="10.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="2.5" />
              <circle r="4" fill="#ea580c" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};

interface ObstacleGraphicProps {
  obstacle: ObstacleModel;
  obstacleMass: number;
  frictionForce: number;
  obstacleDistance: number;
  blockX: number;
  isSimulating: boolean;
  isDraggingObstacle: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

export const ObstacleGraphic: React.FC<ObstacleGraphicProps> = ({
  obstacle,
  obstacleMass,
  frictionForce,
  obstacleDistance,
  blockX,
  isSimulating,
  isDraggingObstacle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) => {
  return (
    <div
      id="kinetic-barrier-block"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        transform: `translateX(${140 + obstacleDistance + blockX}px)`,
        cursor: isSimulating ? 'default' : isDraggingObstacle ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      className="absolute top-7 z-10 select-none transition-none group"
    >
      {/* Drag indicator badge on top of obstacle */}
      {!isSimulating && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 font-mono text-[9px] font-bold rounded-full border border-indigo-500/50 shadow-md flex items-center gap-1 cursor-grab active:cursor-grabbing transition">
          <MoveHorizontal className="w-2.5 h-2.5 text-indigo-400" />
          <span>Kéo cản gần/xa (+{obstacleDistance}cm)</span>
        </div>
      )}

      {/* 1. KHỐI XỐP SGK */}
      {obstacle.id === 'foam' && (
        <div className="w-20 h-24 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 border-2 border-amber-500/80 rounded-lg flex flex-col items-center justify-between p-1.5 text-[10px] text-amber-100 font-mono shadow-2xl relative cursor-grab active:cursor-grabbing hover:border-amber-400 transition-colors">
          <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#000_0,#000_2px,transparent_0,transparent_6px)] rounded-md pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="font-extrabold text-white text-[9.5px] tracking-wide">VẬT CẢN</span>
            <span className="text-[8px] text-amber-300 font-sans font-medium">Khối xốp SGK</span>
            <span className="text-[8.5px] text-amber-200 font-bold bg-amber-950/70 px-1 rounded mt-0.5">
              M = {obstacleMass} kg
            </span>
          </div>
          <div className="relative z-10 w-full flex justify-center gap-1 my-0.5">
            <div className="w-1.5 h-6 bg-amber-950/70 rounded-full border-r border-amber-600/50" />
            <div className="w-1.5 h-6 bg-amber-950/70 rounded-full border-r border-amber-600/50" />
            <div className="w-1.5 h-6 bg-amber-950/70 rounded-full border-r border-amber-600/50" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[8px] text-amber-200/90 font-mono">Fc = {frictionForce} N</span>
            {blockX > 2 && (
              <span className="text-[9px] text-emerald-300 font-bold bg-slate-950/90 px-1.5 py-0.2 rounded border border-emerald-500/50 shadow">
                +{Math.round(blockX / 0.8)} cm
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. KIỆN THÙNG HÀNG GỖ */}
      {obstacle.id === 'wood' && (
        <div className="w-22 h-24 bg-gradient-to-br from-amber-800 via-amber-900 to-stone-900 border-2 border-amber-600/90 rounded-lg flex flex-col items-center justify-between p-1.5 text-[10px] text-amber-100 font-mono shadow-2xl relative cursor-grab active:cursor-grabbing hover:border-amber-400 transition-colors">
          {/* Diagonal steel bracing ribbons */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
            <div className="w-full h-0.5 bg-black rotate-45" />
            <div className="w-full h-0.5 bg-black -rotate-45" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <span className="font-extrabold text-white text-[9.5px] tracking-wide">THÙNG GỖ</span>
            <span className="text-[8px] text-amber-300 font-sans font-medium">Kiện hàng nặng</span>
            <span className="text-[8.5px] text-amber-200 font-bold bg-stone-950/80 px-1 rounded mt-0.5">
              M = {obstacleMass} kg
            </span>
          </div>
          <div className="relative z-10 flex items-center justify-center gap-1 text-[8px] text-amber-300/80">
            <span>🍷 DỄ VỠ</span>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[8px] text-amber-200/90 font-mono">Fc = {frictionForce} N</span>
            {blockX > 2 && (
              <span className="text-[9px] text-emerald-300 font-bold bg-slate-950/90 px-1.5 py-0.2 rounded border border-emerald-500/50 shadow">
                +{Math.round(blockX / 0.8)} cm
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. THÙNG PHUY AN TOÀN */}
      {obstacle.id === 'barrel' && (
        <div className="w-20 h-24 bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-700 border-2 border-yellow-300 rounded-xl flex flex-col items-center justify-between p-1.5 text-[10px] text-slate-950 font-mono shadow-2xl relative cursor-grab active:cursor-grabbing hover:border-yellow-200 transition-colors">
          {/* Hazard diagonal chevron stripes */}
          <div className="absolute inset-x-0 top-7 h-7 opacity-75 bg-[repeating-linear-gradient(45deg,#000_0,#000_6px,#eab308_6px,#eab308_12px)] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center bg-slate-950/80 text-yellow-300 px-1 py-0.5 rounded">
            <span className="font-black text-[9px]">THÙNG PHUY</span>
            <span className="text-[7.5px] text-yellow-200">Cát giảm chấn</span>
          </div>
          <div className="relative z-10 bg-slate-950/90 text-white font-bold text-[8.5px] px-1 rounded">
            M = {obstacleMass} kg
          </div>
          <div className="relative z-10 flex flex-col items-center bg-slate-950/80 px-1.5 py-0.5 rounded text-amber-300">
            <span className="text-[8px] font-mono">Fc = {frictionForce} N</span>
            {blockX > 2 && (
              <span className="text-[9px] text-emerald-300 font-bold">
                +{Math.round(blockX / 0.8)} cm
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. KHỐI BÊ TÔNG JERSEY */}
      {obstacle.id === 'concrete' && (
        <div className="w-22 h-24 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 border-2 border-slate-400 rounded-t-lg rounded-b-xl flex flex-col items-center justify-between p-1.5 text-[10px] text-slate-100 font-mono shadow-2xl relative cursor-grab active:cursor-grabbing hover:border-slate-300 transition-colors">
          {/* Flanged base anti-rollover angle */}
          <div className="absolute inset-x-0 top-8 h-6 opacity-80 bg-[repeating-linear-gradient(-45deg,#dc2626_0,#dc2626_6px,#f8fafc_6px,#f8fafc_12px)] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="font-extrabold text-white text-[9px] tracking-wide">BÊ TÔNG</span>
            <span className="text-[7.5px] text-slate-300 font-sans">Dải phân cách</span>
          </div>
          <div className="relative z-10 bg-slate-950/90 text-amber-400 font-bold text-[8.5px] px-1.5 rounded">
            M = {obstacleMass.toLocaleString('vi-VN')} kg
          </div>
          <div className="relative z-10 flex flex-col items-center bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300">
            <span className="text-[8px] font-mono">Fc = {frictionForce} N</span>
            {blockX > 2 && (
              <span className="text-[9px] text-emerald-300 font-bold">
                +{Math.round(blockX / 0.8)} cm
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
