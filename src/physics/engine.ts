import {
  PhysicsState,
  GravityDirection,
  LevelData,
  Block,
  Platform,
  Vector2,
  Rect,
} from '../types/game';

export interface PlayerEntity {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  state: PhysicsState;
  combinedState: [PhysicsState, PhysicsState] | null;
  attachedToMagnet: boolean;
  magnetNormal: Vector2 | null;
  squashX: number;
  squashY: number;
  facing: 1 | -1;
  phaseTimer?: number;
  isDead: boolean;
  reachedExit: boolean;
}

export class PhysicsEngine {
  public gravityDir: GravityDirection = 'DOWN';
  public gravityMagnitude = 900; // pixels / s^2

  // AABB Overlap check
  public static checkAABB(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  // Returns effective properties checking active state + flux node combination
  public static hasState(player: PlayerEntity, check: PhysicsState): boolean {
    if (player.state === check) return true;
    if (player.combinedState && (player.combinedState[0] === check || player.combinedState[1] === check)) {
      return true;
    }
    return false;
  }

  public getGravityVector(): Vector2 {
    switch (this.gravityDir) {
      case 'UP':
        return { x: 0, y: -this.gravityMagnitude };
      case 'LEFT':
        return { x: -this.gravityMagnitude, y: 0 };
      case 'RIGHT':
        return { x: this.gravityMagnitude, y: 0 };
      case 'DOWN':
      default:
        return { x: 0, y: this.gravityMagnitude };
    }
  }

  public update(
    dt: number,
    player: PlayerEntity,
    level: LevelData,
    input: { left: boolean; right: boolean; jump: boolean },
    onSound?: (soundType: string, extra?: unknown) => void
  ) {
    if (player.isDead || player.reachedExit) return;

    const isHeavy = PhysicsEngine.hasState(player, 'HEAVY');
    const isLight = PhysicsEngine.hasState(player, 'LIGHT');
    const isMagnetic = PhysicsEngine.hasState(player, 'MAGNETIC');
    const isElastic = PhysicsEngine.hasState(player, 'ELASTIC');
    const isFrozen = PhysicsEngine.hasState(player, 'FROZEN');
    const isPhase = PhysicsEngine.hasState(player, 'PHASE');

    // 1. Squash & stretch recovery towards 1.0
    player.squashX += (1.0 - player.squashX) * Math.min(1, dt * 15);
    player.squashY += (1.0 - player.squashY) * Math.min(1, dt * 15);

    // 2. Update Timed Switches
    for (const sw of level.timedSwitches) {
      if (sw.isActivated) {
        sw.timeLeft -= dt;
        if (sw.timeLeft <= 0) {
          sw.timeLeft = 0;
          sw.isActivated = false;
        }
      }
    }

    // 3. Update Moving Platforms
    for (const plat of level.platforms) {
      if (plat.moving) {
        // If frozen player is touching this platform, it pauses!
        let frozenPause = false;
        if (isFrozen) {
          const expand: Rect = { x: plat.x - 2, y: plat.y - 2, w: plat.w + 4, h: plat.h + 4 };
          if (PhysicsEngine.checkAABB(player, expand)) {
            frozenPause = true;
          }
        }

        if (!frozenPause) {
          const offset = (plat.moving.initialOffset || 0) + (plat.moving.speed * dt);
          plat.moving.initialOffset = offset;
          const cycle = Math.sin(offset);
          if (plat.moving.axis === 'x') {
            const newX = plat.x + Math.cos(offset) * plat.moving.distance * dt * plat.moving.speed;
            plat.x = newX;
          } else {
            const newY = plat.y + Math.cos(offset) * plat.moving.distance * dt * plat.moving.speed;
            plat.y = newY;
          }
        }
      }
    }

    // 4. Update Hazard Cycles
    for (const haz of level.hazards) {
      if (haz.cycle) {
        haz.cycle.offset = (haz.cycle.offset + dt) % haz.cycle.period;
      }
      if (haz.moving) {
        const offset = ((haz as unknown as { _offset?: number })._offset || 0) + haz.moving.speed * dt;
        (haz as unknown as { _offset?: number })._offset = offset;
        const delta = Math.cos(offset) * haz.moving.distance * dt * haz.moving.speed;
        if (haz.moving.axis === 'x') {
          haz.x += delta;
        } else {
          haz.y += delta;
        }
      }
    }

    // 5. Check Gravity Switches & Zones
    for (const gz of level.gravityZones) {
      if (PhysicsEngine.checkAABB(player, gz)) {
        if (this.gravityDir !== gz.direction) {
          this.gravityDir = gz.direction;
          onSound?.('gravity');
        }
      }
    }
    for (const gs of level.gravitySwitches) {
      if (PhysicsEngine.checkAABB(player, gs)) {
        if (this.gravityDir !== gs.newDirection) {
          this.gravityDir = gs.newDirection;
          onSound?.('gravity');
        }
      }
    }

    // 6. Check Teleporters
    for (const tp of level.teleporters) {
      if (tp.cooldown > 0) {
        tp.cooldown -= dt;
      } else if (PhysicsEngine.checkAABB(player, tp)) {
        player.x = tp.targetX;
        player.y = tp.targetY;
        tp.cooldown = 1.0;
        onSound?.('phase');
      }
    }

    // 7. Check Flux Nodes
    for (const fn of level.fluxNodes) {
      if (PhysicsEngine.checkAABB(player, fn)) {
        if (!player.combinedState) {
          player.combinedState = fn.combinedStates;
          onSound?.('switch', fn.combinedStates[0]);
        }
      }
    }

    // 8. Check Shards
    for (const shard of level.shards) {
      if (!shard.collected) {
        const shardRect: Rect = { x: shard.x - 8, y: shard.y - 8, w: 16, h: 16 };
        if (PhysicsEngine.checkAABB(player, shardRect)) {
          shard.collected = true;
          onSound?.('shard');
        }
      }
    }

    // 9. Apply Gravity & Environmental Forces
    let grav = this.getGravityVector();
    let gravMul = 1.0;
    if (isHeavy) gravMul = 1.9;
    if (isLight) gravMul = 0.35;
    if (isMagnetic && player.attachedToMagnet) gravMul = 0; // Stick to surface

    if (!isFrozen && !(isMagnetic && player.attachedToMagnet)) {
      player.vx += grav.x * gravMul * dt;
      player.vy += grav.y * gravMul * dt;
    }

    // Wind Zones
    for (const wz of level.windZones) {
      if (PhysicsEngine.checkAABB(player, wz)) {
        const windMult = isLight ? 3.0 : isHeavy ? 0.2 : 1.0;
        player.vx += wz.forceX * windMult * dt;
        player.vy += wz.forceY * windMult * dt;
      }
    }

    // 10. Horizontal / Directional Movement Controls
    // Movement speed adjusts based on state
    let moveSpeed = 220;
    let accel = 1800;
    let friction = 1400;

    if (isHeavy) {
      moveSpeed = 160;
      accel = 1200;
      friction = 2400;
    } else if (isLight) {
      moveSpeed = 260;
      accel = 1600;
      friction = 900;
    } else if (isElastic) {
      moveSpeed = 240;
      friction = 500; // slippery bouncy
    }

    if (isFrozen) {
      // Complete immobilization
      player.vx = 0;
      player.vy = 0;
    } else {
      // Determine movement axis based on gravity
      const isVerticalGrav = this.gravityDir === 'DOWN' || this.gravityDir === 'UP';

      if (isVerticalGrav) {
        let moveDir = 0;
        if (input.left) {
          moveDir -= 1;
          player.facing = -1;
        }
        if (input.right) {
          moveDir += 1;
          player.facing = 1;
        }

        if (moveDir !== 0) {
          player.vx += moveDir * accel * dt;
          if (Math.abs(player.vx) > moveSpeed) {
            player.vx = Math.sign(player.vx) * moveSpeed;
          }
        } else {
          // Apply friction
          if (Math.abs(player.vx) > friction * dt) {
            player.vx -= Math.sign(player.vx) * friction * dt;
          } else {
            player.vx = 0;
          }
        }
      } else {
        // Horizontal gravity (LEFT or RIGHT) - Up/Down movement on walls
        let moveDir = 0;
        if (input.left) moveDir -= 1;
        if (input.right) moveDir += 1;

        if (moveDir !== 0) {
          player.vy += moveDir * accel * dt;
          if (Math.abs(player.vy) > moveSpeed) {
            player.vy = Math.sign(player.vy) * moveSpeed;
          }
        } else {
          if (Math.abs(player.vy) > friction * dt) {
            player.vy -= Math.sign(player.vy) * friction * dt;
          } else {
            player.vy = 0;
          }
        }
      }

      // 11. Jump Handling
      if (input.jump && (player.isGrounded || (isMagnetic && player.attachedToMagnet))) {
        let jumpPower = 380;
        if (isHeavy) jumpPower = 270;
        if (isLight) jumpPower = 490;
        if (isElastic) jumpPower = 440;

        if (this.gravityDir === 'DOWN') {
          player.vy = -jumpPower;
        } else if (this.gravityDir === 'UP') {
          player.vy = jumpPower;
        } else if (this.gravityDir === 'LEFT') {
          player.vx = jumpPower;
        } else if (this.gravityDir === 'RIGHT') {
          player.vx = -jumpPower;
        }

        player.isGrounded = false;
        player.attachedToMagnet = false;
        player.squashX = 0.7;
        player.squashY = 1.35;
        onSound?.('jump', isLight);
      }
    }

    // Terminal velocity caps
    const maxSpeedY = isHeavy ? 700 : isLight ? 200 : 550;
    const maxSpeedX = isHeavy ? 600 : 500;
    player.vy = Math.max(-maxSpeedY, Math.min(maxSpeedY, player.vy));
    player.vx = Math.max(-maxSpeedX, Math.min(maxSpeedX, player.vx));

    // 12. Move Player & Handle Platform / Block Collisions
    player.isGrounded = false;
    player.attachedToMagnet = false;

    // Movement X
    player.x += player.vx * dt;
    this.resolvePlayerCollisionsX(player, level, isPhase, isElastic, isMagnetic, onSound);

    // Movement Y
    player.y += player.vy * dt;
    this.resolvePlayerCollisionsY(player, level, isPhase, isElastic, isMagnetic, onSound);

    // 13. Magnetic Attraction to Nearby Metallic / Polar Objects
    if (isMagnetic) {
      this.handleMagnetism(player, level, dt, onSound);
    }

    // 14. Update Pushable Blocks
    this.updateBlocks(dt, level, player, isHeavy, isPhase);

    // 15. Check Pressure Plates
    this.updatePressurePlates(level, player, isHeavy, isPhase, onSound);

    // 16. Update Doors based on switches / plates
    this.updateDoors(level);

    // 17. Check Hazards
    if (!isPhase) {
      this.checkHazards(player, level, isFrozen, onSound);
    }

    // 18. Check Exit Door
    if (!player.isDead && !player.reachedExit) {
      if (PhysicsEngine.checkAABB(player, level.exitDoor)) {
        player.reachedExit = true;
        player.vx *= 0.2;
        player.vy *= 0.2;
        onSound?.('win');
      }
    }

    // 19. Clamp Player inside Room Bounds
    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    } else if (player.x + player.w > level.width) {
      player.x = level.width - player.w;
      player.vx = 0;
    }
    if (player.y < -100 || player.y > level.height + 100) {
      // Fall off room -> death
      player.isDead = true;
      onSound?.('death');
    }
  }

