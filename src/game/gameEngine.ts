/**
 * FreeFire 3D Battle Royale - Main Game Engine
 * Coordinates Three.js scene, PBR lighting, procedural world, humanoid player,
 * enemy AI, camera kinematics, weapon raycasting, headshot hitbox detection,
 * particle effects, and sound triggers.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HumanoidCharacter } from './humanoid';
import { GameWorld } from './world';
import { EnemyAIManager, EnemyBot } from './enemyAI';
import { WEAPONS } from './weapons';
import { soundManager } from '../audio/soundManager';
import {
  GameStatus,
  PlayerStats,
  DamageNumber,
  KillNotification,
  MinimapEntity,
  GraphicsQuality,
  CharacterDef,
} from '../types/game';

// Pre-allocated math helpers to eliminate Garbage Collection in render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onGameStatusChange: (status: GameStatus) => void;
  onDamageNumber: (dmg: DamageNumber) => void;
  onKillNotification: (notif: KillNotification) => void;
  onHitmarker: (isHeadshot: boolean) => void;
  onMinimapUpdate: (entities: MinimapEntity[], playerHeading: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private isDestroyed: boolean = false;

  // Game Subsystems
  public world: GameWorld;
  public player: HumanoidCharacter;
  public enemyAI: EnemyAIManager;
  private callbacks: GameEngineCallbacks;

  // Game Status
  public status: GameStatus = 'TITLE';

  // Player State
  public playerPos = new THREE.Vector3(0, 0, 18);
  public playerVel = new THREE.Vector3();
  public playerYaw: number = 0;
  public playerPitch: number = 0;
  public isGrounded: boolean = true;
  public isAiming: boolean = false;
  public isCrouching: boolean = false;
  public isSprinting: boolean = false;
  public isShootingHeld: boolean = false;

  public health: number = 100;
  public maxHealth: number = 100;
  public shield: number = 100;
  public maxShield: number = 100;

  // Weapon State
  public currentWeaponIndex: number = 0;
  public ammoInMag: number = 30;
  public ammoReserve: number = 120;
  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  public fireCooldown: number = 0;

  // Match Stats
  public kills: number = 0;
  public headshots: number = 0;
  public shotsFired: number = 0;
  public shotsHit: number = 0;

  // Input states
  public moveInput = { forward: 0, right: 0 };

  // Particles & Tracers
  private tracers: { mesh: THREE.Line; life: number }[] = [];
  private sparks: { mesh: THREE.Points; velocities: THREE.Vector3[]; life: number }[] = [];

  // Quality & Settings
  public quality: GraphicsQuality = 'low';
  public sensitivity: number = 1.0;
  public sprintMultiplier: number = 1.0;
  public autoHeadshot: boolean = false;
  private sunLight!: THREE.DirectionalLight;
  private minimapTimer: number = 0;
  private statsTimer: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Scene & Atmosphere Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb5c9d6);
    this.scene.fog = new THREE.Fog(0xb5c9d6, 35, 80);

    // 2. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 200);

    // 3. Renderer Setup (Defaulting to LOW for ultra-smooth 60 FPS on mobile)
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(1.0); // Low default
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = false; // Default Low: shadows disabled
    container.appendChild(this.renderer.domElement);

    // 4. Mandatory Studio Environment Reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 5. Lighting Setup
    this.setupLighting();

    // 6. World Generation
    this.world = new GameWorld(this.scene);

    // 7. Player Humanoid Character
    this.player = new HumanoidCharacter({
      isPlayer: true,
      name: 'Player',
      vestColor: 0x1e293b,
      helmetColor: 0x0f172a,
    });
    this.player.root.position.copy(this.world.playerSpawnPos);
    this.playerPos.copy(this.world.playerSpawnPos);
    this.scene.add(this.player.root);

    // 8. Enemy AI Bots
    this.enemyAI = new EnemyAIManager(this.scene, this.world);

    // 9. Resize Handling
    window.addEventListener('resize', this.onWindowResize);

    // 10. Start Render Loop
    this.animate();
  }

  private setupLighting() {
    // Warm Sun directional key light (default castShadow is false on Low)
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.position.set(28, 45, 20);
    this.sunLight.castShadow = false; // Default Low
    this.sunLight.shadow.mapSize.width = 512;
    this.sunLight.shadow.mapSize.height = 512;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.camera.left = -30;
    this.sunLight.shadow.camera.right = 30;
    this.sunLight.shadow.camera.top = 30;
    this.sunLight.shadow.camera.bottom = -30;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // Sky/Ground contrast fill light
    const hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0x92613d, 1.1);
    this.scene.add(hemiLight);

    // Ambient light baseline
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);
  }

  /**
   * Adjust graphics quality (Low / Medium / High)
   */
  public setQuality(quality: GraphicsQuality) {
    this.quality = quality;
    if (quality === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
      if (this.sunLight) this.sunLight.castShadow = false;
      this.scene.fog = new THREE.Fog(0xb5c9d6, 30, 70);
    } else if (quality === 'medium') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      if (this.sunLight) {
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(512, 512);
      }
      this.scene.fog = new THREE.Fog(0xb5c9d6, 35, 80);
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      if (this.sunLight) {
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(1024, 1024);
      }
      this.scene.fog = new THREE.Fog(0xb5c9d6, 40, 95);
    }
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * Set aim and look sensitivity multiplier
   */
  public setSensitivity(val: number) {
    this.sensitivity = Math.max(0.2, Math.min(3.0, val));
  }

  /**
   * Apply selected operative and perks
   */
  public setPlayerCharacter(char: CharacterDef) {
    this.player.applyCharacterOutfit(char.vestColor, char.helmetColor, char.skinColor);
    // Character perks:
    if (char.id === 'kelly') {
      this.sprintMultiplier = 1.15; // 15% faster sprint
    } else {
      this.sprintMultiplier = 1.0;
    }
  }

  /**
   * Enable/Disable Auto Headshot Targeting Assist
   */
  public setAutoHeadshot(val: boolean) {
    this.autoHeadshot = !!val;
  }

  /**
   * Start shooting - fires immediately on trigger pull with 0ms delay
   */
  public startShooting() {
    this.isShootingHeld = true;
    if (this.status !== 'PLAYING') return;

    if (this.ammoInMag <= 0) {
      this.reload();
      return;
    }

    if (!this.isReloading) {
      // Fire immediately if cooldown is negligible or ready
      if (this.fireCooldown <= 0.04) {
        this.fireCooldown = 0;
        this.fireWeapon();
      }
    }
  }

  /**
   * Stop shooting on trigger release
   */
  public stopShooting() {
    this.isShootingHeld = false;
  }

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Start a new match
   */
  public startMatch() {
    this.status = 'PLAYING';
    this.health = 100;
    this.shield = 100;
    this.kills = 0;
    this.headshots = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.currentWeaponIndex = 0;
    this.ammoInMag = WEAPONS[0].magazineSize;
    this.ammoReserve = 120;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.isShootingHeld = false;
    this.playerPos.copy(this.world.playerSpawnPos);
    this.playerYaw = 0; // Look forward into the outpost (-Z)
    this.playerPitch = 0;
    this.player.root.position.copy(this.playerPos);
    this.player.root.rotation.y = Math.PI; // Face forward into the outpost
    this.player.resetPose();
    this.enemyAI.reset();

    this.callbacks.onGameStatusChange('PLAYING');
    this.broadcastStats();
  }

  /**
   * Pause / Resume Game
   */
  public togglePause() {
    if (this.status === 'PLAYING') {
      this.status = 'PAUSED';
      this.callbacks.onGameStatusChange('PAUSED');
    } else if (this.status === 'PAUSED') {
      this.status = 'PLAYING';
      this.callbacks.onGameStatusChange('PLAYING');
    }
  }

  /**
   * Main Render & Simulation Loop
   */
  private animate = () => {
    if (this.isDestroyed) return;
    requestAnimationFrame(this.animate);

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // Frame delta clamp for simulation stability

    if (this.status === 'PLAYING') {
      this.updatePlayerMovement(dt);
      this.updateWeapon(dt);
      this.updateEnemyAI(dt);

      // Throttled periodic stats update (every 100ms instead of every frame)
      this.statsTimer += dt;
      if (this.statsTimer >= 0.1) {
        this.statsTimer = 0;
        this.broadcastStats();
      }
    } else if (this.status === 'TITLE') {
      // Atmospheric title screen live orbit pan
      const time = Date.now() * 0.0004;
      this.camera.position.set(Math.cos(time) * 18, 7, Math.sin(time) * 18);
      this.camera.lookAt(0, 2.5, 0);
    }

    // Always update camera when playing or paused
    if (this.status === 'PLAYING' || this.status === 'PAUSED' || this.status === 'VICTORY' || this.status === 'DEFEAT') {
      this.updateCamera(dt);
    }

    this.updateParticles(dt);
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Third-Person Camera Kinematics (Over-The-Shoulder with ADS zoom)
   * Highly responsive, zero stutter, accurate optical crosshair alignment
   */
  private updateCamera(dt: number) {
    const targetFov = this.isAiming ? 36 : 65;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
    this.camera.updateProjectionMatrix();

    // Calculate over-the-shoulder offset based on player yaw & pitch
    const camDist = this.isAiming ? 1.8 : 3.4;
    const camHeight = this.isCrouching ? 1.3 : 1.75;
    const shoulderOffset = this.isAiming ? 0.45 : 0.65;

    // Spherical orbit calculation
    const cosPitch = Math.cos(this.playerPitch);
    const sinPitch = Math.sin(this.playerPitch);
    const sinYaw = Math.sin(this.playerYaw);
    const cosYaw = Math.cos(this.playerYaw);

    // Behind-back vector
    const backX = sinYaw * cosPitch * camDist;
    const backY = -sinPitch * camDist;
    const backZ = cosYaw * cosPitch * camDist;

    // Right-shoulder vector
    const rightX = cosYaw * shoulderOffset;
    const rightZ = -sinYaw * shoulderOffset;

    const targetCamPos = _vec3B.set(
      this.playerPos.x + backX + rightX,
      this.playerPos.y + camHeight + backY,
      this.playerPos.z + backZ + rightZ
    );

    // Damped camera position that eliminates stutter while remaining responsive
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamPos.x, 26, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamPos.y, 26, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamPos.z, 26, dt);

    // Forward aim vector from camera through crosshair
    const forwardX = -sinYaw * cosPitch;
    const forwardY = sinPitch;
    const forwardZ = -cosYaw * cosPitch;

    const lookTarget = _vec3A.set(
      this.camera.position.x + forwardX * 50,
      this.camera.position.y + forwardY * 50,
      this.camera.position.z + forwardZ * 50
    );

    this.camera.lookAt(lookTarget);
  }

  /**
   * Player movement physics, gravity, jump, sprint, and collisions
   */
  private updatePlayerMovement(dt: number) {
    if (this.health <= 0) return;

    // Compute forward & right vectors based on camera yaw
    const forward = _vec3A.set(-Math.sin(this.playerYaw), 0, -Math.cos(this.playerYaw)).normalize();
    const right = _vec3B.set(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw)).normalize();

    // Input movement vector
    const moveDir = _vec3C.set(0, 0, 0);
    moveDir.addScaledVector(forward, this.moveInput.forward);
    moveDir.addScaledVector(right, this.moveInput.right);

    const inputLength = moveDir.length();
    if (inputLength > 1) moveDir.normalize();

    // Speed calculation
    const baseSpeed = this.isSprinting
      ? 7.2 * this.sprintMultiplier
      : this.isCrouching
      ? 2.4
      : this.isAiming
      ? 2.8
      : 4.6;
    const targetVelX = moveDir.x * baseSpeed;
    const targetVelZ = moveDir.z * baseSpeed;

    this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, targetVelX, 16, dt);
    this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, targetVelZ, 16, dt);

    // Gravity & Ground Check
    this.playerVel.y -= 22 * dt; // Gravity
    this.playerPos.addScaledVector(this.playerVel, dt);

    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      this.playerVel.y = 0;
      this.isGrounded = true;
    }

    // World Collisions resolution
    const col = this.world.checkCollision(this.playerPos, 0.45);
    if (col.collides) {
      this.playerPos.add(col.resolveVec);
    }

    // Character position update
    this.player.root.position.copy(this.playerPos);

    const horizontalSpeed = Math.sqrt(this.playerVel.x * this.playerVel.x + this.playerVel.z * this.playerVel.z);

    // Character rotation: faces aiming crosshair when aiming/shooting,
    // or faces movement direction smoothly when running freely
    const aimAngle = this.playerYaw + Math.PI;
    let targetYaw = aimAngle;
    if (!this.isAiming && !this.isShootingHeld && inputLength > 0.1 && horizontalSpeed > 0.5) {
      targetYaw = Math.atan2(this.playerVel.x, this.playerVel.z);
    }

    let diff = targetYaw - this.player.root.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.player.root.rotation.y += diff * Math.min(1, dt * 20);

    // Kinematic character animations with pitch elevation
    this.player.updateAnimation(
      horizontalSpeed,
      this.isGrounded,
      this.isAiming,
      this.isShootingHeld,
      this.isCrouching,
      this.health <= 0,
      dt,
      this.playerPitch
    );

    // Sound: Footsteps
    if (horizontalSpeed > 1.0 && this.isGrounded) {
      if (Math.random() < dt * (this.isSprinting ? 3.5 : 2.5)) {
        soundManager.playFootstep();
      }
    }
  }

  /**
   * Jump Action
   */
  public jump() {
    if (this.isGrounded && this.health > 0) {
      this.playerVel.y = 7.5;
      this.isGrounded = false;
      soundManager.playJumpSound();
    }
  }

  /**
   * Toggle Crouch
   */
  public toggleCrouch() {
    this.isCrouching = !this.isCrouching;
    this.broadcastStats();
  }

  /**
   * Toggle Aim Down Sights (ADS)
   */
  public toggleAim() {
    this.isAiming = !this.isAiming;
    this.broadcastStats();
  }

  /**
   * Switch Weapon
   */
  public switchWeapon(index?: number) {
    if (index !== undefined) {
      this.currentWeaponIndex = index % WEAPONS.length;
    } else {
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % WEAPONS.length;
    }
    const currentWep = WEAPONS[this.currentWeaponIndex];
    this.ammoInMag = Math.min(this.ammoInMag, currentWep.magazineSize);
    this.isReloading = false;
    this.reloadTimer = 0;
    this.broadcastStats();
  }

  /**
   * Reload current weapon
   */
  public reload() {
    const weapon = WEAPONS[this.currentWeaponIndex];
    if (this.isReloading || this.ammoInMag >= weapon.magazineSize || this.ammoReserve <= 0) return;

    this.isReloading = true;
    this.reloadTimer = weapon.reloadTime;
    soundManager.playReloadSound();
    this.broadcastStats();
  }

  /**
   * Weapon update tick (handles auto-fire, reload progress, cooldown)
   */
  private updateWeapon(dt: number) {
    const weapon = WEAPONS[this.currentWeaponIndex];

    // Reload Progress
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const needed = weapon.magazineSize - this.ammoInMag;
        const available = Math.min(needed, this.ammoReserve);
        this.ammoInMag += available;
        this.ammoReserve -= available;
        this.isReloading = false;
        this.broadcastStats();
      }
    }

    // Fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    // Auto-fire while trigger button is held
    if (this.isShootingHeld && this.fireCooldown <= 0 && !this.isReloading) {
      if (this.ammoInMag > 0) {
        this.fireWeapon();
      } else {
        this.reload();
      }
    }
  }

  /**
   * Fire Weapon with Raycasting, Headshot Hitbox Detection, Auto Headshot Assist, Tracer and Sparks!
   * Zero delay, optimized raycasting, guaranteed wall-check protection.
   */
  public fireWeapon() {
    if (this.health <= 0 || this.isReloading) return;
    const weapon = WEAPONS[this.currentWeaponIndex];

    if (this.ammoInMag <= 0) {
      this.reload();
      return;
    }

    this.ammoInMag--;
    this.shotsFired++;
    this.fireCooldown = 1 / weapon.fireRate;

    // Muzzle flash on player character
    this.player.triggerMuzzleFlash();

    // Weapon Audio
    soundManager.playGunshot(weapon.type);

    // Camera Recoil kick
    this.playerPitch = Math.min(Math.PI * 0.35, this.playerPitch + weapon.recoilPitch);

    // Muzzle world position
    const muzzlePos = this.player.getMuzzlePosition();

    // Raycast direction from camera center through crosshair with weapon spread
    const spreadVal = this.isAiming ? weapon.spread * weapon.aimSpreadMultiplier : weapon.spread;
    const spreadX = (Math.random() - 0.5) * spreadVal;
    const spreadY = (Math.random() - 0.5) * spreadVal;

    _raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), this.camera);
    const cameraRay = _raycaster.ray;

    // ------------------------------------------------------------------------
    // 1. AUTO HEADSHOT ASSIST (When enabled in Settings)
    // Targets visible enemy head hitbox within assist cone. Never hits through walls!
    // ------------------------------------------------------------------------
    let autoTargetBot: EnemyBot | null = null;
    let autoHeadPos: THREE.Vector3 | null = null;

    if (this.autoHeadshot) {
      let bestDot = 0.88; // ~28 degree targeting assist cone
      const tempHeadPos = _vec3A;

      for (const bot of this.enemyAI.enemies) {
        if (!bot.isAlive) continue;
        bot.character.headHitbox.getWorldPosition(tempHeadPos);
        const distToEnemy = cameraRay.origin.distanceTo(tempHeadPos);
        if (distToEnemy > weapon.range) continue;

        const toHead = _vec3B.subVectors(tempHeadPos, cameraRay.origin).normalize();
        const dot = cameraRay.direction.dot(toHead);

        if (dot > bestDot) {
          // Line-of-sight wall check: ensure bullet cannot pass through walls or cover
          const losRaycaster = new THREE.Raycaster(cameraRay.origin, toHead, 0.2, distToEnemy - 0.3);
          const wallHits = losRaycaster.intersectObjects(this.world.shootableMeshes, false);

          if (wallHits.length === 0) {
            bestDot = dot;
            autoTargetBot = bot;
            autoHeadPos = tempHeadPos.clone();
          }
        }
      }
    }

    if (autoTargetBot && autoHeadPos) {
      // Auto Headshot Assist Registered!
      this.shotsHit++;
      this.headshots++;
      soundManager.playHeadshotSound();
      this.callbacks.onHitmarker(true);

      // EXACT SPEC: Headshots deal 100 damage!
      const damage = weapon.damageHead;
      this.spawnDamageNumber(autoHeadPos, damage, true);

      const result = this.enemyAI.damageEnemy(autoTargetBot.id, damage, true);
      this.spawnHitSparks(autoHeadPos, 0xff0000, 16);
      this.spawnTracer(muzzlePos, autoHeadPos);

      if (result.killed) {
        this.kills++;
        this.callbacks.onKillNotification({
          id: `${Date.now()}-${autoTargetBot.id}`,
          killer: 'You',
          victim: autoTargetBot.name,
          isHeadshot: true,
          weapon: weapon.name,
          timestamp: Date.now(),
        });

        const remainingEnemies = this.enemyAI.enemies.filter((b) => b.isAlive);
        if (remainingEnemies.length === 0) {
          this.status = 'VICTORY';
          soundManager.playVictorySound();
          this.callbacks.onGameStatusChange('VICTORY');
        }
      }

      this.broadcastStats();
      return;
    }

    // ------------------------------------------------------------------------
    // 2. NORMAL MANUAL AIMING: Accurate head/body hit detection
    // ------------------------------------------------------------------------
    const enemyHitboxes: THREE.Object3D[] = [];
    for (const bot of this.enemyAI.enemies) {
      if (bot.isAlive) {
        enemyHitboxes.push(bot.character.headHitbox);
        enemyHitboxes.push(bot.character.bodyHitbox);
      }
    }

    // Fast non-recursive intersection against 6 candidate hitboxes
    const enemyHits = _raycaster.intersectObjects(enemyHitboxes, false);

    if (enemyHits.length > 0) {
      const firstEnemyHit = enemyHits[0];
      const distToEnemy = firstEnemyHit.distance;

      // Obstacle line-of-sight check to prevent shooting through walls
      const wallRaycaster = new THREE.Raycaster(cameraRay.origin, cameraRay.direction, 0.2, distToEnemy);
      const wallBlockers = wallRaycaster.intersectObjects(this.world.shootableMeshes, false);

      if (wallBlockers.length === 0) {
        const hitPoint = firstEnemyHit.point;
        const isHead = firstEnemyHit.object.userData.isHead === true;
        const enemyOwner = firstEnemyHit.object.userData.owner as HumanoidCharacter;
        const bot = this.enemyAI.enemies.find((b) => b.character === enemyOwner);

        if (bot && bot.isAlive) {
          this.shotsHit++;
          // EXACT SPEC: Headshots deal 100 damage; body shots deal 35 damage!
          const damage = isHead ? weapon.damageHead : weapon.damageBody;

          if (isHead) {
            this.headshots++;
            soundManager.playHeadshotSound();
            this.callbacks.onHitmarker(true);
          } else {
            soundManager.playHitmarkerSound();
            this.callbacks.onHitmarker(false);
          }

          this.spawnDamageNumber(hitPoint, damage, isHead);
          const result = this.enemyAI.damageEnemy(bot.id, damage, isHead);
          this.spawnHitSparks(hitPoint, isHead ? 0xff0000 : 0xf59e0b, 16);
          this.spawnTracer(muzzlePos, hitPoint);

          if (result.killed) {
            this.kills++;
            this.callbacks.onKillNotification({
              id: `${Date.now()}-${bot.id}`,
              killer: 'You',
              victim: bot.name,
              isHeadshot: isHead,
              weapon: weapon.name,
              timestamp: Date.now(),
            });

            const remainingEnemies = this.enemyAI.enemies.filter((b) => b.isAlive);
            if (remainingEnemies.length === 0) {
              this.status = 'VICTORY';
              soundManager.playVictorySound();
              this.callbacks.onGameStatusChange('VICTORY');
            }
          }

          this.broadcastStats();
          return;
        }
      }
    }

    // ------------------------------------------------------------------------
    // 3. World Impact (Hit cover/wall/ground or air)
    // ------------------------------------------------------------------------
    const worldHits = _raycaster.intersectObjects(this.world.shootableMeshes, false);
    let hitPoint: THREE.Vector3;
    if (worldHits.length > 0) {
      hitPoint = worldHits[0].point;
      this.spawnHitSparks(hitPoint, 0xffe066, 8);
    } else {
      hitPoint = cameraRay.origin.clone().add(cameraRay.direction.clone().multiplyScalar(weapon.range));
    }

    this.spawnTracer(muzzlePos, hitPoint);
    this.broadcastStats();
  }

  /**
   * Spawn Bullet Tracer line
   */
  private spawnTracer(from: THREE.Vector3, to: THREE.Vector3) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffea00,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ mesh: line, life: 0.08 });
  }

  /**
   * Spawn spark particles on impact
   */
  private spawnHitSparks(pos: THREE.Vector3, color: number, count: number) {
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 1,
          (Math.random() - 0.5) * 6
        )
      );
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMat = new THREE.PointsMaterial({
      color,
      size: 0.12,
      transparent: true,
      opacity: 1,
    });

    const pMesh = new THREE.Points(pGeo, pMat);
    this.scene.add(pMesh);
    this.sparks.push({ mesh: pMesh, velocities, life: 0.35 });
  }

  /**
   * Spawn Floating Damage Number (Projected to 2D screen coordinates)
   */
  private spawnDamageNumber(worldPos: THREE.Vector3, damage: number, isHeadshot: boolean) {
    const screenPos = worldPos.clone().project(this.camera);
    const x = ((screenPos.x + 1) * this.container.clientWidth) / 2;
    const y = ((-screenPos.y + 1) * this.container.clientHeight) / 2;

    this.callbacks.onDamageNumber({
      id: `${Date.now()}-${Math.random()}`,
      text: `${damage}`,
      x,
      y,
      isHeadshot,
      opacity: 1,
    });
  }

  /**
   * Update Enemy AI and handle enemy incoming shots at player
   */
  private updateEnemyAI(dt: number) {
    this.enemyAI.update(dt, this.playerPos, (bot: EnemyBot, hitPlayer: boolean) => {
      // Enemy fired bullet tracer towards player
      const botMuzzle = bot.character.getMuzzlePosition();
      const targetPoint = hitPlayer
        ? this.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0))
        : this.playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 1.0, (Math.random() - 0.5) * 4));

      this.spawnTracer(botMuzzle, targetPoint);

      if (hitPlayer && this.health > 0) {
        const damage = Math.floor(12 + Math.random() * 8); // Balanced incoming damage
        this.health = Math.max(0, this.health - damage);
        soundManager.playPlayerHurtSound();
        this.broadcastStats();

        if (this.health <= 0) {
          this.status = 'DEFEAT';
          soundManager.playDefeatSound();
          this.callbacks.onGameStatusChange('DEFEAT');
        }
      }
    });

    // Throttled update of minimap entities for radar (~8 Hz eliminates 50 React re-renders/sec)
    this.minimapTimer += dt;
    if (this.minimapTimer >= 0.12) {
      this.minimapTimer = 0;
      const entities: MinimapEntity[] = [
        {
          id: 'player',
          x: this.playerPos.x,
          z: this.playerPos.z,
          type: 'player',
          heading: this.playerYaw,
        },
      ];

      for (const bot of this.enemyAI.enemies) {
        if (bot.isAlive) {
          entities.push({
            id: `bot-${bot.id}`,
            x: bot.position.x,
            z: bot.position.z,
            type: 'enemy',
            heading: bot.character.root.rotation.y,
            isShooting: bot.state === 'ATTACK',
          });
        }
      }

      this.callbacks.onMinimapUpdate(entities, this.playerYaw);
    }
  }

  /**
   * Update particle lifetimes and tracers
   */
  private updateParticles(dt: number) {
    // Tracers decay
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        (t.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      }
    }

    // Sparks decay
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
      } else {
        const posAttr = s.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        for (let j = 0; j < s.velocities.length; j++) {
          s.velocities[j].y -= 9.8 * dt; // spark gravity
          array[j * 3] += s.velocities[j].x * dt;
          array[j * 3 + 1] += s.velocities[j].y * dt;
          array[j * 3 + 2] += s.velocities[j].z * dt;
        }
        posAttr.needsUpdate = true;
        (s.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, s.life / 0.35);
      }
    }
  }

  /**
   * Broadcast player stats to React UI
   */
  private broadcastStats() {
    this.callbacks.onStatsUpdate({
      health: this.health,
      maxHealth: this.maxHealth,
      shield: this.shield,
      maxShield: this.maxShield,
      currentWeaponIndex: this.currentWeaponIndex,
      ammoInMag: this.ammoInMag,
      ammoReserve: this.ammoReserve,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading ? 1 - this.reloadTimer / WEAPONS[this.currentWeaponIndex].reloadTime : 0,
      isAiming: this.isAiming,
      isCrouching: this.isCrouching,
      isSprinting: this.isSprinting,
      isGrounded: this.isGrounded,
      kills: this.kills,
      headshots: this.headshots,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
    });
  }

  /**
   * Clean up WebGL resources
   */
  public dispose() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
