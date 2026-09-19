import {
  LevelData,
  Particle,
  PhysicsState,
  GravityDirection,
  GameSettings,
} from '../types/game';
import { PlayerEntity, PhysicsEngine } from '../physics/engine';

export class GameRenderer {
  private particles: Particle[] = [];
  private maxParticles = 250;
  private animTimer = 0;
  private shakeTime = 0;
  private shakeMagnitude = 0;

  public triggerScreenShake(magnitude = 6, duration = 0.25) {
    this.shakeMagnitude = magnitude;
    this.shakeTime = duration;
  }

  public addParticle(p: Particle, settings: GameSettings) {
    if (settings.particleDensity === 'OFF') return;
    if (settings.particleDensity === 'REDUCED' && Math.random() > 0.4) return;
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push(p);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    level: LevelData,
    player: PlayerEntity,
    gravityDir: GravityDirection,
    settings: GameSettings,
    dt: number
  ) {
    this.animTimer += dt;

    // Update screen shake
    let shakeX = 0;
    let shakeY = 0;
    if (settings.screenShake && this.shakeTime > 0) {
      this.shakeTime -= dt;
      shakeX = (Math.random() - 0.5) * this.shakeMagnitude;
      shakeY = (Math.random() - 0.5) * this.shakeMagnitude;
    }

    // Camera transform: Center the room or player
    ctx.save();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Dark neutral background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Compute scale to fit room nicely inside canvas with padding
    const scale = Math.min((canvasWidth - 32) / level.width, (canvasHeight - 32) / level.height, 1.4);
    const offsetX = Math.floor((canvasWidth - level.width * scale) / 2) + shakeX;
    const offsetY = Math.floor((canvasHeight - level.height * scale) / 2) + shakeY;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Room background grid & frame
    this.drawRoomFrame(ctx, level.width, level.height);

    // Environmental features
    this.drawWindZones(ctx, level);
    this.drawGravityZones(ctx, level);
    this.drawWires(ctx, level);
    this.drawPlatforms(ctx, level);
    this.drawDoors(ctx, level);
    this.drawPressurePlates(ctx, level);
    this.drawTimedSwitches(ctx, level);
    this.drawTeleporters(ctx, level);
    this.drawFluxNodes(ctx, level);
    this.drawShards(ctx, level);
    this.drawBlocks(ctx, level);
    this.drawHazards(ctx, level);
    this.drawExitDoor(ctx, level);

    // Player particles & state trail
    this.updateAndDrawParticles(ctx, dt);
    this.spawnStateParticles(player, settings);

    // Draw Player
    this.drawPlayer(ctx, player, settings);

    // Gravity indicator badge in corner of room
    this.drawGravityIndicator(ctx, gravityDir, level.width);

    ctx.restore();
  }