  private resolvePlayerCollisionsX(
    player: PlayerEntity,
    level: LevelData,
    isPhase: boolean,
    isElastic: boolean,
    isMagnetic: boolean,
    onSound?: (soundType: string, extra?: unknown) => void
  ) {
    for (const plat of level.platforms) {
      if (plat.type === 'ONE_WAY') continue;
      if (plat.type === 'PHASE' && isPhase) continue;

      if (PhysicsEngine.checkAABB(player, plat)) {
        if (isMagnetic && (plat.type === 'MAGNETIC_POS' || plat.type === 'MAGNETIC_NEG')) {
          player.attachedToMagnet = true;
        }

        if (player.vx > 0) {
          player.x = plat.x - player.w;
          if (isElastic || plat.type === 'ELASTIC') {
            player.vx = -player.vx * 0.85;
            player.squashX = 0.7;
            player.squashY = 1.3;
            onSound?.('bounce', 1);
          } else {
            player.vx = 0;
          }
        } else if (player.vx < 0) {
          player.x = plat.x + plat.w;
          if (isElastic || plat.type === 'ELASTIC') {
            player.vx = -player.vx * 0.85;
            player.squashX = 0.7;
            player.squashY = 1.3;
            onSound?.('bounce', 1);
          } else {
            player.vx = 0;
          }
        }
      }
    }

    // Door collisions (closed doors act as solid walls)
    for (const door of level.doors) {
      if (!door.isOpen && PhysicsEngine.checkAABB(player, door)) {
        if (player.vx > 0) {
          player.x = door.x - player.w;
          player.vx = 0;
        } else if (player.vx < 0) {
          player.x = door.x + door.w;
          player.vx = 0;
        }
      }
    }
  }

