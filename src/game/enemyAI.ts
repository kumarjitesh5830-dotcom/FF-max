/**
 * FreeFire 3D Tactical Enemy AI Controller
 * Manages 3 distinct humanoid enemy bots with realistic tactical behaviors:
 * Patrol, Alert, Tactical Cover, Fire Bursts with Muzzle Flash, and Head/Body Hitbox Detection.
 */

import * as THREE from 'three';
import { HumanoidCharacter } from './humanoid';
import { soundManager } from '../audio/soundManager';
import { GameWorld } from './world';

export interface EnemyBot {
  id: number;
  name: string;
  character: HumanoidCharacter;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  state: 'PATROL' | 'ALERT' | 'ATTACK' | 'COVER' | 'DEAD';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  patrolPoints: THREE.Vector3[];
  currentPatrolIdx: number;
  fireCooldown: number;
  burstCount: number;
  aimAngle: number;
  coverTimer: number;
}

export class EnemyAIManager {
  public enemies: EnemyBot[] = [];
  private scene: THREE.Scene;
  private world: GameWorld;

  constructor(scene: THREE.Scene, world: GameWorld) {
    this.scene = scene;
    this.world = world;
    this.initEnemies();
  }

  private initEnemies() {
    const enemyConfigs = [
      {
        id: 1,
        name: 'Kla Hunter',
        spawn: this.world.enemySpawnPositions[0],
        patrol: [
          new THREE.Vector3(-14, 0, -12),
          new THREE.Vector3(-10, 0, -3),
          new THREE.Vector3(-16, 0, 4),
        ],
        vestColor: 0x4a3b2c,
        helmetColor: 0x3d3023,
      },
      {
        id: 2,
        name: 'Chrono Striker',
        spawn: this.world.enemySpawnPositions[1],
        patrol: [
          new THREE.Vector3(15, 0, -10),
          new THREE.Vector3(12, 0, 2),
          new THREE.Vector3(16, 0, -16),
        ],
        vestColor: 0x2e382b,
        helmetColor: 0x1e271c,
      },
      {
        id: 3,
        name: 'Alok Rebel',
        spawn: this.world.enemySpawnPositions[2],
        patrol: [
          new THREE.Vector3(0, 0, -22),
          new THREE.Vector3(-6, 0, -18),
          new THREE.Vector3(6, 0, -18),
        ],
        vestColor: 0x483d3f,
        helmetColor: 0x362c2e,
      },
    ];

    enemyConfigs.forEach((cfg) => {
      const character = new HumanoidCharacter({
        isPlayer: false,
        name: cfg.name,
        vestColor: cfg.vestColor,
        helmetColor: cfg.helmetColor,
      });

      character.root.position.copy(cfg.spawn);
      this.scene.add(character.root);

      const bot: EnemyBot = {
        id: cfg.id,
        name: cfg.name,
        character,
        health: 100,
        maxHealth: 100,
        isAlive: true,
        state: 'PATROL',
        position: cfg.spawn.clone(),
        velocity: new THREE.Vector3(),
        targetPosition: cfg.patrol[0].clone(),
        patrolPoints: cfg.patrol,
        currentPatrolIdx: 0,
        fireCooldown: 1.0 + Math.random() * 1.5,
        burstCount: 0,
        aimAngle: 0,
        coverTimer: 0,
      };

      this.enemies.push(bot);
    });
  }

