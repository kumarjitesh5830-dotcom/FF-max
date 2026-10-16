/**
 * Procedural Stylized Humanoid 3D Character
 * Realistic combatant model with tactical vest, helmet, arms, legs, boots,
 * assault rifle, muzzle flash, separate head hitbox, and full skeletal-like kinematics.
 * NEVER uses a cube or placeholder box!
 */

import * as THREE from 'three';
import { getGameTextures } from './textures';

export interface HumanoidConfig {
  isPlayer: boolean;
  name: string;
  camoTexture?: THREE.CanvasTexture;
  shirtColor?: number;
  pantsColor?: number;
  skinColor?: number;
  vestColor?: number;
  helmetColor?: number;
}

export class HumanoidCharacter {
  public root: THREE.Group;
  public headGroup: THREE.Group;
  public torsoGroup: THREE.Group;
  public pelvisGroup: THREE.Group;
  public leftArmGroup: THREE.Group;
  public rightArmGroup: THREE.Group;
  public leftForearmGroup: THREE.Group;
  public rightForearmGroup: THREE.Group;
  public leftLegGroup: THREE.Group;
  public rightLegGroup: THREE.Group;
  public leftShinGroup: THREE.Group;
  public rightShinGroup: THREE.Group;
  public weaponMesh: THREE.Group;
  public muzzleFlashLight: THREE.PointLight;
  public muzzleFlashMesh: THREE.Mesh;
  public muzzleWorldPos: THREE.Vector3 = new THREE.Vector3();

  // Hitboxes
  public headHitbox: THREE.Mesh;
  public bodyHitbox: THREE.Mesh;

  // Materials for dynamic outfit changing
  public skinMat: THREE.MeshStandardMaterial;
  public gearMat: THREE.MeshStandardMaterial;
  public helmetMat: THREE.MeshStandardMaterial;
  public vestMat: THREE.MeshStandardMaterial;

  public config: HumanoidConfig;
  private animTimer: number = 0;
  private recoilTimer: number = 0;
  private muzzleTimer: number = 0;
  private deathProgress: number = 0;