  private drawRoomFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Subtle grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Chamber border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  }

  private drawWires(ctx: CanvasRenderingContext2D, level: LevelData) {
    // Visual wires connecting pressure plates / switches to target doors
    ctx.save();
    ctx.setLineDash([4, 4]);

    for (const plate of level.pressurePlates) {
      const target = level.doors.find(d => d.id === plate.targetId);
      if (target) {
        ctx.strokeStyle = plate.isPressed ? 'rgba(56, 189, 248, 0.7)' : 'rgba(100, 116, 139, 0.25)';
        ctx.lineWidth = plate.isPressed ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(plate.x + plate.w / 2, plate.y + plate.h / 2);
        ctx.lineTo(target.x + target.w / 2, target.y + target.h / 2);
        ctx.stroke();
      }
    }

    for (const sw of level.timedSwitches) {
      const target = level.doors.find(d => d.id === sw.targetId);
      if (target) {
        ctx.strokeStyle = sw.isActivated ? 'rgba(250, 204, 21, 0.8)' : 'rgba(100, 116, 139, 0.25)';
        ctx.lineWidth = sw.isActivated ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(sw.x + sw.w / 2, sw.y + sw.h / 2);
        ctx.lineTo(target.x + target.w / 2, target.y + target.h / 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const plat of level.platforms) {
      ctx.save();

      // Moving track lines
      if (plat.moving) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (plat.moving.axis === 'x') {
          ctx.moveTo(plat.x - plat.moving.distance, plat.y + plat.h / 2);
          ctx.lineTo(plat.x + plat.moving.distance, plat.y + plat.h / 2);
        } else {
          ctx.moveTo(plat.x + plat.w / 2, plat.y - plat.moving.distance);
          ctx.lineTo(plat.x + plat.w / 2, plat.y + plat.moving.distance);
        }
        ctx.stroke();
      }

      switch (plat.type) {
        case 'ICE':
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(plat.x, plat.y, plat.w, 4); // icy top sheen
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          break;

        case 'STICKY':
          ctx.fillStyle = '#2e1065';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(plat.x, plat.y, plat.w, 3);
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          break;

        case 'ELASTIC':
          ctx.fillStyle = '#3f2c00';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(plat.x, plat.y, plat.w, 4);
          ctx.strokeStyle = '#f59e0b';
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          // Spring icon inside
          ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.font = '10px monospace';
          ctx.fillText('⚡ SPRING', plat.x + 6, plat.y + plat.h / 2 + 3);
          break;

        case 'MAGNETIC_POS':
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(plat.x, plat.y, plat.w, 3);
          ctx.strokeStyle = '#ef4444';
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          // Red + markings
          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 12px sans-serif';
          for (let px = plat.x + 10; px < plat.x + plat.w - 10; px += 24) {
            ctx.fillText('+', px, plat.y + plat.h / 2 + 4);
          }
          break;

        case 'MAGNETIC_NEG':
          ctx.fillStyle = '#082f49';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(plat.x, plat.y, plat.w, 3);
          ctx.strokeStyle = '#0284c7';
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          // Blue - markings
          ctx.fillStyle = '#7dd3fc';
          ctx.font = 'bold 14px sans-serif';
          for (let px = plat.x + 10; px < plat.x + plat.w - 10; px += 24) {
            ctx.fillText('-', px, plat.y + plat.h / 2 + 4);
          }
          break;

        case 'ONE_WAY':
          ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          break;

        case 'PHASE':
          ctx.fillStyle = 'rgba(192, 132, 252, 0.15)';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          // Shimmer wave
          const phaseOffset = (this.animTimer * 40) % plat.w;
          ctx.fillStyle = 'rgba(232, 121, 249, 0.3)';
          ctx.fillRect(plat.x + phaseOffset, plat.y, 8, plat.h);
          break;

        case 'NORMAL':
        default:
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          // Bevel edge highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(plat.x, plat.y, plat.w, 2);
          break;
      }

      ctx.restore();
    }
  }

  private drawDoors(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const door of level.doors) {
      ctx.save();
      if (door.isOpen) {
        // Door open outline
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(door.x, door.y, door.w, door.h);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
        ctx.fillRect(door.x, door.y, door.w, door.h);
      } else {
        // Door closed: Solid security barrier with warning stripes
        ctx.fillStyle = '#334155';
        ctx.fillRect(door.x, door.y, door.w, door.h);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x, door.y, door.w, door.h);

        // Glowing center lock
        ctx.fillStyle = '#ef4444';
        const centerY = door.y + door.h / 2;
        ctx.fillRect(door.x + 4, centerY - 6, door.w - 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(door.x + door.w / 2 - 2, centerY - 2, 4, 4);
      }
      ctx.restore();
    }
  }

  private drawPressurePlates(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const plate of level.pressurePlates) {
      ctx.save();
      const currentH = plate.isPressed ? plate.h * 0.4 : plate.h;
      const currentY = plate.isPressed ? plate.y + plate.h * 0.6 : plate.y;

      const baseColor = plate.requiresHeavy ? '#f97316' : '#38bdf8';
      ctx.fillStyle = plate.isPressed ? '#22c55e' : baseColor;
      ctx.fillRect(plate.x, currentY, plate.w, currentH);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(plate.x, currentY, plate.w, currentH);

      // Heavy icon indicator on plate
      if (plate.requiresHeavy) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('HEAVY', plate.x + plate.w / 2 - 14, currentY - 3);
      }
      ctx.restore();
    }
  }

  private drawTimedSwitches(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const sw of level.timedSwitches) {
      ctx.save();
      ctx.fillStyle = sw.isActivated ? '#eab308' : '#64748b';
      ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(sw.x, sw.y, sw.w, sw.h);

      if (sw.isActivated) {
        // Countdown pie or bar
        const progress = sw.timeLeft / sw.duration;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(sw.x, sw.y, sw.w * progress, sw.h);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${sw.timeLeft.toFixed(1)}s`, sw.x + 2, sw.y + sw.h - 2);
      }
      ctx.restore();
    }
  }

  private drawBlocks(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const b of level.blocks) {
      ctx.save();
      if (b.type === 'HEAVY') {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        // Weight symbol
        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('10T', b.x + b.w / 2 - 10, b.y + b.h / 2 + 4);
      } else if (b.type === 'MAGNETIC_POS') {
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('+', b.x + b.w / 2 - 4, b.y + b.h / 2 + 5);
      } else if (b.type === 'MAGNETIC_NEG') {
        ctx.fillStyle = '#082f49';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#7dd3fc';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('-', b.x + b.w / 2 - 4, b.y + b.h / 2 + 5);
      } else {
        // Normal pushable crate
        ctx.fillStyle = '#334155';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        // Inner crate cross
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.w, b.y + b.h);
        ctx.moveTo(b.x + b.w, b.y);
        ctx.lineTo(b.x, b.y + b.h);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawHazards(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const haz of level.hazards) {
      ctx.save();
      // Check if cycled off
      if (haz.cycle && haz.cycle.offset > haz.cycle.activeDuration) {
        ctx.globalAlpha = 0.2;
      }

      switch (haz.type) {
        case 'SPIKE':
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          const spikeCount = Math.max(1, Math.floor(haz.w / 12));
          const stepW = haz.w / spikeCount;
          for (let i = 0; i < spikeCount; i++) {
            const sx = haz.x + i * stepW;
            ctx.moveTo(sx, haz.y + haz.h);
            ctx.lineTo(sx + stepW / 2, haz.y);
            ctx.lineTo(sx + stepW, haz.y + haz.h);
          }
          ctx.closePath();
          ctx.fill();
          break;

        case 'LASER':
          // Laser emitter blocks
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(haz.x, haz.y, haz.w, haz.h);
          // Glowing laser line
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fef2f2';
          if (haz.w > haz.h) {
            ctx.fillRect(haz.x, haz.y + haz.h / 2 - 2, haz.w, 4);
          } else {
            ctx.fillRect(haz.x + haz.w / 2 - 2, haz.y, 4, haz.h);
          }
          break;

        case 'SAW':
          const cx = haz.x + haz.w / 2;
          const cy = haz.y + haz.h / 2;
          const r = haz.w / 2;
          ctx.translate(cx, cy);
          ctx.rotate(this.animTimer * 12);
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          const teeth = 8;
          for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            ctx.lineTo(Math.cos(nextAngle) * (r * 0.7), Math.sin(nextAngle) * (r * 0.7));
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'ELECTRIC':
          ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
          ctx.fillRect(haz.x, haz.y, haz.w, haz.h);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.strokeRect(haz.x, haz.y, haz.w, haz.h);
          // Electric arcs
          ctx.beginPath();
          ctx.moveTo(haz.x, haz.y + haz.h / 2);
          ctx.lineTo(haz.x + haz.w * 0.3, haz.y + haz.h * 0.2);
          ctx.lineTo(haz.x + haz.w * 0.7, haz.y + haz.h * 0.8);
          ctx.lineTo(haz.x + haz.w, haz.y + haz.h / 2);
          ctx.stroke();
          break;

        case 'CRUSHER':
        default:
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(haz.x, haz.y, haz.w, haz.h);
          ctx.strokeStyle = '#f87171';
          ctx.strokeRect(haz.x, haz.y, haz.w, haz.h);
          // Hazard hazard stripes
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(haz.x, haz.y, haz.w, 4);
          break;
      }
      ctx.restore();
    }
  }

  private drawWindZones(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const wz of level.windZones) {
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(wz.x, wz.y, wz.w, wz.h);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.setLineDash([4, 6]);
      ctx.strokeRect(wz.x, wz.y, wz.w, wz.h);

      // Wind current streaks
      const streakOffset = (this.animTimer * 120) % (wz.w || wz.h || 100);
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (wz.forceY < 0) {
        // Upward breeze
        for (let x = wz.x + 15; x < wz.x + wz.w; x += 30) {
          const y = wz.y + wz.h - ((streakOffset + x) % wz.h);
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - 12);
        }
      } else if (wz.forceX > 0) {
        // Right breeze
        for (let y = wz.y + 15; y < wz.y + wz.h; y += 30) {
          const x = wz.x + ((streakOffset + y) % wz.w);
          ctx.moveTo(x, y);
          ctx.lineTo(x + 12, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawGravityZones(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const gz of level.gravityZones) {
      ctx.save();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      ctx.fillRect(gz.x, gz.y, gz.w, gz.h);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.strokeRect(gz.x, gz.y, gz.w, gz.h);

      // Chevrons pointing in gravity direction
      ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
      const cx = gz.x + gz.w / 2;
      const cy = gz.y + gz.h / 2;
      ctx.font = 'bold 16px sans-serif';
      const arrow = gz.direction === 'UP' ? '▲' : gz.direction === 'LEFT' ? '◀' : gz.direction === 'RIGHT' ? '▶' : '▼';
      ctx.fillText(arrow, cx - 6, cy + 6);
      ctx.restore();
    }

    for (const gs of level.gravitySwitches) {
      ctx.save();
      ctx.fillStyle = '#581c87';
      ctx.fillRect(gs.x, gs.y, gs.w, gs.h);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gs.x, gs.y, gs.w, gs.h);
      const arrow = gs.newDirection === 'UP' ? '▲' : gs.newDirection === 'LEFT' ? '◀' : gs.newDirection === 'RIGHT' ? '▶' : '▼';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(arrow, gs.x + gs.w / 2 - 5, gs.y + gs.h / 2 + 4);
      ctx.restore();
    }
  }

  private drawTeleporters(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const tp of level.teleporters) {
      ctx.save();
      const cx = tp.x + tp.w / 2;
      const cy = tp.y + tp.h / 2;
      const r = tp.w / 2;

      ctx.translate(cx, cy);
      ctx.rotate(this.animTimer * 4);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 1.5);
      ctx.stroke();

      ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawFluxNodes(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const fn of level.fluxNodes) {
      ctx.save();
      const cx = fn.x + fn.w / 2;
      const cy = fn.y + fn.h / 2;

      ctx.translate(cx, cy);
      ctx.rotate(this.animTimer * 2);

      // Outer dual rotating rings
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.fillText('FLUX', -10, 3);

      ctx.restore();
    }
  }

  private drawShards(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const shard of level.shards) {
      if (shard.collected) continue;
      ctx.save();

      const floatY = Math.sin(this.animTimer * 4 + shard.x) * 4;
      const cx = shard.x;
      const cy = shard.y + floatY;

      ctx.translate(cx, cy);
      ctx.rotate(this.animTimer * 2);

      // Glowing Diamond
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;

      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private drawExitDoor(ctx: CanvasRenderingContext2D, level: LevelData) {
    const d = level.exitDoor;
    ctx.save();

    // Portal Frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(d.x, d.y, d.w, d.h);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 15;
    ctx.strokeRect(d.x, d.y, d.w, d.h);

    // Swirling portal vortex inside
    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;
    const pulse = Math.sin(this.animTimer * 5) * 0.15 + 0.85;

    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, 0, d.w * 0.38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.arc(0, 0, d.w * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerEntity, settings: GameSettings) {
    if (player.isDead) return;

    ctx.save();
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;

    ctx.translate(cx, cy);
    ctx.scale(player.squashX, player.squashY);

    const isHeavy = PhysicsEngine.hasState(player, 'HEAVY');
    const isLight = PhysicsEngine.hasState(player, 'LIGHT');
    const isMagnetic = PhysicsEngine.hasState(player, 'MAGNETIC');
    const isElastic = PhysicsEngine.hasState(player, 'ELASTIC');
    const isFrozen = PhysicsEngine.hasState(player, 'FROZEN');
    const isPhase = PhysicsEngine.hasState(player, 'PHASE');

    // 1. Aura / Field effects
    if (isMagnetic) {
      // Magnetic field arcs
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      const radius = 22 + Math.sin(this.animTimer * 8) * 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, radius - 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.arc(0, 0, radius - 6, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    }

    if (isPhase) {
      ctx.globalAlpha = 0.55;
      // Chromatic ghost ring
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.strokeRect(-player.w / 2 - 2, -player.h / 2 - 2, player.w + 4, player.h + 4);
    }

    // 2. Body fill & style per state
    let bodyColor = '#ffffff';
    let borderColor = '#94a3b8';
    let cornerRadius = 3;

    if (isHeavy) {
      bodyColor = '#312e81';
      borderColor = '#6366f1';
      cornerRadius = 1;
    } else if (isLight) {
      bodyColor = '#e0f2fe';
      borderColor = '#38bdf8';
      cornerRadius = 6;
    } else if (isElastic) {
      bodyColor = '#fef08a';
      borderColor = '#eab308';
      cornerRadius = 8;
    } else if (isFrozen) {
      bodyColor = '#a5f3fc';
      borderColor = '#06b6d4';
      cornerRadius = 2;
    } else if (isPhase) {
      bodyColor = '#f5d0fe';
      borderColor = '#c084fc';
      cornerRadius = 4;
    } else if (isMagnetic) {
      bodyColor = '#fee2e2';
      borderColor = '#ef4444';
      cornerRadius = 4;
    }

    // Draw main geometric body
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = isLight || isPhase ? 12 : 6;

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;

    // Rounded rectangle body
    const hw = player.w / 2;
    const hh = player.h / 2;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, player.w, player.h, cornerRadius);
    ctx.fill();
    ctx.stroke();

    // 3. Inner geometric silhouette / face / eye
    ctx.shadowBlur = 0;
    ctx.fillStyle = isHeavy ? '#818cf8' : '#0f172a';
    const eyeOffsetX = player.facing * 3;
    ctx.fillRect(eyeOffsetX - 2, -3, 5, 5);

    // 4. State emblem / shape for colorblind accessibility
    if (settings.colorblindMode) {
      ctx.fillStyle = isHeavy ? '#ffffff' : '#000000';
      ctx.font = 'bold 8px monospace';
      const glyph = isHeavy ? 'H' : isLight ? 'L' : isMagnetic ? 'M' : isElastic ? 'E' : isFrozen ? 'F' : isPhase ? 'P' : '';
      ctx.fillText(glyph, -3, hh - 3);
    }

    ctx.restore();
  }

  private spawnStateParticles(player: PlayerEntity, settings: GameSettings) {
    if (settings.particleDensity === 'OFF' || player.isDead) return;

    const isHeavy = PhysicsEngine.hasState(player, 'HEAVY');
    const isLight = PhysicsEngine.hasState(player, 'LIGHT');
    const isFrozen = PhysicsEngine.hasState(player, 'FROZEN');
    const isPhase = PhysicsEngine.hasState(player, 'PHASE');
    const isElastic = PhysicsEngine.hasState(player, 'ELASTIC');

    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;

    if (isHeavy && Math.random() < 0.4) {
      // Downward dense particles
      this.addParticle({
        x: px + (Math.random() - 0.5) * player.w,
        y: py + player.h / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: Math.random() * 40 + 20,
        life: 0,
        maxLife: 0.35,
        size: Math.random() * 2.5 + 1.5,
        color: '#4f46e5',
        shape: 'square',
      }, settings);
    } else if (isLight && Math.random() < 0.5) {
      // Floating upward particles
      this.addParticle({
        x: px + (Math.random() - 0.5) * player.w,
        y: py + (Math.random() - 0.5) * player.h,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 30 - 10,
        life: 0,
        maxLife: 0.5,
        size: Math.random() * 2.5 + 1,
        color: '#7dd3fc',
        shape: 'circle',
      }, settings);
    } else if (isFrozen && Math.random() < 0.3) {
      // Frost sparkles
      this.addParticle({
        x: px + (Math.random() - 0.5) * player.w,
        y: py + (Math.random() - 0.5) * player.h,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 0.4,
        size: 3,
        color: '#cffafe',
        shape: 'frost',
      }, settings);
    } else if (isPhase && Math.random() < 0.4) {
      // Phase shimmer ring
      this.addParticle({
        x: px,
        y: py,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.3,
        size: 14,
        color: '#d8b4fe',
        shape: 'ring',
      }, settings);
    } else if (isElastic && Math.abs(player.vx) > 30 && Math.random() < 0.3) {
      // Bouncy trails
      this.addParticle({
        x: px - player.facing * 8,
        y: py + player.h / 2,
        vx: -player.vx * 0.2,
        vy: -15,
        life: 0,
        maxLife: 0.25,
        size: 2,
        color: '#fde047',
        shape: 'circle',
      }, settings);
    }
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D, dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'ring') {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (p.life / p.maxLife) * 0.5), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'frost') {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - 3, p.y);
        ctx.lineTo(p.x + 3, p.y);
        ctx.moveTo(p.x, p.y - 3);
        ctx.lineTo(p.x, p.y + 3);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawGravityIndicator(ctx: CanvasRenderingContext2D, dir: GravityDirection, roomWidth: number) {
    ctx.save();
    ctx.translate(roomWidth - 45, 20);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(15, 15, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const arrow = dir === 'UP' ? '▲' : dir === 'LEFT' ? '◀' : dir === 'RIGHT' ? '▶' : '▼';
    ctx.fillText(arrow, 15, 15);

    ctx.restore();
  }
}