  /**
   * Main AI Update Loop
   */
  public update(
    dt: number,
    playerPosition: THREE.Vector3,
    onEnemyShoot: (bot: EnemyBot, hitPlayer: boolean) => void
  ) {
    for (const bot of this.enemies) {
      if (!bot.isAlive) {
        bot.character.updateAnimation(0, true, false, false, false, true, dt);
        continue;
      }

      const distToPlayer = bot.position.distanceTo(playerPosition);
      const dirToPlayer = new THREE.Vector3().subVectors(playerPosition, bot.position);
      dirToPlayer.y = 0;
      const angleToPlayer = Math.atan2(dirToPlayer.x, dirToPlayer.z);

      // AI State Transitions
      if (bot.health < 40 && bot.state !== 'COVER') {
        bot.state = 'COVER';
        bot.coverTimer = 3.5;
        // Run away towards back of outpost
        bot.targetPosition.set(
          bot.position.x > 0 ? 18 : -18,
          0,
          -14
        );
      } else if (distToPlayer < 26) {
        bot.state = 'ATTACK';
      } else if (distToPlayer < 38) {
        bot.state = 'ALERT';
      } else if (bot.state !== 'COVER') {
        bot.state = 'PATROL';
      }

      let moveSpeed = 0;
      let isAiming = false;
      let isShooting = false;

      // Behavior according to state
      switch (bot.state) {
        case 'PATROL': {
          // Move towards current patrol waypoint
          const distToTarget = bot.position.distanceTo(bot.targetPosition);
          if (distToTarget < 1.2) {
            bot.currentPatrolIdx = (bot.currentPatrolIdx + 1) % bot.patrolPoints.length;
            bot.targetPosition.copy(bot.patrolPoints[bot.currentPatrolIdx]);
          }

          const patrolDir = new THREE.Vector3().subVectors(bot.targetPosition, bot.position).normalize();
          patrolDir.y = 0;
          bot.velocity.copy(patrolDir).multiplyScalar(2.2);
          moveSpeed = 2.2;

          const targetAngle = Math.atan2(patrolDir.x, patrolDir.z);
          bot.character.root.rotation.y = THREE.MathUtils.damp(
            bot.character.root.rotation.y,
            targetAngle,
            6,
            dt
          );
          break;
        }

        case 'ALERT': {
          // Face the player cautiously
          bot.character.root.rotation.y = THREE.MathUtils.damp(
            bot.character.root.rotation.y,
            angleToPlayer,
            8,
            dt
          );
          isAiming = true;
          bot.velocity.set(0, 0, 0);
          moveSpeed = 0;
          break;
        }

        case 'ATTACK': {
          // Face player directly
          bot.character.root.rotation.y = THREE.MathUtils.damp(
            bot.character.root.rotation.y,
            angleToPlayer,
            12,
            dt
          );
          isAiming = true;

          // Strafe or maintain distance between 9m and 16m
          if (distToPlayer > 16) {
            // Advance towards player
            const advanceDir = dirToPlayer.clone().normalize();
            bot.velocity.copy(advanceDir).multiplyScalar(2.8);
            moveSpeed = 2.8;
          } else if (distToPlayer < 8) {
            // Back up
            const retreatDir = dirToPlayer.clone().normalize().negate();
            bot.velocity.copy(retreatDir).multiplyScalar(2.4);
            moveSpeed = 2.4;
          } else {
            // Tactical lateral strafe
            const strafeDir = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x).normalize();
            if (Math.sin(Date.now() * 0.002 + bot.id) > 0) strafeDir.negate();
            bot.velocity.copy(strafeDir).multiplyScalar(1.6);
            moveSpeed = 1.6;
          }

          // Shooting logic with burst mechanics
          bot.fireCooldown -= dt;
          if (bot.fireCooldown <= 0) {
            isShooting = true;
            bot.character.triggerMuzzleFlash();
            soundManager.playGunshot('AR');

            // Chance to hit player based on distance (fair gameplay tuning)
            const hitChance = Math.max(0.2, 0.65 - distToPlayer * 0.015);
            const doesHit = Math.random() < hitChance;
            onEnemyShoot(bot, doesHit);

            bot.burstCount++;
            if (bot.burstCount >= 3) {
              bot.fireCooldown = 1.2 + Math.random() * 0.8;
              bot.burstCount = 0;
            } else {
              bot.fireCooldown = 0.16;
            }
          }
          break;
        }

        case 'COVER': {
          bot.coverTimer -= dt;
          if (bot.coverTimer <= 0) {
            bot.state = 'ATTACK';
          }
          const coverDir = new THREE.Vector3().subVectors(bot.targetPosition, bot.position).normalize();
          coverDir.y = 0;
          bot.velocity.copy(coverDir).multiplyScalar(3.8); // Sprint to cover
          moveSpeed = 3.8;
          const coverAngle = Math.atan2(coverDir.x, coverDir.z);
          bot.character.root.rotation.y = THREE.MathUtils.damp(
            bot.character.root.rotation.y,
            coverAngle,
            10,
            dt
          );
          break;
        }
      }

      // Apply movement velocity and resolve world collisions
      bot.position.addScaledVector(bot.velocity, dt);
      const col = this.world.checkCollision(bot.position, 0.45);
      if (col.collides) {
        bot.position.add(col.resolveVec);
      }

      bot.character.root.position.copy(bot.position);
      bot.character.updateAnimation(moveSpeed, true, isAiming, isShooting, false, false, dt);
    }
  }

  /**
   * Apply damage to an enemy bot
   * Returns true if killed
   */
  public damageEnemy(
    botId: number,
    damage: number,
    isHeadshot: boolean
  ): { killed: boolean; bot: EnemyBot | null } {
    const bot = this.enemies.find((b) => b.id === botId);
    if (!bot || !bot.isAlive) return { killed: false, bot: null };

    bot.health = Math.max(0, bot.health - damage);

    if (bot.health <= 0) {
      bot.isAlive = false;
      bot.state = 'DEAD';
      return { killed: true, bot };
    } else {
      // Alert bot immediately when shot from afar
      if (bot.state === 'PATROL') {
        bot.state = 'ALERT';
      }
      return { killed: false, bot };
    }
  }

  /**
   * Reset all enemies for a new match
   */
  public reset() {
    this.enemies.forEach((bot, idx) => {
      bot.isAlive = true;
      bot.health = 100;
      bot.state = 'PATROL';
      bot.position.copy(this.world.enemySpawnPositions[idx]);
      bot.velocity.set(0, 0, 0);
      bot.character.root.position.copy(bot.position);
      bot.character.root.rotation.set(0, 0, 0);
      bot.character.resetPose();
    });
  }
}
