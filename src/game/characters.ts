/**
 * FreeFire 3D Operatives / Character Roster
 * Stylized humanoid combatant presets with unique appearances and tactical perks.
 */

import { CharacterDef } from '../types/game';

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'hayato',
    name: 'Hayato',
    title: 'Bushido Warrior',
    perk: 'Bushido Edge',
    perkDescription: 'Hardened armor penetration and quick recovery under fire.',
    vestColor: 0x1e293b,
    helmetColor: 0x0f172a,
    pantsColor: 0x1e293b,
    skinColor: 0xd4a373,
    accentColor: '#ef4444',
  },
  {
    id: 'kelly',
    name: 'Kelly',
    title: 'The Swift Sprinter',
    perk: 'Deadly Velocity',
    perkDescription: 'Increased sprinting acceleration and faster reload reflexes.',
    vestColor: 0xf59e0b,
    helmetColor: 0x27272a,
    pantsColor: 0x18181b,
    skinColor: 0xfcd34d,
    accentColor: '#f59e0b',
  },
  {
    id: 'alok',
    name: 'Alok',
    title: 'Sonic Commander',
    perk: 'Drop The Beat',
    perkDescription: 'Unleashes sonic rhythm that boosts combat morale and agility.',
    vestColor: 0x18181b,
    helmetColor: 0x09090b,
    pantsColor: 0x27272a,
    skinColor: 0xd4a373,
    accentColor: '#06b6d4',
  },
  {
    id: 'moco',
    name: 'Moco',
    title: 'Cyber Specialist',
    perk: 'Hacker Tag',
    perkDescription: 'Scans and tags targets on the radar with pinpoint precision.',
    vestColor: 0x14532d,
    helmetColor: 0x052e16,
    pantsColor: 0x1c1917,
    skinColor: 0xfcd34d,
    accentColor: '#22c55e',
  },
];
