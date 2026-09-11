import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  startWaterfallAudio,
  stopWaterfallAudio,
  updateWaterfallAudioVolume,
  playWaterSplash,
} from '../utils/sound';

interface WaterfallCanvasProps {
  heightMeters: number; // 1 to 5 meters
  mWaterKg: number; // 1, 2, 4 kg
  visualSlopeDeg: number; // 30, 45, 75 degrees
  isFlowing: boolean; // Continuous waterfall active
  isSlowMo: boolean; // 0.25x speed
  soundEnabled: boolean;
  batchReleaseCount: number; // Increment to drop a discrete packet of water
  showVectors: boolean;
  onImpact?: (velocity: number, kineticEnergy: number) => void;
}

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  isAerated: boolean; // white froth particle
  life: number;
  maxLife: number;
}

interface SplashParticle {
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

interface FoamBubble {
  x: number;
  y: number;
  vx: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface MistParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface PoolRipple {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export const WaterfallCanvas: React.FC<WaterfallCanvasProps> = ({
  heightMeters,
  mWaterKg,
  visualSlopeDeg,
  isFlowing,
  isSlowMo,
  soundEnabled,
  batchReleaseCount,
  showVectors,
  onImpact,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Arrays for particles
  const dropletsRef = useRef<Droplet[]>([]);
  const splashesRef = useRef<SplashParticle[]>([]);
  const foamRef = useRef<FoamBubble[]>([]);
  const mistRef = useRef<MistParticle[]>([]);
  const ripplesRef = useRef<PoolRipple[]>([]);

  // Discrete batch emission queue
  const batchQueueRef = useRef<number>(0);
  const prevBatchCountRef = useRef<number>(batchReleaseCount);

  // Sound management
  useEffect(() => {
    if (soundEnabled && (isFlowing || batchQueueRef.current > 0)) {
      const vol = 0.08 + (mWaterKg / 4) * 0.12 + (heightMeters / 5) * 0.08;
      startWaterfallAudio(vol);
    } else {
      stopWaterfallAudio();
    }
    return () => {
      stopWaterfallAudio();
    };
  }, [soundEnabled, isFlowing, mWaterKg, heightMeters]);

  // Handle discrete batch triggers
  useEffect(() => {
    if (batchReleaseCount > prevBatchCountRef.current) {
      batchQueueRef.current += 160 + mWaterKg * 80;
      prevBatchCountRef.current = batchReleaseCount;
    }
  }, [batchReleaseCount, mWaterKg]);

  // Theoretical physics calculations
  const g = 10; // m/s^2
  const theoreticalImpactV = Math.round(Math.sqrt(2 * g * heightMeters) * 10) / 10;
  const theoreticalEnergy = Math.round(mWaterKg * g * heightMeters * 10) / 10;

  // Main animation and physics simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let spawnAccumulator = 0;
    let impactSoundThrottle = 0;

    const render = (now: number) => {
      const rawDt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const dt = isSlowMo ? rawDt * 0.25 : rawDt;

      const width = canvas.width;
      const height = canvas.height;

      // Coordinate anchors
      const plungePoolY = height - 55; // water surface in bottom pool
      const scaleY = (plungePoolY - 60) / 5.2; // 1m ~ scaleY px
      const cliffTopY = plungePoolY - heightMeters * scaleY;
      const cliffWidth = 135;
      const weirX = cliffWidth; // waterfall crest lip

      // Slope geometry for the hillside / cliff face
      // visualSlopeDeg determines angle of the mountain slope (30, 45, 75 degrees)
      const slopeRad = (visualSlopeDeg * Math.PI) / 180;
      const deltaY = plungePoolY - cliffTopY;
      // Theoretical dx = deltaY / tan(slopeRad)
      const idealDx = deltaY / Math.max(0.2, Math.tan(slopeRad));
      // Clamp to ensure it always fits beautifully within canvas bounds
      const maxDx = width - weirX - 85;
      const slopeOffset = Math.min(maxDx, Math.max(40, idealDx));
      const poolImpactX = weirX + slopeOffset;

      // Mathematical function for mountain slope contour and tangent at normalized progress u in [0, 1]
      // u = 0 is weir crest, u = 1 is bottom plunge pool
      const getSlopeAt = (u: number) => {
        const clampedU = Math.max(0, Math.min(1, u));
        // Smooth natural mountain slope profile: slightly curved at crest, then smooth descent to base
        const xRock = weirX + slopeOffset * (0.85 * clampedU + 0.15 * clampedU * clampedU);
        const yRock = cliffTopY + clampedU * deltaY;

        // Tangent derivatives dx/du, dy/du
        const dx_du = slopeOffset * (0.85 + 0.3 * clampedU);
        const dy_du = deltaY;
        const len = Math.sqrt(dx_du * dx_du + dy_du * dy_du);

        // Unit tangent pointing down the slope
        const tx = dx_du / len;
        const ty = dy_du / len;

        // Unit normal pointing outward into the air/water layer (away from rock)
        // Since tx > 0, ty > 0, normal vector pointing up & right into water layer is (ty, -tx)
        const nx = ty;
        const ny = -tx;

        return { x: xRock, y: yRock, tx, ty, nx, ny, len };
      };

      // Water layer thickness along the slope (tapers slightly as water accelerates)
      const streamThickness = 12 + mWaterKg * 6;

      // --- 1. PARTICLE EMISSION ALONG THE MOUNTAIN SLOPE ---
      // Rate depends on continuous mode or batch release queue
      let spawnRate = 0;
      if (isFlowing) {
        spawnRate = 190 + mWaterKg * 110; // particles per second
      } else if (batchQueueRef.current > 0) {
        const emitThisFrame = Math.min(batchQueueRef.current, Math.ceil(240 * dt));
        batchQueueRef.current -= emitThisFrame;
        spawnRate = emitThisFrame / Math.max(0.001, dt);
      }

      spawnAccumulator += spawnRate * dt;

      while (spawnAccumulator >= 1) {
        spawnAccumulator -= 1;

        // Position across the stream thickness on the slope
        const lateral = Math.random(); // 0 = close to rock, 1 = surface
        const startU = Math.random() * 0.02; // start right at crest
        const pt = getSlopeAt(startU);

        const startX = pt.x + (lateral * streamThickness * 0.7) * pt.nx;
        const startY = pt.y + (lateral * streamThickness * 0.7) * pt.ny;

        // Initial launch speed along slope
        const v0 = 45 + Math.random() * 25;
        const vx0 = pt.tx * v0;
        const vy0 = pt.ty * v0;

        // Aeration property: white water bubbles vs deep cyan droplets
        const isAerated = Math.random() < (0.28 + (heightMeters / 5) * 0.35);
        let color = '#38bdf8'; // sky blue
        if (isAerated) {
          color = Math.random() > 0.45 ? '#ffffff' : '#e0f2fe';
        } else if (Math.random() > 0.4) {
          color = '#7dd3fc';
        } else {
          color = '#0284c7';
        }

        dropletsRef.current.push({
          x: startX,
          y: startY,
          vx: vx0,
          vy: vy0,
          radius: isAerated ? 0.9 + Math.random() * 1.5 : 1.3 + Math.random() * 1.8,
          color,
          alpha: 0.8 + Math.random() * 0.2,
          isAerated,
          life: 0,
          maxLife: 3.5,
        });
      }

      // --- 2. UPDATE DROPLETS FLOWING DOWN THE SLOPE ---
      // Scaled acceleration down the incline
      const pixelGravity = 540;
      const nextDroplets: Droplet[] = [];

      for (let i = 0; i < dropletsRef.current.length; i++) {
        const d = dropletsRef.current[i];
        d.life += dt;

        // Current progress u along the slope drop
        const u = (d.y - cliffTopY) / Math.max(1, deltaY);

        if (u < 1.0) {
          // Water is actively flowing along the mountain slope!
          const pt = getSlopeAt(u);

          // Component of gravity along the slope accelerates the water: a = g * ty
          const aSlope = pixelGravity * pt.ty;
          const currentSpeed = Math.sqrt(d.vx * d.vx + d.vy * d.vy) + aSlope * dt;

          // Target velocity along the slope tangent
          d.vx = pt.tx * currentSpeed;
          d.vy = pt.ty * currentSpeed;

          // Advance position
          d.x += d.vx * dt;
          d.y += d.vy * dt;

          // Keep droplet hugging the slope surface with turbulent churning
          const updatedU = (d.y - cliffTopY) / Math.max(1, deltaY);
          if (updatedU < 1.0) {
            const newPt = getSlopeAt(updatedU);
            const targetX = newPt.x + ((d.radius % 1) * streamThickness * 0.8) * newPt.nx;
            // Smoothly conform to the slope profile
            d.x = d.x * 0.4 + targetX * 0.6;
          }
        } else {
          // Droplet has reached the bottom plunge pool!
          // Free impact with water surface
          d.vy += pixelGravity * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
        }

        // Check collision with Plunge Pool water surface
        if (d.y >= plungePoolY) {
          const impactSpeed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);

          // 1. Splash rebound droplets (spray shooting up and away from slope)
          const numSplashes = 1 + Math.floor(Math.random() * 3);
          for (let s = 0; s < numSplashes; s++) {
            splashesRef.current.push({
              x: d.x + (Math.random() - 0.5) * 8,
              y: plungePoolY - 2,
              vx: 20 + (Math.random() - 0.2) * (50 + impactSpeed * 0.25),
              vy: -(35 + Math.random() * (50 + impactSpeed * 0.35)),
              radius: 0.8 + Math.random() * 1.4,
              alpha: 0.95,
              life: 0,
              maxLife: 0.4 + Math.random() * 0.3,
              color: Math.random() > 0.45 ? '#ffffff' : '#bae6fd',
            });
          }

          // 2. Surface foam bubbles (froth)
          if (foamRef.current.length < 180 && Math.random() < 0.45) {
            foamRef.current.push({
              x: d.x + (Math.random() - 0.5) * 14,
              y: plungePoolY + (Math.random() - 0.5) * 6,
              vx: 15 + (Math.random() - 0.3) * 22,
              radius: 1.5 + Math.random() * 3.5,
              alpha: 0.85,
              life: 0,
              maxLife: 0.7 + Math.random() * 0.8,
            });
          }

          // 3. Mist clouds (rising humidity/fog)
          if (mistRef.current.length < 90 && Math.random() < 0.15) {
            mistRef.current.push({
              x: d.x + (Math.random() - 0.5) * 22,
              y: plungePoolY - 5,
              vx: 10 + (Math.random() - 0.4) * 30,
              vy: -(14 + Math.random() * 24),
              radius: 7 + Math.random() * 15,
              alpha: 0.15,
              life: 0,
              maxLife: 1.3 + Math.random() * 1.3,
            });
          }

          // 4. Expanding surface ripples
          if (ripplesRef.current.length < 40 && Math.random() < 0.09) {
            ripplesRef.current.push({
              x: d.x,
              y: plungePoolY + 3,
              radiusX: 2,
              radiusY: 1,
              alpha: 0.65,
              life: 0,
              maxLife: 0.85,
            });
          }

          // Periodic splash sound
          if (soundEnabled && now - impactSoundThrottle > 400 && Math.random() < 0.2) {
            playWaterSplash(0.6 + (heightMeters / 5) * 0.4);
            impactSoundThrottle = now;
            if (onImpact) {
              onImpact(theoreticalImpactV, theoreticalEnergy);
            }
          }
        } else if (d.life < d.maxLife && d.x < width + 50) {
          nextDroplets.push(d);
        }
      }
      dropletsRef.current = nextDroplets;

      // --- 3. UPDATE SPLASH PARTICLES ---
      const nextSplashes: SplashParticle[] = [];
      for (let i = 0; i < splashesRef.current.length; i++) {
        const sp = splashesRef.current[i];
        sp.life += dt;
        sp.vy += pixelGravity * dt; // gravity brings splash back down
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.alpha = Math.max(0, 1 - sp.life / sp.maxLife);

        if (sp.life < sp.maxLife && sp.y <= plungePoolY + 6) {
          nextSplashes.push(sp);
        }
      }
      splashesRef.current = nextSplashes;

      // --- 4. UPDATE FOAM BUBBLES ---
      const nextFoam: FoamBubble[] = [];
      for (let i = 0; i < foamRef.current.length; i++) {
        const fb = foamRef.current[i];
        fb.life += dt;
        fb.x += fb.vx * dt;
        fb.vx *= 0.94; // damping
        fb.alpha = Math.max(0, 1 - fb.life / fb.maxLife);
        if (fb.life < fb.maxLife) {
          nextFoam.push(fb);
        }
      }
      foamRef.current = nextFoam;

      // --- 5. UPDATE MIST CLOUDS ---
      const nextMist: MistParticle[] = [];
      for (let i = 0; i < mistRef.current.length; i++) {
        const mp = mistRef.current[i];
        mp.life += dt;
        mp.x += mp.vx * dt;
        mp.y += mp.vy * dt;
        mp.radius += dt * 4; // slowly expand
        mp.alpha = Math.max(0, 0.16 * (1 - mp.life / mp.maxLife));
        if (mp.life < mp.maxLife) {
          nextMist.push(mp);
        }
      }
      mistRef.current = nextMist;

      // --- 6. UPDATE RIPPLES ---
      const nextRipples: PoolRipple[] = [];
      for (let i = 0; i < ripplesRef.current.length; i++) {
        const rp = ripplesRef.current[i];
        rp.life += dt;
        rp.radiusX += dt * 35;
        rp.radiusY += dt * 14;
        rp.alpha = Math.max(0, 0.6 * (1 - rp.life / rp.maxLife));
        if (rp.life < rp.maxLife) {
          nextRipples.push(rp);
        }
      }
      ripplesRef.current = nextRipples;

      // ======================================================================
      // RENDER PASS
      // ======================================================================
      // Clear background with dark atmospheric sky
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Distant mountain mist gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0c1322');
      bgGrad.addColorStop(0.6, '#0f172a');
      bgGrad.addColorStop(1, '#080d1a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // --- Draw Mountain Rock Formation ---
      ctx.save();
      const rockGrad = ctx.createLinearGradient(0, cliffTopY, weirX + slopeOffset, plungePoolY);
      rockGrad.addColorStop(0, '#334155');
      rockGrad.addColorStop(0.4, '#1e293b');
      rockGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = rockGrad;

      ctx.beginPath();
      ctx.moveTo(0, plungePoolY);
      ctx.lineTo(0, cliffTopY);
      ctx.lineTo(weirX, cliffTopY);

      // Follow the exact mathematical slope profile getSlopeAt
      const slopeSteps = 24;
      for (let s = 1; s <= slopeSteps; s++) {
        const pt = getSlopeAt(s / slopeSteps);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.lineTo(0, plungePoolY);
      ctx.closePath();
      ctx.fill();

      // Rock strata lines (subtle geological layers following mountain structure)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      for (let s = 1; s <= 4; s++) {
        const u = s / 5;
        const pt = getSlopeAt(u);
        ctx.beginPath();
        ctx.moveTo(0, pt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
      ctx.restore();

      // --- Draw Cascading Water Sheet Along the Mountain Slope ---
      if (isFlowing || dropletsRef.current.length > 0) {
        ctx.save();
        ctx.beginPath();
        // Outer surface (water layer on top of rock)
        for (let s = 0; s <= slopeSteps; s++) {
          const u = s / slopeSteps;
          const pt = getSlopeAt(u);
          const th = streamThickness * (1 - 0.18 * u);
          const wx = pt.x + th * pt.nx;
          const wy = pt.y + th * pt.ny;
          if (s === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        // Inner contour (contact with mountain rock)
        for (let s = slopeSteps; s >= 0; s--) {
          const u = s / slopeSteps;
          const pt = getSlopeAt(u);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();

        // High realism water flume gradient
        const streamGrad = ctx.createLinearGradient(weirX, cliffTopY, poolImpactX, plungePoolY);
        streamGrad.addColorStop(0, 'rgba(14, 165, 233, 0.7)');
        streamGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.8)');
        streamGrad.addColorStop(1, 'rgba(186, 230, 253, 0.9)');
        ctx.fillStyle = streamGrad;
        ctx.fill();

        // Water surface highlight stream line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let s = 0; s <= slopeSteps; s++) {
          const u = s / slopeSteps;
          const pt = getSlopeAt(u);
          const th = streamThickness * (1 - 0.18 * u);
          const wx = pt.x + th * pt.nx;
          const wy = pt.y + th * pt.ny;
          if (s === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        // Animated whitewater ripples / rapids cascading down the slope
        for (let w = 0; w < 5; w++) {
          const wavePhase = ((now * 0.0025 * (1 + w * 0.25) + w * 0.2) % 1);
          const pt = getSlopeAt(wavePhase);
          const th = streamThickness * (1 - 0.18 * wavePhase);
          ctx.strokeStyle = w % 2 === 0 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(224, 242, 254, 0.65)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x + th * pt.nx, pt.y + th * pt.ny);
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- Draw Top Lake Reservoir ---
      ctx.save();
      const lakeDepth = 22;
      const lakeGrad = ctx.createLinearGradient(0, cliffTopY - lakeDepth, 0, cliffTopY);
      lakeGrad.addColorStop(0, '#0284c7');
      lakeGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = lakeGrad;
      ctx.fillRect(15, cliffTopY - lakeDepth, weirX - 15, lakeDepth);

      // Lake water surface highlights & waves
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, cliffTopY - lakeDepth + 2);
      for (let wx = 15; wx <= weirX; wx += 16) {
        const waveY = cliffTopY - lakeDepth + 2 + Math.sin((now * 0.004) + wx * 0.2) * 1.5;
        ctx.lineTo(wx, waveY);
      }
      ctx.stroke();

      // Retaining dam border
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(15, cliffTopY - lakeDepth, weirX - 15, lakeDepth);

      // Lake water mass label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mWaterKg} kg nước`, (15 + weirX) / 2, cliffTopY - 7);
      ctx.restore();

      // --- Draw Bottom Plunge Pool (Hồ chân thác) ---
      ctx.save();
      const poolGrad = ctx.createLinearGradient(0, plungePoolY, 0, height);
      poolGrad.addColorStop(0, '#0369a1');
      poolGrad.addColorStop(0.3, '#075985');
      poolGrad.addColorStop(1, '#0c2340');
      ctx.fillStyle = poolGrad;
      ctx.fillRect(0, plungePoolY, width, height - plungePoolY);

      // Plunge pool bottom boundary line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, plungePoolY);
      ctx.lineTo(width, plungePoolY);
      ctx.stroke();
      ctx.restore();

      // --- Draw Surface Ripples ---
      ctx.save();
      for (let i = 0; i < ripplesRef.current.length; i++) {
        const rp = ripplesRef.current[i];
        ctx.strokeStyle = `rgba(186, 230, 253, ${rp.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.radiusX, rp.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // --- DRAW WATERFALL DROPLETS (with High-Speed Motion Streaks) ---
      // Real waterfalls look like silky streaks of thousands of droplets
      ctx.save();
      for (let i = 0; i < dropletsRef.current.length; i++) {
        const d = dropletsRef.current[i];

        // Motion streak vector: backwards along velocity vector
        // Streak length proportional to speed
        const streakFactor = isSlowMo ? 0.015 : 0.025;
        const tailX = d.x - d.vx * streakFactor;
        const tailY = d.y - d.vy * streakFactor;

        ctx.strokeStyle = d.color;
        ctx.globalAlpha = d.alpha;
        ctx.lineWidth = d.radius * 1.8;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();

        // Droplet head circle highlight
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- DRAW SPLASH REBOUND DROPLETS ---
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

      // --- DRAW SURFACE FOAM BUBBLES ---
      ctx.save();
      for (let i = 0; i < foamRef.current.length; i++) {
        const fb = foamRef.current[i];
        ctx.fillStyle = `rgba(255, 255, 255, ${fb.alpha})`;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bubble rim
        ctx.strokeStyle = `rgba(186, 230, 253, ${fb.alpha * 0.8})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // --- DRAW MIST CLOUDS (Atmospheric Vapor / Bụi sương) ---
      ctx.save();
      for (let i = 0; i < mistRef.current.length; i++) {
        const mp = mistRef.current[i];
        const mistGrad = ctx.createRadialGradient(mp.x, mp.y, 0, mp.x, mp.y, mp.radius);
        mistGrad.addColorStop(0, `rgba(255, 255, 255, ${mp.alpha * 1.2})`);
        mistGrad.addColorStop(0.5, `rgba(224, 242, 254, ${mp.alpha * 0.6})`);
        mistGrad.addColorStop(1, 'rgba(224, 242, 254, 0)');
        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, mp.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- DRAW SCIENTIFIC MEASUREMENT RULER & HEIGHT MARKER ---
      ctx.save();
      const rulerX = width - 42;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Vertical height reference line
      ctx.beginPath();
      ctx.moveTo(rulerX, cliffTopY);
      ctx.lineTo(rulerX, plungePoolY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top & bottom ticks
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      // top arrow
      ctx.moveTo(rulerX, cliffTopY);
      ctx.lineTo(rulerX - 5, cliffTopY + 8);
      ctx.lineTo(rulerX + 5, cliffTopY + 8);
      ctx.closePath();
      ctx.fill();
      // bottom arrow
      ctx.beginPath();
      ctx.moveTo(rulerX, plungePoolY);
      ctx.lineTo(rulerX - 5, plungePoolY - 8);
      ctx.lineTo(rulerX + 5, plungePoolY - 8);
      ctx.closePath();
      ctx.fill();

      // Height Badge Box
      const midRulerY = (cliffTopY + plungePoolY) / 2;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.fillRect(rulerX - 28, midRulerY - 14, 56, 28);
      ctx.strokeRect(rulerX - 28, midRulerY - 14, 56, 28);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`h = ${heightMeters}m`, rulerX, midRulerY + 4);

      // Plunge pool label
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MỐC CHÂN THÁC (h = 0m)', 16, plungePoolY + 18);
      ctx.fillText(`Vận tốc chạm đáy: v = √(2gh) = ${theoreticalImpactV} m/s`, 16, plungePoolY + 34);
      ctx.restore();

      // --- DRAW REAL-TIME VECTOR OVERLAY (IF ENABLED) ---
      if (showVectors && dropletsRef.current.length > 5) {
        ctx.save();
        // Sample 1 droplet in mid-fall to show vector
        const midDroplet = dropletsRef.current[Math.floor(dropletsRef.current.length * 0.45)];
        if (midDroplet) {
          const currentYRatio = Math.max(0, Math.min(1, (midDroplet.y - cliffTopY) / Math.max(1, deltaY)));
          const currentH = Math.max(0, Math.round(heightMeters * (1 - currentYRatio) * 10) / 10);
          const currentV = Math.round(Math.sqrt(2 * g * (heightMeters - currentH)) * 10) / 10;

          // Velocity vector arrow along slope tangent
          const vScale = 0.28;
          ctx.strokeStyle = '#f59e0b';
          ctx.fillStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(midDroplet.x, midDroplet.y);
          ctx.lineTo(midDroplet.x + midDroplet.vx * vScale, midDroplet.y + midDroplet.vy * vScale);
          ctx.stroke();

          // Arrowhead
          const headX = midDroplet.x + midDroplet.vx * vScale;
          const headY = midDroplet.y + midDroplet.vy * vScale;
          ctx.beginPath();
          ctx.arc(headX, headY, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Vector label card
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          const boxX = headX + 12;
          const boxY = headY - 22;
          ctx.fillRect(boxX, boxY, 122, 42);
          ctx.strokeRect(boxX, boxY, 122, 42);

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`v = ${currentV} m/s`, boxX + 8, boxY + 15);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px monospace';
          ctx.fillText(`h = ${currentH}m (Sườn ${visualSlopeDeg}°)`, boxX + 8, boxY + 28);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px monospace';
          ctx.fillText(`Véc-tơ v hướng theo sườn`, boxX + 8, boxY + 38);
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    heightMeters,
    mWaterKg,
    visualSlopeDeg,
    isFlowing,
    isSlowMo,
    soundEnabled,
    showVectors,
    theoreticalImpactV,
    theoreticalEnergy,
    onImpact,
  ]);

  // Handle ResizeObserver to maintain sharp resolution
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-72 sm:h-96 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
};
