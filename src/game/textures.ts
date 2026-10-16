/**
 * Procedural PBR Textures for FreeFire 3D
 * Generates all textures at runtime using HTML5 Canvas.
 * Guaranteed 100% availability, zero external assets, SRGBColorSpace compliant.
 */

import * as THREE from 'three';

export interface GameTextures {
  ground: THREE.CanvasTexture;
  camoPlayer: THREE.CanvasTexture;
  camoEnemy: THREE.CanvasTexture;
  containerRed: THREE.CanvasTexture;
  containerBlue: THREE.CanvasTexture;
  concreteWall: THREE.CanvasTexture;
  sandbag: THREE.CanvasTexture;
  woodCrate: THREE.CanvasTexture;
  barrelRed: THREE.CanvasTexture;
  palmLeaf: THREE.CanvasTexture;
}

let cachedTextures: GameTextures | null = null;

export function getGameTextures(): GameTextures {
  if (cachedTextures) return cachedTextures;

  cachedTextures = {
    ground: createGroundTexture(),
    camoPlayer: createCamoTexture(['#1b232c', '#2c3e50', '#181e24', '#475569']),
    camoEnemy: createCamoTexture(['#4a3f2d', '#7d6945', '#332b1f', '#8f7b58']),
    containerRed: createContainerTexture('#991b1b', '#7f1d1d'),
    containerBlue: createContainerTexture('#1e40af', '#172554'),
    concreteWall: createConcreteTexture(),
    sandbag: createSandbagTexture(),
    woodCrate: createWoodCrateTexture(),
    barrelRed: createBarrelTexture(),
    palmLeaf: createPalmLeafTexture(),
  };

  return cachedTextures;
}

/**
 * Procedural Island Ground Texture (Sandy dirt with military path & foliage motes)
 */
function createGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base warm desert/island soil
  ctx.fillStyle = '#c2a679';
  ctx.fillRect(0, 0, 512, 512);

  // Noise patches of dried dirt & weathered grass
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 10 + Math.random() * 35;
    const isGrass = Math.random() > 0.65;
    ctx.fillStyle = isGrass
      ? `rgba(${85 + Math.floor(Math.random() * 30)}, ${115 + Math.floor(Math.random() * 35)}, 60, ${0.15 + Math.random() * 0.25})`
      : `rgba(${165 + Math.floor(Math.random() * 30)}, ${135 + Math.floor(Math.random() * 25)}, 95, ${0.2 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine soil pebble grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Military Camouflage texture for tactical gear & uniforms
 */
function createCamoTexture(colors: string[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, 256, 256);

  // Paint irregular camouflage organic splatters
  for (let c = 1; c < colors.length; c++) {
    ctx.fillStyle = colors[c];
    for (let i = 0; i < 28; i++) {
      ctx.beginPath();
      let x = Math.random() * 256;
      let y = Math.random() * 256;
      ctx.moveTo(x, y);
      for (let p = 0; p < 6; p++) {
        x += (Math.random() - 0.5) * 45;
        y += (Math.random() - 0.5) * 45;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Corrugated metal shipping container texture
 */
function createContainerTexture(baseColor: string, darkColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  // Vertical corrugated ribs
  const ribWidth = 16;
  for (let x = 0; x < 256; x += ribWidth) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x, 0, 3, 256);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + 3, 0, 4, 256);
    ctx.fillStyle = darkColor;
    ctx.fillRect(x + 7, 0, ribWidth - 7, 256);
  }

  // Tactical stencil marking
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('FF-BR 09', 24, 60);

  // Yellow hazard stripes near base
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 230, 256, 26);
  ctx.clip();
  for (let i = -50; i < 300; i += 20) {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(i, 230, 10, 26);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(i + 10, 230, 10, 26);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Weathered concrete outpost bunker texture
 */
function createConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8f9296';
  ctx.fillRect(0, 0, 256, 256);

  // Horizontal concrete panel lines
  ctx.strokeStyle = '#55585c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();

  // Grime and noise
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Sandbag woven burlap texture
 */
function createSandbagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ab8b5c';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#8f6f43';
  for (let y = 0; y < 128; y += 4) {
    for (let x = 0; x < 128; x += 4) {
      if ((x + y) % 8 === 0) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Military wooden supply crate
 */
function createWoodCrateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Wood planks
  ctx.fillStyle = '#925c34';
  ctx.fillRect(0, 0, 256, 256);

  // Planks lines
  ctx.strokeStyle = '#53341b';
  ctx.lineWidth = 4;
  for (let y = 64; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Cross braces & border
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 242, 242);
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(242, 242);
  ctx.stroke();

  // Military ammo stencil
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('AMMO 7.62', 50, 140);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Red explosive fuel barrel
 */
function createBarrelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 256, 256);

  // Black metal rings
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 40, 256, 16);
  ctx.fillRect(0, 120, 256, 16);
  ctx.fillRect(0, 200, 256, 16);

  // Flammable icon stencil
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(128, 80, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('FLAM', 108, 86);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Stylized palm leaf texture
 */
function createPalmLeafTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(64, 128, 48, 120, 0, 0, Math.PI * 2);
  ctx.fill();

  // Central vein
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 10);
  ctx.lineTo(64, 250);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
