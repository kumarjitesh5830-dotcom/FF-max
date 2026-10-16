/**
 * Weapon specifications for FreeFire 3D
 * Enforces headshots deal 100 damage and body shots deal 35 damage!
 */

import { WeaponDef } from '../types/game';

export const WEAPONS: WeaponDef[] = [
  {
    id: 'scar',
    name: 'SCAR-L',
    type: 'AR',
    damageBody: 35,         // EXACT SPEC: 35 damage
    damageHead: 100,        // EXACT SPEC: 100 damage (One-shot headshot kill)
    fireRate: 8,            // 8 rounds per second
    magazineSize: 30,
    reloadTime: 1.8,
    range: 120,
    spread: 0.035,
    aimSpreadMultiplier: 0.25,
    recoilPitch: 0.02,
    modelColor: 0xd97706,
  },
  {
    id: 'mp40',
    name: 'MP40',
    type: 'SMG',
    damageBody: 35,         // Consistent spec
    damageHead: 100,
    fireRate: 14,           // High fire rate
    magazineSize: 32,
    reloadTime: 1.4,
    range: 65,
    spread: 0.055,
    aimSpreadMultiplier: 0.4,
    recoilPitch: 0.015,
    modelColor: 0x2563eb,
  },
  {
    id: 'awm',
    name: 'AWM Sniper',
    type: 'AR',
    damageBody: 75,
    damageHead: 100,
    fireRate: 1.2,
    magazineSize: 5,
    reloadTime: 2.5,
    range: 200,
    spread: 0.005,
    aimSpreadMultiplier: 0.05,
    recoilPitch: 0.08,
    modelColor: 0x16a34a,
  },
];
