/**
 * FreeFire MAX Style Title Screen
 * Animated tactical menu, Free Fire MAX style glowing buttons,
 * Operatives selection CTA, Music Studio Bhojpuri launcher, Settings modal,
 * weapon armory selector, and instant Play CTA.
 */

import React from 'react';
import {
  Play,
  Volume2,
  VolumeX,
  Crosshair,
  Target,
  Music,
  Settings,
  Users,
  Radio,
  Flame,
  Award,
} from 'lucide-react';
import { WEAPONS } from '../game/weapons';
import { CharacterDef } from '../types/game';

interface TitleScreenProps {
  onStart: () => void;
  selectedWeaponIndex: number;
  onSelectWeapon: (idx: number) => void;
  selectedCharacter: CharacterDef;
  onOpenCharacters: () => void;
  onOpenMusicStudio: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  currentMusicTitle?: string;
  isMusicPlaying?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  selectedWeaponIndex,
  onSelectWeapon,
  selectedCharacter,
  onOpenCharacters,
  onOpenMusicStudio,
  onOpenSettings,
  isMuted,
  onToggleMute,
  currentMusicTitle,
  isMusicPlaying,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-8 select-none bg-gradient-to-t from-black/90 via-black/45 to-transparent overflow-y-auto font-sans">
      {/* 1. TOP HEADER: Brand Logo & Navigation Hub */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Custom Game Logo Lockup (Free Fire MAX Style) */}
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)] border-2 border-amber-300">
            <Flame className="w-8 h-8 text-black fill-yellow-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 drop-shadow">
                FREE FIRE
              </span>
              <span className="px-2 py-0.5 text-[11px] font-black bg-gradient-to-r from-red-600 to-amber-500 text-black border border-amber-300 rounded font-mono uppercase tracking-widest shadow-md">
                MAX
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono tracking-wider">
              SURVIVOR ISLAND 3D · BATTLE ROYALE
            </p>
          </div>
        </div>

        {/* Top Action Tabs: Music Studio, Operatives, Settings, Audio */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Music Studio Button (Highlighted for Bhojpuri & Custom Songs) */}
          <button
            onClick={onOpenMusicStudio}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/80 text-amber-300 hover:text-white hover:bg-amber-500/30 transition active:scale-95 shadow-md flex items-center gap-2 text-xs font-bold"
          >
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>MUSIC STUDIO</span>
            {isMusicPlaying && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Operatives Roster Button */}
          <button
            onClick={onOpenCharacters}
            className="px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/90 text-zinc-200 hover:text-white transition active:scale-95 shadow-md flex items-center gap-2 text-xs font-bold"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>OPERATIVES</span>
            <span className="text-[10px] text-amber-400 font-mono">({selectedCharacter.name})</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/90 text-zinc-300 hover:text-white transition active:scale-95 shadow-md"
            title="Graphics & Sensitivity Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Audio Quick Mute */}
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/90 text-zinc-300 hover:text-white transition active:scale-95 shadow-md"
            title="Toggle SFX Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. CENTER HERO SECTION: Operative & Mission Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl my-auto py-4">
        {/* Card 1: Selected Operative Showcase */}
        <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                ACTIVE SURVIVOR
              </span>
              <button
                onClick={onOpenCharacters}
                className="text-[10px] text-zinc-400 hover:text-amber-300 underline font-mono"
              >
                Change Hero ▾
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border"
                style={{
                  backgroundColor: `#${selectedCharacter.vestColor.toString(16).padStart(6, '0')}`,
                  borderColor: selectedCharacter.accentColor,
                }}
              >
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase text-white tracking-wide">
                  {selectedCharacter.name}
                </h3>
                <p className="text-xs text-amber-400 font-mono">{selectedCharacter.title}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800/80 text-xs text-zinc-300 mb-2">
              <span className="font-bold text-amber-400">⚡ PERK: {selectedCharacter.perk}</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">{selectedCharacter.perkDescription}</p>
            </div>
          </div>

          {/* Music Status Bar Pill */}
          <div
            onClick={onOpenMusicStudio}
            className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/40 to-zinc-900 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-center gap-2 truncate">
              <Music className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-mono text-zinc-200 truncate">
                {currentMusicTitle || 'Click to Play Bhojpuri / Custom Songs'}
              </span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold shrink-0 uppercase">
              {isMusicPlaying ? 'TUNED IN' : 'OPEN'}
            </span>
          </div>
        </div>

        {/* Card 2: Armory & Weapons */}
        <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                ARMORY / WEAPON SELECT
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Real Hitboxes</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {WEAPONS.map((w, idx) => (
                <button
                  key={w.id}
                  onClick={() => onSelectWeapon(idx)}
                  className={`p-2.5 rounded-xl border text-left transition active:scale-95 ${
                    selectedWeaponIndex === idx
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-black truncate">{w.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{w.type} · {w.magazineSize} rds</div>
                </button>
              ))}
            </div>

            {/* Damage Specification Notice */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-black/50 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">HEADSHOT HITBOX</span>
                <span className="text-red-400 font-bold text-sm">100 DMG (1-Shot)</span>
              </div>
              <div className="p-2 rounded-lg bg-black/50 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">BODY HITBOX</span>
                <span className="text-amber-400 font-bold text-sm">35 DMG (3-Shot)</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-400 font-mono mt-3">
            🎯 Raycast headshot detection with separate head hitbox sphere!
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CTA: Big Battle Royale Play Button */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          onClick={onStart}
          className="group relative px-12 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-black font-black text-xl tracking-wider uppercase shadow-[0_0_35px_rgba(239,68,68,0.5)] border-2 border-amber-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <Play className="w-7 h-7 fill-black text-black" />
          <span className="drop-shadow">START MATCH</span>
        </button>

        {/* Flat control-hint line */}
        <div className="text-center font-mono">
          <p className="text-xs text-zinc-300">
            <span className="text-amber-400 font-bold">DESKTOP:</span> WASD Move · Mouse Aim/Shoot · Right-Click Scope · Space Jump · R Reload · Esc Pause
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            <span className="text-amber-400 font-bold">MOBILE:</span> Responsive Thumbstick · Multitouch Aim & Shoot · Touch Buttons
          </p>
        </div>
      </div>
    </div>
  );
};