  constructor(config: HumanoidConfig) {
    this.config = config;
    this.root = new THREE.Group();
    this.root.name = config.name;

    const textures = getGameTextures();
    const camoTex = config.camoTexture || (config.isPlayer ? textures.camoPlayer : textures.camoEnemy);

    // Color definitions
    this.skinMat = new THREE.MeshStandardMaterial({
      color: config.skinColor ?? 0xd4a373,
      roughness: 0.65,
      metalness: 0.1,
    });
    const skinMat = this.skinMat;

    this.vestMat = new THREE.MeshStandardMaterial({
      map: camoTex,
      roughness: 0.7,
      metalness: 0.2,
    });
    const vestMat = this.vestMat;

    const pantsMat = new THREE.MeshStandardMaterial({
      map: camoTex,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.gearMat = new THREE.MeshStandardMaterial({
      color: config.vestColor ?? (config.isPlayer ? 0x1e293b : 0x332b1f),
      roughness: 0.6,
      metalness: 0.3,
    });
    const gearMat = this.gearMat;

    this.helmetMat = new THREE.MeshStandardMaterial({
      color: config.helmetColor ?? (config.isPlayer ? 0x0f172a : 0x423828),
      roughness: 0.4,
      metalness: 0.5,
    });
    const helmetMat = this.helmetMat;

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.9,
    });

    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
      metalness: 0.2,
    });

    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.8,
    });

    const gunAccentMat = new THREE.MeshStandardMaterial({
      color: config.isPlayer ? 0xeab308 : 0xd97706,
      roughness: 0.4,
      metalness: 0.7,
    });

    // ------------------------------------------------------------------------
    // 1. Pelvis / Hips (Center pivot at Y = 1.05m)
    // ------------------------------------------------------------------------
    this.pelvisGroup = new THREE.Group();
    this.pelvisGroup.position.set(0, 1.05, 0);
    this.root.add(this.pelvisGroup);

    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.22, 12);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvisMesh.castShadow = true;
    this.pelvisGroup.add(pelvisMesh);

    // Tactical Utility Belt & Buckle
    const beltGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12);
    const beltMesh = new THREE.Mesh(beltGeo, gearMat);
    beltMesh.position.y = 0.08;
    this.pelvisGroup.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.08, 0.06, 0.04);
    const buckleMesh = new THREE.Mesh(buckleGeo, gunAccentMat);
    buckleMesh.position.set(0, 0.08, 0.24);
    this.pelvisGroup.add(buckleMesh);

    // Side Holster
    const holsterGeo = new THREE.BoxGeometry(0.1, 0.16, 0.08);
    const holsterMesh = new THREE.Mesh(holsterGeo, gearMat);
    holsterMesh.position.set(0.26, -0.05, 0);
    this.pelvisGroup.add(holsterMesh);

    // ------------------------------------------------------------------------
    // 2. Torso (Spine + Chest + Tactical Vest + Pouches)
    // ------------------------------------------------------------------------
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.14, 0);
    this.pelvisGroup.add(this.torsoGroup);

    // Chest Body (tapered V-shape)
    const chestGeo = new THREE.CylinderGeometry(0.28, 0.23, 0.46, 12);
    const chestMesh = new THREE.Mesh(chestGeo, vestMat);
    chestMesh.position.set(0, 0.23, 0);
    chestMesh.castShadow = true;
    this.torsoGroup.add(chestMesh);

    // Tactical Bulletproof Vest Layer
    const vestPlateGeo = new THREE.BoxGeometry(0.42, 0.36, 0.32);
    const vestPlateMesh = new THREE.Mesh(vestPlateGeo, gearMat);
    vestPlateMesh.position.set(0, 0.24, 0.02);
    vestPlateMesh.castShadow = true;
    this.torsoGroup.add(vestPlateMesh);

    // Ammo Pouches on chest
    for (let i = -1; i <= 1; i++) {
      const pouchGeo = new THREE.BoxGeometry(0.08, 0.12, 0.06);
      const pouchMesh = new THREE.Mesh(pouchGeo, gearMat);
      pouchMesh.position.set(i * 0.11, 0.2, 0.19);
      this.torsoGroup.add(pouchMesh);
    }

    // Radio transmitter & antenna on shoulder
    const radioGeo = new THREE.BoxGeometry(0.07, 0.1, 0.05);
    const radioMesh = new THREE.Mesh(radioGeo, gunMat);
    radioMesh.position.set(-0.16, 0.42, 0.08);
    this.torsoGroup.add(radioMesh);

    const antGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.22, 6);
    const antMesh = new THREE.Mesh(antGeo, gunMat);
    antMesh.position.set(-0.16, 0.54, 0.08);
    this.torsoGroup.add(antMesh);

    // ------------------------------------------------------------------------
    // 3. Head (Neck, Face, Helmet, Visor, Tactical Bandana/Mask)
    // ------------------------------------------------------------------------
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.48, 0);
    this.torsoGroup.add(this.headGroup);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.1, 10);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 0.04, 0);
    this.headGroup.add(neckMesh);

    // Head base
    const headGeo = new THREE.SphereGeometry(0.18, 14, 14);
    headGeo.scale(0.95, 1.15, 1.05);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.18, 0);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Tactical Combat Helmet
    const helmetGeo = new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    helmetGeo.scale(1.05, 1.05, 1.1);
    const helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
    helmetMesh.position.set(0, 0.22, 0);
    helmetMesh.castShadow = true;
    this.headGroup.add(helmetMesh);

    // Tactical Visor / Goggles
    const visorGeo = new THREE.BoxGeometry(0.28, 0.08, 0.12);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.2, 0.15);
    this.headGroup.add(visorMesh);

    // Tactical Face Mask / Bandana
    const maskGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.14, 10);
    const maskMesh = new THREE.Mesh(maskGeo, gearMat);
    maskMesh.position.set(0, 0.1, 0.06);
    this.headGroup.add(maskMesh);

    // ------------------------------------------------------------------------
    // HEAD HITBOX: Attached to headGroup so it moves exactly with the head!
    // ------------------------------------------------------------------------
    const headHitboxGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
    this.headHitbox = new THREE.Mesh(headHitboxGeo, hitboxMat);
    this.headHitbox.position.set(0, 0.18, 0);
    this.headHitbox.userData = {
      isHitbox: true,
      isHead: true,
      owner: this,
    };
    this.headGroup.add(this.headHitbox);

    // ------------------------------------------------------------------------
    // BODY HITBOX: Attached to torsoGroup for accurate body collisions
    // ------------------------------------------------------------------------
    const bodyHitboxGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.4, 8);
    this.bodyHitbox = new THREE.Mesh(bodyHitboxGeo, hitboxMat);
    this.bodyHitbox.position.set(0, -0.2, 0);
    this.bodyHitbox.userData = {
      isHitbox: true,
      isHead: false,
      owner: this,
    };
    this.torsoGroup.add(this.bodyHitbox);

    // ------------------------------------------------------------------------
    // 4. Arms & Forearms & Hands
    // ------------------------------------------------------------------------
    // Left Shoulder & Upper Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.32, 0.4, 0);
    this.torsoGroup.add(this.leftArmGroup);

    const shoulderPadGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const leftPadMesh = new THREE.Mesh(shoulderPadGeo, gearMat);
    this.leftArmGroup.add(leftPadMesh);

    const upperArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.28, 8);
    upperArmGeo.translate(0, -0.14, 0);
    const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, vestMat);
    leftUpperArmMesh.castShadow = true;
    this.leftArmGroup.add(leftUpperArmMesh);

    // Left Forearm
    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.28, 0);
    this.leftArmGroup.add(this.leftForearmGroup);

    const forearmGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.26, 8);
    forearmGeo.translate(0, -0.13, 0);
    const leftForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    leftForearmMesh.castShadow = true;
    this.leftForearmGroup.add(leftForearmMesh);

    const gloveGeo = new THREE.BoxGeometry(0.09, 0.1, 0.07);
    gloveGeo.translate(0, -0.24, 0);
    const leftGloveMesh = new THREE.Mesh(gloveGeo, gearMat);
    this.leftForearmGroup.add(leftGloveMesh);

    // Right Shoulder & Upper Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.32, 0.4, 0);
    this.torsoGroup.add(this.rightArmGroup);

    const rightPadMesh = new THREE.Mesh(shoulderPadGeo, gearMat);
    this.rightArmGroup.add(rightPadMesh);

    const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, vestMat);
    rightUpperArmMesh.castShadow = true;
    this.rightArmGroup.add(rightUpperArmMesh);

    // Right Forearm
    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.28, 0);
    this.rightArmGroup.add(this.rightForearmGroup);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    rightForearmMesh.castShadow = true;
    this.rightForearmGroup.add(rightForearmMesh);

    const rightGloveMesh = new THREE.Mesh(gloveGeo, gearMat);
    this.rightForearmGroup.add(rightGloveMesh);

    // ------------------------------------------------------------------------
    // 5. Tactical Weapon (Assault Rifle with Stock, Magazine, Barrel, Scope, Muzzle)
    // Correctly mounted on right hand pointing forward into battlefield
    // ------------------------------------------------------------------------
    this.weaponMesh = new THREE.Group();
    // Weapon attached to right forearm / hand - rotated so barrel points forward into battlefield
    this.rightForearmGroup.add(this.weaponMesh);
    this.weaponMesh.position.set(0, -0.22, 0.04);
    this.weaponMesh.rotation.set(-Math.PI * 0.5, 0, 0);

    // Rifle Receiver
    const recGeo = new THREE.BoxGeometry(0.08, 0.12, 0.5);
    const recMesh = new THREE.Mesh(recGeo, gunMat);
    recMesh.castShadow = true;
    this.weaponMesh.add(recMesh);

    // Tactical Pistol Grip held inside right hand glove
    const gripGeo = new THREE.BoxGeometry(0.045, 0.14, 0.06);
    gripGeo.rotateX(0.2);
    const gripMesh = new THREE.Mesh(gripGeo, gunMat);
    gripMesh.position.set(0, -0.09, -0.06);
    this.weaponMesh.add(gripMesh);

    // Front Tactical Handguard (held by left hand)
    const handguardGeo = new THREE.BoxGeometry(0.06, 0.08, 0.22);
    const handguardMesh = new THREE.Mesh(handguardGeo, gunAccentMat);
    handguardMesh.position.set(0, 0.01, 0.22);
    this.weaponMesh.add(handguardMesh);

    // Rifle Stock
    const stockGeo = new THREE.BoxGeometry(0.07, 0.1, 0.22);
    const stockMesh = new THREE.Mesh(stockGeo, gunMat);
    stockMesh.position.set(0, -0.02, -0.32);
    this.weaponMesh.add(stockMesh);

    // Curved Banana Magazine
    const magGeo = new THREE.BoxGeometry(0.05, 0.2, 0.12);
    const magMesh = new THREE.Mesh(magGeo, gunAccentMat);
    magMesh.position.set(0, -0.12, 0.05);
    magMesh.rotation.x = -0.2;
    this.weaponMesh.add(magMesh);

    // Long Barrel + Flash Hider
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.022, 0.4, 8);
    barrelGeo.rotateX(Math.PI * 0.5);
    const barrelMesh = new THREE.Mesh(barrelGeo, gunMat);
    barrelMesh.position.set(0, 0.02, 0.42);
    this.weaponMesh.add(barrelMesh);

    // Red Dot / Holographic Sight
    const sightGeo = new THREE.BoxGeometry(0.05, 0.06, 0.12);
    const sightMesh = new THREE.Mesh(sightGeo, gunMat);
    sightMesh.position.set(0, 0.09, 0.02);
    this.weaponMesh.add(sightMesh);

    const lensGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8);
    lensGeo.rotateX(Math.PI * 0.5);
    const lensMesh = new THREE.Mesh(lensGeo, visorMat);
    lensMesh.position.set(0, 0.1, 0.07);
    this.weaponMesh.add(lensMesh);

    // Muzzle Flash
    const flashGeo = new THREE.ConeGeometry(0.12, 0.35, 6);
    flashGeo.rotateX(Math.PI * 0.5);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0,
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0, 0.02, 0.72);
    this.weaponMesh.add(this.muzzleFlashMesh);

    this.muzzleFlashLight = new THREE.PointLight(0xffaa00, 0, 8);
    this.muzzleFlashLight.position.set(0, 0.02, 0.72);
    this.weaponMesh.add(this.muzzleFlashLight);

    // ------------------------------------------------------------------------
    // 6. Legs, Thighs, Knees, Shin Guards & Boots
    // ------------------------------------------------------------------------
    // Left Leg Group
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.16, -0.06, 0);
    this.pelvisGroup.add(this.leftLegGroup);

    const thighGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.45, 10);
    thighGeo.translate(0, -0.22, 0);
    const leftThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    leftThighMesh.castShadow = true;
    this.leftLegGroup.add(leftThighMesh);

    // Left Knee & Shin
    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.set(0, -0.45, 0);
    this.leftLegGroup.add(this.leftShinGroup);

    // Knee pad
    const kneePadGeo = new THREE.BoxGeometry(0.12, 0.12, 0.08);
    const leftKneeMesh = new THREE.Mesh(kneePadGeo, gearMat);
    leftKneeMesh.position.set(0, 0, 0.07);
    this.leftShinGroup.add(leftKneeMesh);

    const shinGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.45, 10);
    shinGeo.translate(0, -0.22, 0);
    const leftShinMesh = new THREE.Mesh(shinGeo, pantsMat);
    leftShinMesh.castShadow = true;
    this.leftShinGroup.add(leftShinMesh);

    // Tactical Boot
    const bootGeo = new THREE.BoxGeometry(0.13, 0.14, 0.24);
    bootGeo.translate(0, -0.44, 0.04);
    const leftBootMesh = new THREE.Mesh(bootGeo, bootMat);
    leftBootMesh.castShadow = true;
    this.leftShinGroup.add(leftBootMesh);

    // Right Leg Group
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.16, -0.06, 0);
    this.pelvisGroup.add(this.rightLegGroup);

    const rightThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    rightThighMesh.castShadow = true;
    this.rightLegGroup.add(rightThighMesh);

    // Right Knee & Shin
    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.set(0, -0.45, 0);
    this.rightLegGroup.add(this.rightShinGroup);

    const rightKneeMesh = new THREE.Mesh(kneePadGeo, gearMat);
    rightKneeMesh.position.set(0, 0, 0.07);
    this.rightShinGroup.add(rightKneeMesh);

    const rightShinMesh = new THREE.Mesh(shinGeo, pantsMat);
    rightShinMesh.castShadow = true;
    this.rightShinGroup.add(rightShinMesh);

    const rightBootMesh = new THREE.Mesh(bootGeo, bootMat);
    rightBootMesh.castShadow = true;
    this.rightShinGroup.add(rightBootMesh);

    // Default pose setup
    this.resetPose();
  }

  public resetPose() {
    this.leftArmGroup.rotation.set(-1.05, 0.38, 0.2);
    this.leftForearmGroup.rotation.set(-0.65, -0.3, 0.12);

    this.rightArmGroup.rotation.set(-1.22, -0.16, -0.06);
    this.rightForearmGroup.rotation.set(-0.24, 0.1, 0);

    this.leftLegGroup.rotation.set(0, 0, 0);
    this.rightLegGroup.rotation.set(0, 0, 0);
    this.leftShinGroup.rotation.set(0, 0, 0);
    this.rightShinGroup.rotation.set(0, 0, 0);
  }

  /**
   * Trigger muzzle flash effect and weapon kick
   */
  public triggerMuzzleFlash() {
    this.muzzleTimer = 0.08;
    this.recoilTimer = 0.12;
    (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
    this.muzzleFlashLight.intensity = 4;
  }

  /**
   * Get the world position of the weapon muzzle for raycasting tracers
   */
  public getMuzzlePosition(): THREE.Vector3 {
    this.muzzleFlashMesh.getWorldPosition(this.muzzleWorldPos);
    return this.muzzleWorldPos;
  }

  /**
   * Dynamically update character outfit colors for selected operative
   */
  public applyCharacterOutfit(vestColor?: number, helmetColor?: number, skinColor?: number) {
    if (vestColor !== undefined) {
      this.gearMat.color.setHex(vestColor);
    }
    if (helmetColor !== undefined) {
      this.helmetMat.color.setHex(helmetColor);
    }
    if (skinColor !== undefined) {
      this.skinMat.color.setHex(skinColor);
    }
  }

  /**
   * Smooth Kinematic Skeletal Animation
   */
  public updateAnimation(
    speed: number,
    isGrounded: boolean,
    isAiming: boolean,
    isShooting: boolean,
    isCrouching: boolean,
    isDead: boolean,
    dt: number,
    pitch: number = 0
  ) {
    // 1. Muzzle flash decay
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      if (this.muzzleTimer <= 0) {
        (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // 2. Weapon recoil recovery
    let recoilKick = 0;
    if (this.recoilTimer > 0) {
      this.recoilTimer -= dt;
      const kick = Math.max(0, this.recoilTimer / 0.12);
      this.weaponMesh.position.z = 0.08 - kick * 0.08;
      recoilKick = kick * 0.1;
    } else {
      this.weaponMesh.position.z = 0.08;
    }

    // 3. Death Animation (Realistic ragdoll-like collapse)
    if (isDead) {
      this.deathProgress = Math.min(1, this.deathProgress + dt * 2.8);
      const ease = 1 - Math.cos((this.deathProgress * Math.PI) / 2);
      this.root.rotation.x = -Math.PI * 0.48 * ease;
      this.root.position.y = -0.92 * ease;
      this.headGroup.rotation.x = 0.45 * ease;
      this.leftArmGroup.rotation.z = 0.9 * ease;
      this.rightArmGroup.rotation.z = -0.9 * ease;
      this.leftLegGroup.rotation.x = -0.2 * ease;
      this.rightLegGroup.rotation.x = 0.3 * ease;
      return;
    }

    const isRunning = speed > 5.0;
    const isMoving = speed > 0.1;
    this.animTimer += dt * (isRunning ? speed * 3.2 : isMoving ? speed * 2.8 : 2.0);

    // 4. Crouch stance adjustment
    const targetPelvisY = isCrouching ? 0.75 : 1.05;
    this.pelvisGroup.position.y = THREE.MathUtils.damp(this.pelvisGroup.position.y, targetPelvisY, 10, dt);

    // 5. Airborne Jump posture
    if (!isGrounded) {
      this.leftLegGroup.rotation.x = -0.4;
      this.leftShinGroup.rotation.x = 0.6;
      this.rightLegGroup.rotation.x = 0.3;
      this.rightShinGroup.rotation.x = 0.8;
      this.leftArmGroup.rotation.x = -0.8;
      this.rightArmGroup.rotation.x = -1.1;
      return;
    }

    // Pitch tilt: upper torso tilts so weapon and head aim directly at crosshair
    const pitchTilt = -pitch * 0.82;
    const pitchArm = -pitch * 0.35;

    // 6. Running / Walking Gait cycle
    if (isMoving) {
      const stride = Math.sin(this.animTimer);
      const legAmp = Math.min(1.05, speed * 0.17);

      this.leftLegGroup.rotation.x = stride * legAmp;
      this.rightLegGroup.rotation.x = -stride * legAmp;

      // Realistic knee flexion when swinging forward
      this.leftShinGroup.rotation.x = stride > 0 ? stride * legAmp * 0.85 : 0.05;
      this.rightShinGroup.rotation.x = -stride > 0 ? -stride * legAmp * 0.85 : 0.05;

      // Forward athletic lean when running + pitch tilt
      const forwardLean = isRunning ? 0.16 : 0.06;
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(
        this.torsoGroup.rotation.x,
        forwardLean + pitchTilt - recoilKick,
        12,
        dt
      );

      // Bobbing hips
      this.pelvisGroup.position.y = targetPelvisY + Math.abs(Math.cos(this.animTimer)) * (isRunning ? 0.06 : 0.03);
    } else {
      // Idle breathing + pitch tilt
      const breath = Math.sin(this.animTimer * 1.5) * 0.015;
      this.pelvisGroup.position.y = targetPelvisY + breath;
      this.torsoGroup.rotation.z = Math.sin(this.animTimer * 0.8) * 0.01;
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(
        this.torsoGroup.rotation.x,
        pitchTilt - recoilKick,
        12,
        dt
      );

      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0, 8, dt);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0, 8, dt);
      this.leftShinGroup.rotation.x = THREE.MathUtils.damp(this.leftShinGroup.rotation.x, 0, 8, dt);
      this.rightShinGroup.rotation.x = THREE.MathUtils.damp(this.rightShinGroup.rotation.x, 0, 8, dt);
    }

    // 7. Aiming & Arm Stance - Barrel points straight forward into crosshair
    if (isAiming) {
      // Tighter ADS posture, gun brought directly before eyes aligned with crosshair
      this.rightArmGroup.rotation.set(-1.42 + pitchArm, -0.12, -0.04);
      this.rightForearmGroup.rotation.set(-0.16, 0.08, 0);
      this.leftArmGroup.rotation.set(-1.25 + pitchArm, 0.44, 0.22);
      this.leftForearmGroup.rotation.set(-0.7, -0.32, 0.12);
    } else if (isRunning) {
      // Tactical sprint carry
      const armSwing = Math.sin(this.animTimer) * 0.28;
      this.rightArmGroup.rotation.set(-1.0 + armSwing * 0.15 + pitchArm * 0.5, -0.16, -0.06);
      this.rightForearmGroup.rotation.set(-0.28, 0.08, 0);
      this.leftArmGroup.rotation.set(-0.7 - armSwing * 0.5 + pitchArm * 0.5, 0.32, 0.18);
      this.leftForearmGroup.rotation.set(-0.55, -0.22, 0.1);
    } else {
      // Tactical ready low-ready / hip-fire posture, barrel pointing forward into battlefield
      this.rightArmGroup.rotation.set(-1.22 + pitchArm, -0.16, -0.06);
      this.rightForearmGroup.rotation.set(-0.24, 0.1, 0);
      this.leftArmGroup.rotation.set(-1.05 + pitchArm, 0.38, 0.2);
      this.leftForearmGroup.rotation.set(-0.65, -0.3, 0.12);
    }
  }
}

