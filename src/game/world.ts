/**
 * Outpost Battleground Map Generator for FreeFire 3D
 * Multi-level military building, hangars, shipping containers, sandbags, crates, barrels,
 * palm trees, and perimeter natural cliff barriers with collision meshes.
 */

import * as THREE from 'three';
import { getGameTextures } from './textures';

export interface ObstacleCollider {
  box: THREE.Box3;
  type: 'building' | 'container' | 'sandbag' | 'crate' | 'rock';
}

export class GameWorld {
  public scene: THREE.Scene;
  public colliders: ObstacleCollider[] = [];
  public shootableMeshes: THREE.Object3D[] = [];
  public playerSpawnPos = new THREE.Vector3(0, 0, 18);
  public enemySpawnPositions = [
    new THREE.Vector3(-14, 0, -12),
    new THREE.Vector3(15, 0, -10),
    new THREE.Vector3(0, 0, -22),
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildMap();
  }

  private buildMap() {
    const textures = getGameTextures();

    // 1. Terrain Ground Plane
    const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    groundGeo.rotateX(-Math.PI * 0.5);
    const groundMat = new THREE.MeshStandardMaterial({
      map: textures.ground,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    groundMesh.name = 'Ground';
    this.scene.add(groundMesh);
    this.shootableMeshes.push(groundMesh);

    // 2. Central Military Command Outpost Building
    this.buildOutpostBuilding(textures);

    // 3. Shipping Containers (Tactical maze & cover)
    this.buildContainers(textures);

    // 4. Sandbag Fortifications
    this.buildSandbagBunkers(textures);

    // 5. Wooden Ammo Supply Crates & Barrels
    this.buildCratesAndBarrels(textures);

    // 6. Palm Trees & Vegetation
    this.buildVegetation(textures);

    // 7. Perimeter Natural Rock Cliffs (Clean battle royale boundary)
    this.buildPerimeterRocks();
  }

  /**
   * Two-Story Central Military Outpost Building with open doorway and walkable rooftop
   */
  private buildOutpostBuilding(textures: ReturnType<typeof getGameTextures>) {
    const outpostGroup = new THREE.Group();
    outpostGroup.position.set(0, 0, -4);

    const wallMat = new THREE.MeshStandardMaterial({
      map: textures.concreteWall,
      roughness: 0.85,
      metalness: 0.1,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.2,
    });

    // Ground Floor Slab
    const slabGeo = new THREE.BoxGeometry(16, 0.4, 12);
    const slabMesh = new THREE.Mesh(slabGeo, floorMat);
    slabMesh.position.y = 0.2;
    slabMesh.receiveShadow = true;
    outpostGroup.add(slabMesh);

    // Left Wall
    this.addWall(outpostGroup, 0.6, 4.2, 12, -7.7, 2.1, 0, wallMat);
    // Right Wall
    this.addWall(outpostGroup, 0.6, 4.2, 12, 7.7, 2.1, 0, wallMat);
    // Back Wall
    this.addWall(outpostGroup, 16, 4.2, 0.6, 0, 2.1, -5.7, wallMat);

    // Front Wall (with 2 doorway openings)
    this.addWall(outpostGroup, 5, 4.2, 0.6, -5.2, 2.1, 5.7, wallMat);
    this.addWall(outpostGroup, 5, 4.2, 0.6, 5.2, 2.1, 5.7, wallMat);
    // Lintel above doorway
    this.addWall(outpostGroup, 6, 1.2, 0.6, 0, 3.6, 5.7, wallMat);

    // 2nd Floor Roof Deck
    const roofDeckGeo = new THREE.BoxGeometry(16.4, 0.4, 12.4);
    const roofDeckMesh = new THREE.Mesh(roofDeckGeo, floorMat);
    roofDeckMesh.position.set(0, 4.2, 0);
    roofDeckMesh.receiveShadow = true;
    roofDeckMesh.castShadow = true;
    outpostGroup.add(roofDeckMesh);
    this.shootableMeshes.push(roofDeckMesh);

    // Rooftop Safety Parapets / Cover battlements
    this.addWall(outpostGroup, 16.4, 1.0, 0.4, 0, 4.7, 6.0, wallMat);
    this.addWall(outpostGroup, 16.4, 1.0, 0.4, 0, 4.7, -6.0, wallMat);
    this.addWall(outpostGroup, 0.4, 1.0, 12.0, -8.0, 4.7, 0, wallMat);
    this.addWall(outpostGroup, 0.4, 1.0, 12.0, 8.0, 4.7, 0, wallMat);

    // Wooden / Steel exterior access ramp to roof
    const rampGeo = new THREE.BoxGeometry(3.0, 0.3, 8.5);
    rampGeo.rotateX(0.48);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.set(9.2, 2.1, 1.5);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    outpostGroup.add(rampMesh);

    this.scene.add(outpostGroup);

    // Building primary collider box
    const buildingBox = new THREE.Box3(
      new THREE.Vector3(-8.5, 0, -10.5),
      new THREE.Vector3(8.5, 5, 2.5)
    );
    this.colliders.push({ box: buildingBox, type: 'building' });
  }

  private addWall(
    parent: THREE.Group,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material
  ) {
    const wallGeo = new THREE.BoxGeometry(w, h, d);
    const wall = new THREE.Mesh(wallGeo, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    parent.add(wall);
    this.shootableMeshes.push(wall);
  }

  /**
   * Colorful Corrugated Shipping Containers (High tactical value in Free Fire)
   */
  private buildContainers(textures: ReturnType<typeof getGameTextures>) {
    const containerLayouts = [
      { x: -16, z: 6, rot: 0.2, color: textures.containerRed },
      { x: -15, z: 12, rot: -0.15, color: textures.containerBlue },
      { x: 16, z: 8, rot: -0.3, color: textures.containerBlue },
      { x: 18, z: 2, rot: 0.1, color: textures.containerRed },
      { x: -18, z: -18, rot: 1.57, color: textures.containerRed },
      { x: 18, z: -18, rot: 1.4, color: textures.containerBlue },
    ];

    containerLayouts.forEach((c) => {
      const containerGroup = new THREE.Group();
      containerGroup.position.set(c.x, 0, c.z);
      containerGroup.rotation.y = c.rot;

      const geo = new THREE.BoxGeometry(6.2, 2.6, 2.6);
      const mat = new THREE.MeshStandardMaterial({
        map: c.color,
        roughness: 0.5,
        metalness: 0.7,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 1.3;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      containerGroup.add(mesh);

      // Frame corner castings
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.8 });
      for (const sx of [-3.05, 3.05]) {
        for (const sz of [-1.25, 1.25]) {
          const postGeo = new THREE.BoxGeometry(0.18, 2.6, 0.18);
          const postMesh = new THREE.Mesh(postGeo, edgeMat);
          postMesh.position.set(sx, 1.3, sz);
          containerGroup.add(postMesh);
        }
      }

      this.scene.add(containerGroup);
      this.shootableMeshes.push(mesh);

      // Collider
      const box = new THREE.Box3();
      box.setFromObject(containerGroup);
      this.colliders.push({ box, type: 'container' });
    });
  }

  /**
   * Sandbag Bunkers with firing slits
   */
  private buildSandbagBunkers(textures: ReturnType<typeof getGameTextures>) {
    const bunkerPositions = [
      { x: -5, z: 12, rot: 0.1 },
      { x: 5, z: 12, rot: -0.1 },
      { x: -10, z: -8, rot: 0.8 },
      { x: 10, z: -8, rot: -0.8 },
    ];

    bunkerPositions.forEach((pos) => {
      const bunkerGroup = new THREE.Group();
      bunkerGroup.position.set(pos.x, 0, pos.z);
      bunkerGroup.rotation.y = pos.rot;

      const sandbagMat = new THREE.MeshStandardMaterial({
        map: textures.sandbag,
        roughness: 0.95,
        metalness: 0.05,
      });

      // Stack rows of sandbags
      for (let layer = 0; layer < 3; layer++) {
        for (let i = -2; i <= 2; i++) {
          const bagGeo = new THREE.BoxGeometry(0.85, 0.32, 0.45);
          const bag = new THREE.Mesh(bagGeo, sandbagMat);
          bag.position.set(i * 0.75 + (layer % 2 === 0 ? 0 : 0.2), layer * 0.3 + 0.16, 0);
          bag.rotation.y = (Math.random() - 0.5) * 0.1;
          bag.castShadow = true;
          bag.receiveShadow = true;
          bunkerGroup.add(bag);
          this.shootableMeshes.push(bag);
        }
      }

      this.scene.add(bunkerGroup);

      const box = new THREE.Box3();
      box.setFromObject(bunkerGroup);
      this.colliders.push({ box, type: 'sandbag' });
    });
  }

  /**
   * Wooden Ammo Crates and Explosive Barrels
   */
  private buildCratesAndBarrels(textures: ReturnType<typeof getGameTextures>) {
    const crateMat = new THREE.MeshStandardMaterial({
      map: textures.woodCrate,
      roughness: 0.8,
      metalness: 0.1,
    });

    const barrelMat = new THREE.MeshStandardMaterial({
      map: textures.barrelRed,
      roughness: 0.4,
      metalness: 0.7,
    });

    const items = [
      { type: 'crate', x: -3, z: 4, scale: 1.2 },
      { type: 'crate', x: -3, z: 2.7, scale: 1.0 },
      { type: 'crate', x: 4, z: 3, scale: 1.2 },
      { type: 'barrel', x: 5.5, z: 3 },
      { type: 'barrel', x: -8, z: 14 },
      { type: 'crate', x: -9.5, z: 14, scale: 1.3 },
      { type: 'barrel', x: 8, z: 14 },
      { type: 'crate', x: 9.5, z: 14, scale: 1.1 },
      { type: 'barrel', x: -2, z: -14 },
      { type: 'crate', x: 2, z: -15, scale: 1.2 },
    ];

    items.forEach((item) => {
      if (item.type === 'crate') {
        const s = item.scale || 1;
        const crateGeo = new THREE.BoxGeometry(s, s, s);
        const crate = new THREE.Mesh(crateGeo, crateMat);
        crate.position.set(item.x, s * 0.5, item.z);
        crate.rotation.y = Math.random() * Math.PI;
        crate.castShadow = true;
        crate.receiveShadow = true;
        this.scene.add(crate);
        this.shootableMeshes.push(crate);

        const box = new THREE.Box3();
        box.setFromObject(crate);
        this.colliders.push({ box, type: 'crate' });
      } else {
        const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 14);
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(item.x, 0.6, item.z);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        this.scene.add(barrel);
        this.shootableMeshes.push(barrel);

        const box = new THREE.Box3();
        box.setFromObject(barrel);
        this.colliders.push({ box, type: 'crate' });
      }
    });
  }

  /**
   * Island Tropical Palm Trees & Desert Bushes
   */
  private buildVegetation(textures: ReturnType<typeof getGameTextures>) {
    const palmPositions = [
      { x: -22, z: 10 },
      { x: 22, z: 12 },
      { x: -24, z: -10 },
      { x: 24, z: -8 },
      { x: -10, z: 24 },
      { x: 12, z: 24 },
      { x: 0, z: 28 },
    ];

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.9,
      metalness: 0.1,
    });

    const leafMat = new THREE.MeshStandardMaterial({
      map: textures.palmLeaf,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    palmPositions.forEach((pos) => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, 0, pos.z);

      // Curved segmented trunk
      const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.3, 2.5, 0.2),
        new THREE.Vector3(0.7, 5.0, 0.5),
        new THREE.Vector3(0.5, 7.0, 0.8),
      ]);
      const trunkGeo = new THREE.TubeGeometry(trunkCurve, 12, 0.28, 8, false);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // Palm Crown fronds
      const crown = new THREE.Group();
      crown.position.set(0.5, 7.0, 0.8);
      for (let i = 0; i < 9; i++) {
        const frondAngle = (i / 9) * Math.PI * 2;
        const frondGeo = new THREE.PlaneGeometry(1.2, 3.4);
        frondGeo.translate(0, 1.7, 0);
        const frond = new THREE.Mesh(frondGeo, leafMat);
        frond.rotation.y = frondAngle;
        frond.rotation.x = 0.85 + Math.random() * 0.15;
        frond.castShadow = true;
        crown.add(frond);
      }
      tree.add(crown);