  private resolvePlayerCollisionsY(
    player: PlayerEntity,
    level: LevelData,
    isPhase: boolean,
    isElastic: boolean,
    isMagnetic: boolean,
    onSound?: (soundType: string, extra?: unknown) => void
  ) {
    for (const plat of level.platforms) {
      if (plat.type === 'PHASE' && isPhase) continue;

      // One-way platform check: only collide when falling down through top edge
      if (plat.type === 'ONE_WAY') {
        if (player.vy > 0 && player.y + player.h - player.vy * 0.05 <= plat.y + 4) {
          if (PhysicsEngine.checkAABB(player, plat)) {
            player.y = plat.y - player.h;
            player.vy = 0;
            player.isGrounded = true;
          }
        }
        continue;
      }

      if (PhysicsEngine.checkAABB(player, plat)) {
        if (isMagnetic && (plat.type === 'MAGNETIC_POS' || plat.type === 'MAGNETIC_NEG')) {
          player.attachedToMagnet = true;
        }

        if (player.vy > 0) {
          player.y = plat.y - player.h;
          player.isGrounded = true;

          if (isElastic || plat.type === 'ELASTIC') {
            const bounceForce = plat.type === 'ELASTIC' ? 1.25 : 0.85;
            player.vy = -player.vy * bounceForce;
            player.squashX = 1.4;
            player.squashY = 0.6;
            onSound?.('bounce', 1);
          } else {
            if (player.vy > 250) {
              onSound?.('land', PhysicsEngine.hasState(player, 'HEAVY'));
            }
            player.vy = 0;
            player.squashX = 1.25;
            player.squashY = 0.8;
          }
        } else if (player.vy < 0) {
          player.y = plat.y + plat.h;
          if (isElastic || plat.type === 'ELASTIC') {
            player.vy = -player.vy * 0.85;
            player.squashX = 1.3;
            player.squashY = 0.7;
            onSound?.('bounce', 1);
          } else {
            player.vy = 0;
          }
        }
      }
    }

    // Door collisions
    for (const door of level.doors) {
      if (!door.isOpen && PhysicsEngine.checkAABB(player, door)) {
        if (player.vy > 0) {
          player.y = door.y - player.h;
          player.vy = 0;
          player.isGrounded = true;
        } else if (player.vy < 0) {
          player.y = door.y + door.h;
          player.vy = 0;
        }
      }
    }
  }

