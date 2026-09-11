import React, { useRef, useEffect } from 'react';
import {
  startWaterfallAudio,
  stopWaterfallAudio,
  playTurbineWhir,
  playWaterSplash,
} from '../utils/sound';

interface HydroCanvasProps {
  mass: number; // 1, 2, 4 kg (mật độ dòng nước)
  generationMode: 'packet' | 'continuous';
  isPlaying: boolean;
  progress: number; // 0 to 1.25 in packet mode, or continuous
  onProgressUpdate: (nextProgress: number) => void;
  isSlowMo: boolean;
  soundEnabled: boolean;
  onTurbineMetrics: (rpm: number, bulbGlow: number, isStriking: boolean) => void;
}

interface HydroDroplet {
  id: number;
  t: number; // 0.0 at intake, 1.0 at nozzle exit
  lateral: number; // -0.85 to 0.85 across pipe diameter
  speed: number; // current speed along pipe (px/s)
  radius: number;
  color: string;
  alpha: number;
  isAerated: boolean;
  // State after exiting nozzle
  phase: 'pipe' | 'jet' | 'rebound' | 'drained';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  life?: number;
  maxLife?: number;
}

interface HydroSplash {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface HydroFoam {
  x: number;
  y: number;
  vx: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface HydroRipple {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export const HydroCanvas: React.FC<HydroCanvasProps> = ({
  mass,
  generationMode,
  isPlaying,
  progress,
  onProgressUpdate,
  isSlowMo,
  soundEnabled,
  onTurbineMetrics,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cssSizeRef = useRef<{ width: number; height: number }>({ width: 800, height: 480 });

  // Particles
  const dropletsRef = useRef<HydroDroplet[]>([]);
  const splashesRef = useRef<HydroSplash[]>([]);
  const foamRef = useRef<HydroFoam[]>([]);
  const ripplesRef = useRef<HydroRipple[]>([]);
  const nextParticleIdRef = useRef<number>(1);

  // Packet emission state
  const packetRemainingRef = useRef<number>(0);
  const totalPacketParticlesRef = useRef<number>(0);
  const packetActiveRef = useRef<boolean>(false);
  const prevIsPlayingRef = useRef<boolean>(false);

  // Turbine physical state
  const turbineRpmRef = useRef<number>(0);
  const turbineAngleRef = useRef<number>(0);
  const bulbGlowRef = useRef<number>(0);

  // Audio throttling
  const whirSoundThrottleRef = useRef<number>(0);

  // Synchronize audio
  useEffect(() => {
    if (soundEnabled && isPlaying) {
      const vol = 0.08 + (mass / 4) * 0.12;
      startWaterfallAudio(vol);
    } else {
      stopWaterfallAudio();
    }
    return () => {
      stopWaterfallAudio();
    };
  }, [soundEnabled, isPlaying, mass]);

  // Handle Play / Stop triggers for packet mode
  useEffect(() => {
    if (isPlaying && !prevIsPlayingRef.current) {
      // Start of a new flow
      if (generationMode === 'packet') {
        const total = 180 + mass * 90; // 1kg: 270, 2kg: 360, 4kg: 540 particles
        packetRemainingRef.current = total;
        totalPacketParticlesRef.current = total;
        packetActiveRef.current = true;
      }
    }
    if (!isPlaying && prevIsPlayingRef.current) {
      // Paused or reset
      if (progress === 0) {
        dropletsRef.current = [];
        splashesRef.current = [];
        foamRef.current = [];
        ripplesRef.current = [];
        packetRemainingRef.current = 0;
        packetActiveRef.current = false;
        turbineRpmRef.current = 0;
        bulbGlowRef.current = 0;
      }
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, generationMode, mass, progress]);

  // Main Simulation & Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let spawnAccumulator = 0;

    const render = (now: number) => {
      const rawDt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const dt = isSlowMo ? rawDt * 0.25 : rawDt;

      const width = cssSizeRef.current.width || 800;
      const height = cssSizeRef.current.height || 480;
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      // Coordinates setup adapted to the expansive simulation canvas
      const groundY = height - 58;
      const reservoirTopY = 48;
      const reservoirBottomY = Math.max(reservoirTopY + 80, groundY - 180);
      const damWallX = Math.max(160, Math.min(240, width * 0.23));
      const penstockStartX = damWallX + 6;
      const penstockStartY = reservoirTopY + 38;

      // Powerhouse & Turbine coordinates
      const nozzleX = Math.max(damWallX + 220, Math.min(width - 240, width * 0.62));
      const nozzleY = groundY - 32;
      const turbineCenterX = nozzleX + 46;
      const turbineCenterY = nozzleY + 2;
      const turbineRadius = 28;

      // Penstock vector
      const pipeDx = nozzleX - penstockStartX;
      const pipeDy = nozzleY - penstockStartY;
      const pipeLength = Math.sqrt(pipeDx * pipeDx + pipeDy * pipeDy);
      const pipeTx = pipeDx / pipeLength;
      const pipeTy = pipeDy / pipeLength;
      const pipeNx = -pipeTy;
      const pipeNy = pipeTx;
      const pipeRadius = 12 + mass * 2.6;

      // ======================================================================
      // 1. PARTICLE EMISSION (ONLY DISCRETE WATER DROPLETS, NO SOLID BLOCKS!)
      // ======================================================================
      let spawnRate = 0;
      if (isPlaying) {
        if (generationMode === 'continuous') {
          spawnRate = 140 + mass * 75;
        } else if (generationMode === 'packet' && packetRemainingRef.current > 0) {
          // Discharges the packet in ~1.8 - 2.2 seconds
          spawnRate = 160 + mass * 85;
        }
      }

      spawnAccumulator += spawnRate * dt;

      while (spawnAccumulator >= 1) {
        spawnAccumulator -= 1;
        if (generationMode === 'packet') {
          if (packetRemainingRef.current <= 0) break;
          packetRemainingRef.current -= 1;
        }

        const isAerated = Math.random() < 0.35;
        let color = '#38bdf8';
        if (isAerated) {
          color = Math.random() > 0.45 ? '#ffffff' : '#e0f2fe';
        } else if (Math.random() > 0.4) {
          color = '#7dd3fc';
        } else {
          color = '#0284c7';
        }

        dropletsRef.current.push({
          id: nextParticleIdRef.current++,
          t: Math.random() * 0.03, // Starts right at the intake mouth
          lateral: (Math.random() - 0.5) * 1.5,
          speed: 35 + Math.random() * 20, // Initial entry velocity ~0.4 m/s
          radius: isAerated ? 1.0 + Math.random() * 1.4 : 1.4 + Math.random() * 1.8,
          color,
          alpha: 0.9 + Math.random() * 0.1,
          isAerated,
          phase: 'pipe',
        });
      }

      // ======================================================================
      // 2. PARTICLE PHYSICS: ACCELERATING DOWN PENSTOCK (a = g * sin(theta))
      // ======================================================================
      const nextDroplets: HydroDroplet[] = [];
      const pixelGravity = 620; // Gravitational acceleration in pixels/s^2
      let activeStrikingCount = 0;
      let minT = 1.0;
      let maxT = 0.0;

      for (let i = 0; i < dropletsRef.current.length; i++) {
        const d = dropletsRef.current[i];

        if (d.phase === 'pipe') {
          // Inside penstock: accelerates according to slope angle
          const accel = pixelGravity * pipeTy * 1.35;
          d.speed += accel * dt;

          // Advance along pipe
          d.t += (d.speed / pipeLength) * dt;

          if (d.t < minT) minT = d.t;
          if (d.t > maxT) maxT = d.t;

          if (d.t < 1.0) {
            // Still racing down the penstock pipe
            nextDroplets.push(d);
          } else {
            // Reached nozzle exit: transitions to high-speed jet striking turbine
            d.phase = 'jet';
            d.t = 1.0;
            const exitPx = penstockStartX + pipeDx + d.lateral * (pipeRadius - 3) * pipeNx;
            const exitPy = penstockStartY + pipeDy + d.lateral * (pipeRadius - 3) * pipeNy;
            d.x = exitPx;
            d.y = exitPy;
            d.vx = pipeTx * d.speed;
            d.vy = pipeTy * d.speed;
            d.life = 0;
            d.maxLife = 0.25;
            nextDroplets.push(d);
          }
        } else if (d.phase === 'jet') {
          // Shooting from nozzle towards turbine cups
          d.life = (d.life || 0) + dt;
          d.x = (d.x || nozzleX) + (d.vx || 0) * dt;
          d.y = (d.y || nozzleY) + (d.vy || 0) * dt;

          // Check if droplet hits the turbine runner cups
          const dxToTurbine = (d.x || 0) - turbineCenterX;
          const dyToTurbine = (d.y || 0) - turbineCenterY;
          const distToCenter = Math.sqrt(dxToTurbine * dxToTurbine + dyToTurbine * dyToTurbine);

          if (distToCenter <= turbineRadius + 6 || (d.life || 0) > 0.08) {
            // PARTICLE IMPACTS TURBINE CUP!
            activeStrikingCount++;

            // Trigger splash rebounds
            if (splashesRef.current.length < 130) {
              const count = 1 + Math.floor(Math.random() * 2);
              for (let s = 0; s < count; s++) {
                splashesRef.current.push({
                  x: d.x || turbineCenterX - 15,
                  y: d.y || turbineCenterY,
                  vx: -25 + (Math.random() - 0.2) * 130,
                  vy: -(35 + Math.random() * 95),
                  radius: 0.9 + Math.random() * 1.7,
                  alpha: 0.95,
                  life: 0,
                  maxLife: 0.3 + Math.random() * 0.35,
                  color: Math.random() > 0.4 ? '#ffffff' : '#bae6fd',
                });
              }
            }

            // Foam generation in tailrace
            if (foamRef.current.length < 100 && Math.random() < 0.35) {
              foamRef.current.push({
                x: turbineCenterX + 10 + (Math.random() - 0.5) * 35,
                y: groundY + 4 + (Math.random() - 0.5) * 6,
                vx: 15 + Math.random() * 30,
                radius: 1.5 + Math.random() * 3.5,
                alpha: 0.85,
                life: 0,
                maxLife: 0.8 + Math.random() * 0.8,
              });
            }

            // Surface ripples in tailrace canal
            if (ripplesRef.current.length < 35 && Math.random() < 0.12) {
              ripplesRef.current.push({
                x: turbineCenterX + 15 + (Math.random() - 0.5) * 25,
                y: groundY + 8,
                radiusX: 2,
                radiusY: 1,
                alpha: 0.7,
                life: 0,
                maxLife: 0.9,
              });
            }

            // Transition droplet to drained rebound
            d.phase = 'rebound';
            d.vx = -15 + Math.random() * 35;
            d.vy = 20 + Math.random() * 60;
            d.life = 0;
            d.maxLife = 0.35;
            nextDroplets.push(d);
          } else {
            nextDroplets.push(d);
          }
        } else if (d.phase === 'rebound') {
          // Falling down into tailrace canal
          d.life = (d.life || 0) + dt;
          d.vy = (d.vy || 0) + pixelGravity * dt;
          d.x = (d.x || 0) + (d.vx || 0) * dt;
          d.y = (d.y || 0) + (d.vy || 0) * dt;
          d.alpha = Math.max(0, 0.9 * (1 - (d.life || 0) / (d.maxLife || 0.35)));

          if ((d.life || 0) < (d.maxLife || 0.35) && (d.y || 0) <= groundY + 16) {
            nextDroplets.push(d);
          }
        }
      }
      dropletsRef.current = nextDroplets;

      // ======================================================================
      // 3. TURBINE PHYSICAL RESPONSE (Starts slow, accelerates, and stops when water ends!)
      // ======================================================================
      // Density factor: 1kg (thưa, 0.5), 2kg (chuẩn, 0.75), 4kg (đậm đặc, 1.0)
      const densityFactor = mass === 1 ? 0.5 : mass === 2 ? 0.75 : 1.0;
      const targetRpm = Math.round(550 + densityFactor * 1050); // 1kg -> ~775, 2kg -> ~1150, 4kg -> ~1600 RPM
      const isWaterStriking = activeStrikingCount > 0;

      if (isWaterStriking) {
        // As requested: Khi vừa tác dụng, tua-bin quay chậm và sau đó nhanh lên
        // Torque acceleration rate scales with mass & volume of hitting particles
        const torqueAccel = 180 + densityFactor * 720;
        if (turbineRpmRef.current < targetRpm) {
          turbineRpmRef.current = Math.min(
            targetRpm,
            turbineRpmRef.current + dt * torqueAccel
          );
        } else if (turbineRpmRef.current > targetRpm + 15) {
          turbineRpmRef.current = Math.max(
            targetRpm,
            turbineRpmRef.current - dt * 250
          );
        }

        // Generator light bulb glow smoothly scales with turbine RPM
        const targetGlow = Math.min(1, Math.pow(turbineRpmRef.current / 1500, 1.25));
        bulbGlowRef.current = Math.min(
          1,
          bulbGlowRef.current + (targetGlow - bulbGlowRef.current) * Math.min(1, dt * 3.5)
        );

        // Sound sync
        if (soundEnabled && now - whirSoundThrottleRef.current > 420) {
          const soundPitch = 0.55 + (turbineRpmRef.current / 1600) * 0.65;
          playTurbineWhir(soundPitch);
          if (Math.random() < 0.65) {
            playWaterSplash(0.8 + densityFactor * 0.6);
          }
          whirSoundThrottleRef.current = now;
        }
      } else {
        // As requested: "hết thì dừng" (khi hết hạt nước tác dụng, tua-bin giảm tốc dần và dừng hẳn)
        if (turbineRpmRef.current > 0) {
          // Natural rotational deceleration caused by bearing friction and electrical load
          turbineRpmRef.current = Math.max(0, turbineRpmRef.current - dt * 280);
          bulbGlowRef.current = Math.max(0, bulbGlowRef.current - dt * 0.95);
        }
      }

      // Rotate turbine runners
      if (turbineRpmRef.current > 0.5) {
        turbineAngleRef.current =
          (turbineAngleRef.current + (turbineRpmRef.current / 60) * 360 * dt) % 360;
      }

      // Notify parent metrics
      onTurbineMetrics(
        turbineRpmRef.current,
        bulbGlowRef.current,
        isWaterStriking
      );

      // Track flow progress for external gauges
      if (isPlaying) {
        if (generationMode === 'packet') {
          if (dropletsRef.current.length > 0) {
            // Progress follows lead droplet along penstock, then striking phase
            const leadT = maxT;
            let pVal = leadT * 0.75;
            if (isWaterStriking) {
              const remainingRatio = packetRemainingRef.current / (totalPacketParticlesRef.current || 1);
              pVal = 0.75 + (1 - remainingRatio) * 0.35;
            }
            onProgressUpdate(pVal);
          } else if (packetRemainingRef.current <= 0 && turbineRpmRef.current <= 5) {
            // Packet completely ended and turbine stopped
            onProgressUpdate(1.2);
          }
        } else {
          onProgressUpdate(isWaterStriking ? 0.88 : 0.45);
        }
      }

      // ======================================================================
      // 4. UPDATE SPLASHES, FOAM, AND RIPPLES
      // ======================================================================
      const nextSplashes: HydroSplash[] = [];
      for (let i = 0; i < splashesRef.current.length; i++) {
        const sp = splashesRef.current[i];
        sp.life += dt;
        sp.vy += pixelGravity * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.alpha = Math.max(0, 1 - sp.life / sp.maxLife);
        if (sp.life < sp.maxLife && sp.y <= groundY + 14) {
          nextSplashes.push(sp);
        }
      }
      splashesRef.current = nextSplashes;

      const nextFoam: HydroFoam[] = [];
      for (let i = 0; i < foamRef.current.length; i++) {
        const fb = foamRef.current[i];
        fb.life += dt;
        fb.x += fb.vx * dt;
        fb.vx *= 0.96;
        fb.alpha = Math.max(0, 1 - fb.life / fb.maxLife);
        if (fb.life < fb.maxLife && fb.x < width - 10) {
          nextFoam.push(fb);
        }
      }
      foamRef.current = nextFoam;

      const nextRipples: HydroRipple[] = [];
      for (let i = 0; i < ripplesRef.current.length; i++) {
        const rp = ripplesRef.current[i];
        rp.life += dt;
        rp.radiusX += dt * 32;
        rp.radiusY += dt * 12;
        rp.alpha = Math.max(0, 0.7 * (1 - rp.life / rp.maxLife));
        if (rp.life < rp.maxLife) {
          nextRipples.push(rp);
        }
      }
      ripplesRef.current = nextRipples;

      // ======================================================================
      // 5. RENDER PASS (EXPANSIVE HIGH-DEFINITION STAGE)
      // ======================================================================
      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0b1322');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#080d1a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // --- A. Concrete Hydroelectric Dam Structure ---
      ctx.save();
      const damSlopeEndX = Math.min(width * 0.46, damWallX + 160);
      const damGrad = ctx.createLinearGradient(20, reservoirTopY, damSlopeEndX, groundY);
      damGrad.addColorStop(0, '#475569');
      damGrad.addColorStop(0.55, '#334155');
      damGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = damGrad;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(15, groundY);
      ctx.lineTo(15, reservoirTopY);
      ctx.lineTo(damWallX + 16, reservoirTopY);
      ctx.lineTo(damSlopeEndX, groundY);
      ctx.lineTo(15, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dam block markings
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      for (let s = 1; s <= 5; s++) {
        const sy = reservoirTopY + (groundY - reservoirTopY) * (s / 6);
        ctx.beginPath();
        ctx.moveTo(15, sy);
        ctx.lineTo(damWallX + 16 + (damSlopeEndX - damWallX - 16) * (s / 6), sy);
        ctx.stroke();
      }
      ctx.restore();

      // --- B. Reservoir Lake Water (Hồ chứa nước thượng lưu) ---
      ctx.save();
      const resGrad = ctx.createLinearGradient(0, reservoirTopY, 0, reservoirBottomY);
      resGrad.addColorStop(0, '#0284c7');
      resGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = resGrad;
      ctx.fillRect(16, reservoirTopY + 5, damWallX - 10, reservoirBottomY - reservoirTopY);

      // Surface ripples on reservoir lake
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, reservoirTopY + 7);
      for (let wx = 16; wx <= damWallX + 5; wx += 16) {
        const waveY = reservoirTopY + 7 + Math.sin(now * 0.004 + wx * 0.25) * 1.5;
        ctx.lineTo(wx, waveY);
      }
      ctx.stroke();

      // Reservoir lake text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HỒ CHỨA THƯỢNG LƯU (h = 4m)', (damWallX + 16) / 2, reservoirTopY + 28);
      ctx.fillStyle = '#bae6fd';
      ctx.font = '9.5px monospace';
      ctx.fillText(`Mật độ: ${mass} kg/s (Wt = ${mass * 10 * 4} J)`, (damWallX + 16) / 2, reservoirTopY + 44);
      ctx.restore();

      // --- C. Sluice Gate (Van xả nước tại cửa nhận nước) ---
      ctx.save();
      const isGateOpen = isPlaying || dropletsRef.current.length > 0;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(damWallX - 4, penstockStartY - 24, 10, 48);

      const gateLift = isGateOpen ? -20 : 0;
      ctx.fillStyle = isGateOpen ? '#10b981' : '#ef4444';
      ctx.fillRect(damWallX - 3, penstockStartY - 8 + gateLift, 8, 28);
      ctx.strokeStyle = isGateOpen ? '#059669' : '#b91c1c';
      ctx.strokeRect(damWallX - 3, penstockStartY - 8 + gateLift, 8, 28);

      ctx.fillStyle = isGateOpen ? '#34d399' : '#f87171';
      ctx.font = 'bold 8.5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isGateOpen ? 'MỞ' : 'ĐÓNG', damWallX + 1, penstockStartY - 12 + gateLift);
      ctx.restore();

      // --- D. Steel Penstock Conduit (Ống áp lực thép có mặt cắt trong suốt) ---
      ctx.save();
      // Outer heavy steel structural pipe casing
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = pipeRadius * 2 + 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(penstockStartX, penstockStartY);
      ctx.lineTo(nozzleX, nozzleY);
      ctx.stroke();

      // Outer metallic steel contour
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = pipeRadius * 2 + 2;
      ctx.stroke();

      // Interior transparent conduit (Khoang kính/kênh dẫn nước trong suốt)
      // Note: As requested by user, NO solid blue block or solid gradient is drawn!
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = pipeRadius * 2 - 2;
      ctx.stroke();

      // Longitudinal transparent glass reflection line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(
        penstockStartX + pipeNx * (pipeRadius - 3),
        penstockStartY + pipeNy * (pipeRadius - 3)
      );
      ctx.lineTo(
        nozzleX + pipeNx * (pipeRadius - 3),
        nozzleY + pipeNy * (pipeRadius - 3)
      );
      ctx.stroke();
      ctx.restore();

      // --- E. RENDERING DISCRETE WATER DROPLETS & STREAKS (ONLY PARTICLES!) ---
      ctx.save();
      for (let i = 0; i < dropletsRef.current.length; i++) {
        const d = dropletsRef.current[i];

        if (d.phase === 'pipe') {
          // Inside penstock: droplet position along pipe vector
          const px = penstockStartX + d.t * pipeDx + d.lateral * (pipeRadius - 4) * pipeNx;
          const py = penstockStartY + d.t * pipeDy + d.lateral * (pipeRadius - 4) * pipeNy;

          const vx = pipeTx * d.speed;
          const vy = pipeTy * d.speed;

          // Motion streak trailing behind the droplet
          const streakFactor = isSlowMo ? 0.012 : 0.024;
          const tailX = px - vx * streakFactor;
          const tailY = py - vy * streakFactor;

          ctx.strokeStyle = d.color;
          ctx.globalAlpha = d.alpha;
          ctx.lineWidth = d.radius * 1.5;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(px, py);
          ctx.stroke();

          // Droplet head
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(px, py, d.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (d.phase === 'jet' || d.phase === 'rebound') {
          // Exited droplet
          const px = d.x || nozzleX;
          const py = d.y || nozzleY;

          ctx.fillStyle = d.color;
          ctx.globalAlpha = d.alpha || 0.9;
          ctx.beginPath();
          ctx.arc(px, py, d.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // --- F. Tapered High-Pressure Nozzle at end of penstock ---
      ctx.save();
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(nozzleX - 12, nozzleY - 9);
      ctx.lineTo(nozzleX + 8, nozzleY - 4);
      ctx.lineTo(nozzleX + 8, nozzleY + 4);
      ctx.lineTo(nozzleX - 12, nozzleY + 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nozzle orifice highlight
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(nozzleX + 7, nozzleY - 3, 2, 6);
      ctx.restore();

      // --- G. Pelton Turbine Runner (Tua-bin Pelton đa gáo hứng) ---
      ctx.save();
      ctx.translate(turbineCenterX, turbineCenterY);

      // External casing ring
      ctx.strokeStyle = isWaterStriking ? '#38bdf8' : '#64748b';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, turbineRadius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (isWaterStriking) {
        // Impact halo ring when water hits
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, turbineRadius + 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Rotating Blades & Pelton Cups
      ctx.save();
      ctx.rotate((turbineAngleRef.current * Math.PI) / 180);

      const numCups = 8;
      for (let c = 0; c < numCups; c++) {
        const angle = (c * 2 * Math.PI) / numCups;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Runner spoke
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(cosA * (turbineRadius - 4), sinA * (turbineRadius - 4));
        ctx.stroke();

        // Pelton Bucket / Cup
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cosA * turbineRadius, sinA * turbineRadius, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Central Hub
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // RPM Telemetry beneath turbine
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9.5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TUA-BIN PELTON', 0, turbineRadius + 20);
      ctx.fillStyle = turbineRpmRef.current > 50 ? '#34d399' : '#64748b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        turbineRpmRef.current > 0 ? `${Math.round(turbineRpmRef.current)} RPM` : '0 RPM (DỪNG)',
        0,
        turbineRadius + 32
      );
      ctx.restore();

      // --- H. Water Splashes & Spray around Turbine ---
      ctx.save();
      for (let i = 0; i < splashesRef.current.length; i++) {
        const sp = splashesRef.current[i];
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- I. Tailrace Discharge Canal (Kênh xả hạ lưu, h = 0m) ---
      ctx.save();
      const tailStartX = turbineCenterX - 25;
      const tailGrad = ctx.createLinearGradient(0, groundY, 0, height);
      tailGrad.addColorStop(0, '#0369a1');
      tailGrad.addColorStop(0.45, '#075985');
      tailGrad.addColorStop(1, '#0c2340');
      ctx.fillStyle = tailGrad;
      ctx.fillRect(tailStartX, groundY, width - tailStartX, height - groundY);

      // Tailrace water line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tailStartX, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Surface ripples
      for (let i = 0; i < ripplesRef.current.length; i++) {
        const rp = ripplesRef.current[i];
        ctx.strokeStyle = `rgba(186, 230, 253, ${rp.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.radiusX, rp.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Foam bubbles
      for (let i = 0; i < foamRef.current.length; i++) {
        const fb = foamRef.current[i];
        ctx.fillStyle = `rgba(255, 255, 255, ${fb.alpha})`;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('KÊNH XẢ HẠ LƯU (h = 0m)', tailStartX + 20, groundY + 20);
      ctx.restore();

      // --- J. Electric Generator & Transmission Lines ---
      ctx.save();
      const genX = turbineCenterX + 62;
      const genY = turbineCenterY - 18;

      // Shaft from turbine to generator
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(turbineCenterX, turbineCenterY);
      ctx.lineTo(genX, genY + 18);
      ctx.stroke();

      // Generator casing
      const isGenActive = turbineRpmRef.current > 100;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = isGenActive ? '#10b981' : '#64748b';
      ctx.lineWidth = 2;
      ctx.fillRect(genX, genY, 42, 44);
      ctx.strokeRect(genX, genY, 42, 44);

      ctx.fillStyle = isGenActive ? '#34d399' : '#94a3b8';
      ctx.font = 'bold 8.5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MÁY PHÁT', genX + 21, genY + 16);

      // Generator rotor indicator
      ctx.fillStyle = isGenActive ? '#10b981' : '#475569';
      ctx.beginPath();
      ctx.arc(genX + 21, genY + 28, 7, 0, Math.PI * 2);
      ctx.fill();

      // Copper transmission wire up to light bulb
      const bulbX = Math.min(width - 50, genX + 90);
      const bulbY = Math.max(55, reservoirTopY + 20);
      const wireActive = bulbGlowRef.current > 0.08;

      ctx.strokeStyle = wireActive ? '#f59e0b' : '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(genX + 32, genY);
      ctx.lineTo(genX + 32, bulbY);
      ctx.lineTo(bulbX - 22, bulbY);
      ctx.stroke();

      if (wireActive) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -(now * 0.05);
        ctx.beginPath();
        ctx.moveTo(genX + 32, genY);
        ctx.lineTo(genX + 32, bulbY);
        ctx.lineTo(bulbX - 22, bulbY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- K. Light Bulb Powered by Water Kinetic Energy ---
      const glowVal = bulbGlowRef.current;
      if (glowVal > 0.04) {
        const glowGrad = ctx.createRadialGradient(
          bulbX,
          bulbY,
          4,
          bulbX,
          bulbY,
          28 + glowVal * 42
        );
        glowGrad.addColorStop(0, `rgba(254, 240, 138, ${glowVal * 0.95})`);
        glowGrad.addColorStop(0.45, `rgba(251, 191, 36, ${glowVal * 0.5})`);
        glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 28 + glowVal * 42, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glass bulb
      ctx.fillStyle = glowVal > 0.2 ? '#fef08a' : '#334155';
      ctx.strokeStyle = glowVal > 0.2 ? '#fde047' : '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Filament
      ctx.strokeStyle = glowVal > 0.1 ? '#ea580c' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bulbX - 5, bulbY + 5);
      ctx.lineTo(bulbX, bulbY - 4);
      ctx.lineTo(bulbX + 5, bulbY + 5);
      ctx.stroke();

      // Screw base
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(bulbX - 6, bulbY + 16, 12, 8);

      // Bulb illumination badge
      ctx.fillStyle = glowVal > 0.2 ? '#fef08a' : '#64748b';
      ctx.font = 'bold 9.5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        glowVal > 0.75
          ? '100% SÁNG'
          : glowVal > 0.1
          ? `${Math.round(glowVal * 100)}% SÁNG`
          : 'ĐÈN TẮT',
        bulbX,
        bulbY - 24
      );
      ctx.restore();

      // --- L. Ground Reference Level Line (h = 0m) ---
      ctx.save();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, groundY);
      ctx.lineTo(width - 15, groundY);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Mốc thế năng đất: h = 0m, Wt = 0 J', 25, groundY + 22);
      ctx.restore();

      ctx.restore(); // Restore devicePixelRatio transform

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    mass,
    generationMode,
    isPlaying,
    progress,
    onProgressUpdate,
    isSlowMo,
    soundEnabled,
    onTurbineMetrics,
  ]);

  // Handle ResizeObserver to maintain sharp resolution and responsive size
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          cssSizeRef.current = { width, height };
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-96 sm:h-[460px] lg:h-[520px] relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />
    </div>
  );
};
