/**
 * FreeFire 3D Battle Royale - Core Game Types
 */

export type GameStatus = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'DEFEAT';

export interface WeaponDef {
  id: string;
  name: string;
  type: 'AR' | 'SMG' | 'SHOTGUN';
  damageBody: number;      // 35 damage for body shots
  damageHead: number;      // 100 damage for headshots
  fireRate: number;        // shots per second
  magazineSize: number;
  reloadTime: number;      // seconds
  range: number;
  spread: number;          // spread angle in radians
  aimSpreadMultiplier: number;
  recoilPitch: number;     // camera kick
  modelColor: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  currentWeaponIndex: number;
  ammoInMag: number;
  ammoReserve: number;
  isReloading: boolean;
  reloadProgress: number;  // 0 to 1
  isAiming: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  isGrounded: boolean;
  kills: number;
  headshots: number;
  shotsFired: number;
  shotsHit: number;
}

export interface EnemyStats {
  id: number;
  name: string;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  state: 'PATROL' | 'ALERT' | 'ATTACK' | 'COVER' | 'DEAD';
  position: { x: number; y: number; z: number };
}

export interface DamageNumber {
  id: string;
  text: string;
  x: number;
  y: number;
  isHeadshot: boolean;
  opacity: number;
}

export interface KillNotification {
  id: string;
  killer: string;
  victim: string;
  isHeadshot: boolean;
  weapon: string;
  timestamp: number;
}

export interface MinimapEntity {
  id: string;
  x: number;
  z: number;
  type: 'player' | 'enemy' | 'crate';
  heading: number;
  isShooting?: boolean;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  perk: string;
  perkDescription: string;
  vestColor: number;
  helmetColor: number;
  pantsColor?: number;
  skinColor: number;
  accentColor: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
  isCustom?: boolean;
}

export interface GameSettings {
  quality: GraphicsQuality;
  sensitivity: number;
  sfxVolume: number;
  musicVolume: number;
  invertY: boolean;
  autoHeadshot: boolean;
}