      this.scene.add(tree);
      this.shootableMeshes.push(trunk);

      // Trunk collider
      const box = new THREE.Box3(
        new THREE.Vector3(pos.x - 0.4, 0, pos.z - 0.4),
        new THREE.Vector3(pos.x + 0.4, 4, pos.z + 0.4)
      );
      this.colliders.push({ box, type: 'rock' });
    });
  }

  /**
   * Natural Barrier Rock Cliffs around the play perimeter
   * Seamlessly bounds the playzone without artificial boxing walls
   */
  private buildPerimeterRocks() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.9,
      metalness: 0.1,
    });

    const radius = 38;
    const numRocks = 32;

    for (let i = 0; i < numRocks; i++) {
      const angle = (i / numRocks) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const rockGeo = new THREE.DodecahedronGeometry(3.5 + Math.random() * 2.0, 1);
      rockGeo.scale(1.2, 1.6 + Math.random() * 0.8, 1.2);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, 2.5, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.shootableMeshes.push(rock);

      const box = new THREE.Box3();
      box.setFromObject(rock);
      this.colliders.push({ box, type: 'rock' });
    }
  }

  // Pre-allocated reusable resolve vector
  private _cachedResolve = new THREE.Vector3();

  /**
   * Collision check for player/enemy spheres against world bounding boxes (Zero GC)
   */
  public checkCollision(pos: THREE.Vector3, radius: number = 0.45): { collides: boolean; resolveVec: THREE.Vector3 } {
    this._cachedResolve.set(0, 0, 0);
    let collides = false;

    // Check bounds
    const maxDist = 34;
    const distSqFromCenter = pos.x * pos.x + pos.z * pos.z;
    if (distSqFromCenter > maxDist * maxDist) {
      const distFromCenter = Math.sqrt(distSqFromCenter) || 1;
      const push = distFromCenter - maxDist;
      this._cachedResolve.x -= (pos.x / distFromCenter) * push;
      this._cachedResolve.z -= (pos.z / distFromCenter) * push;
      collides = true;
    }

    // Check box colliders
    const collidersLen = this.colliders.length;
    for (let i = 0; i < collidersLen; i++) {
      const c = this.colliders[i];
      // Quick distance reject before computing closest points
      const centerX = (c.box.min.x + c.box.max.x) * 0.5;
      const centerZ = (c.box.min.z + c.box.max.z) * 0.5;
      const extentX = (c.box.max.x - c.box.min.x) * 0.5 + radius;
      const extentZ = (c.box.max.z - c.box.min.z) * 0.5 + radius;

      if (Math.abs(pos.x - centerX) > extentX || Math.abs(pos.z - centerZ) > extentZ) {
        continue;
      }

      const closestX = Math.max(c.box.min.x, Math.min(pos.x, c.box.max.x));
      const closestY = Math.max(c.box.min.y, Math.min(pos.y + 0.8, c.box.max.y));
      const closestZ = Math.max(c.box.min.z, Math.min(pos.z, c.box.max.z));

      const dx = pos.x - closestX;
      const dy = (pos.y + 0.8) - closestY;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius && Math.abs(dy) < 1.4) {
        collides = true;
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = radius - dist;
        this._cachedResolve.x += (dx / dist) * overlap;
        this._cachedResolve.z += (dz / dist) * overlap;
      }
    }

    return { collides, resolveVec: this._cachedResolve };
  }
}