  private handleMagnetism(
    player: PlayerEntity,
    level: LevelData,
    dt: number,
    onSound?: (soundType: string, extra?: unknown) => void
  ) {
    const magnetRange = 130;
    const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };

    // Attract to magnetic platforms
    for (const plat of level.platforms) {
      if (plat.type === 'MAGNETIC_POS' || plat.type === 'MAGNETIC_NEG') {
        const platCenter = { x: plat.x + plat.w / 2, y: plat.y + plat.h / 2 };
        const dx = platCenter.x - playerCenter.x;
        const dy = platCenter.y - playerCenter.y;
        const dist = Math.hypot(dx, dy);

        if (dist < magnetRange && dist > 1) {
          const force = (1 - dist / magnetRange) * 550 * dt;
          player.vx += (dx / dist) * force;
          player.vy += (dy / dist) * force;
        }
      }
    }

    // Attract magnetic pushable blocks
    for (const block of level.blocks) {
      if (block.type === 'MAGNETIC_POS' || block.type === 'MAGNETIC_NEG') {
        const blockCenter = { x: block.x + block.w / 2, y: block.y + block.h / 2 };
        const dx = playerCenter.x - blockCenter.x;
        const dy = playerCenter.y - blockCenter.y;
        const dist = Math.hypot(dx, dy);

        if (dist < magnetRange && dist > 1) {
          const pull = (1 - dist / magnetRange) * 400 * dt;
          block.vx += (dx / dist) * pull;
          block.vy += (dy / dist) * pull;
          onSound?.('magnet');
        }
      }
    }
  }

  private updateBlocks(
    dt: number,
    level: LevelData,
    player: PlayerEntity,
    isHeavy: boolean,
    isPhase: boolean
  ) {
    const grav = this.getGravityVector();

    for (const block of level.blocks) {
      // Gravity on blocks
      block.vy += grav.y * dt;
      block.vx += grav.x * dt;

      // Friction
      block.vx *= Math.max(0, 1 - dt * 6);

      // Move block X
      block.x += block.vx * dt;
      for (const plat of level.platforms) {
        if (plat.type === 'ONE_WAY') continue;
        if (PhysicsEngine.checkAABB(block, plat)) {
          if (block.vx > 0) {
            block.x = plat.x - block.w;
            block.vx = 0;
          } else if (block.vx < 0) {
            block.x = plat.x + plat.w;
            block.vx = 0;
          }
        }
      }

      // Move block Y
      block.y += block.vy * dt;
      block.isGrounded = false;
      for (const plat of level.platforms) {
        if (plat.type === 'ONE_WAY') {
          if (block.vy > 0 && block.y + block.h - block.vy * 0.05 <= plat.y + 4) {
            if (PhysicsEngine.checkAABB(block, plat)) {
              block.y = plat.y - block.h;
              block.vy = 0;
              block.isGrounded = true;
            }
          }
          continue;
        }

        if (PhysicsEngine.checkAABB(block, plat)) {
          if (block.vy > 0) {
            block.y = plat.y - block.h;
            block.vy = 0;
            block.isGrounded = true;
          } else if (block.vy < 0) {
            block.y = plat.y + plat.h;
            block.vy = 0;
          }
        }
      }

      // Block-Player push interaction
      if (!isPhase && PhysicsEngine.checkAABB(player, block)) {
        const canPush = block.type !== 'HEAVY' || isHeavy;

        if (canPush) {
          // Push horizontally
          if (player.vx > 0 && player.x < block.x) {
            block.x = player.x + player.w;
            block.vx = player.vx * (isHeavy ? 1.0 : 0.6);
          } else if (player.vx < 0 && player.x > block.x) {
            block.x = player.x - block.w;
            block.vx = player.vx * (isHeavy ? 1.0 : 0.6);
          }

          // Player standing on block
          if (player.vy > 0 && player.y + player.h - player.vy * dt <= block.y + 6) {
            player.y = block.y - player.h;
            player.vy = 0;
            player.isGrounded = true;
          }
        } else {
          // Player cannot push heavy block, behaves like a solid wall
          if (player.vx > 0 && player.x < block.x) {
            player.x = block.x - player.w;
            player.vx = 0;
          } else if (player.vx < 0 && player.x > block.x) {
            player.x = block.x + block.w;
            player.vx = 0;
          }
          if (player.vy > 0 && player.y + player.h - player.vy * dt <= block.y + 6) {
            player.y = block.y - player.h;
            player.vy = 0;
            player.isGrounded = true;
          }
        }
      }
    }
  }

  private updatePressurePlates(
    level: LevelData,
    player: PlayerEntity,
    isHeavy: boolean,
    isPhase: boolean,
    onSound?: (soundType: string, extra?: unknown) => void
  ) {
    for (const plate of level.pressurePlates) {
      let active = false;

      // Player on plate
      if (!isPhase && PhysicsEngine.checkAABB(player, plate)) {
        if (!plate.requiresHeavy || isHeavy) {
          active = true;
        }
      }

      // Blocks on plate
      for (const block of level.blocks) {
        if (PhysicsEngine.checkAABB(block, plate)) {
          if (!plate.requiresHeavy || block.type === 'HEAVY') {
            active = true;
            break;
          }
        }
      }

      if (active !== plate.isPressed) {
        plate.isPressed = active;
        onSound?.('plate', active);
      }
    }

    // Timed switches activated by player contact
    for (const sw of level.timedSwitches) {
      if (PhysicsEngine.checkAABB(player, sw)) {
        if (!sw.isActivated) {
          sw.isActivated = true;
          sw.timeLeft = sw.duration;
          onSound?.('plate', true);
        }
      }
    }
  }

  private updateDoors(level: LevelData) {
    for (const door of level.doors) {
      // Find matching plates or switches
      let triggerOn = false;

      for (const plate of level.pressurePlates) {
        if (plate.targetId === door.id && plate.isPressed) {
          triggerOn = true;
          break;
        }
      }

      for (const sw of level.timedSwitches) {
        if (sw.targetId === door.id && sw.isActivated) {
          triggerOn = true;
          break;
        }
      }

      const shouldOpen = door.invert ? !triggerOn : triggerOn;
      door.isOpen = shouldOpen;
    }
  }

  private checkHazards(
    player: PlayerEntity,
    level: LevelData,
    isFrozen: boolean,
    onSound?: (soundType: string, extra?: unknown) => void
  ) {
    for (const haz of level.hazards) {
      // If cycle exists, check if hazard is currently active
      if (haz.cycle) {
        if (haz.cycle.offset > haz.cycle.activeDuration) {
          continue; // Hazard is off during this part of the cycle
        }
      }

      // Some hazards ignore frozen players (e.g. crusher or electric field)
      if (isFrozen && (haz.type === 'CRUSHER' || haz.type === 'ELECTRIC')) {
        continue;
      }

      if (PhysicsEngine.checkAABB(player, haz)) {
        player.isDead = true;
        onSound?.('hazard');
        break;
      }
    }
  }
}
