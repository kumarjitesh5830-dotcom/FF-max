/**
 * FreeFire 3D Gaming HUD
 * Free Fire styled tactical UI:
 * Dynamic reticle crosshair with hitmarkers, floating damage numbers,
 * HP/Shield status bars, Ammo counter with reload circle, kill feed banner,
 * and radar mini-map.
 */

import React from 'react';
import {
  PlayerStats,
  DamageNumber,
  KillNotification,
  MinimapEntity,
} from '../types/game';
import { WEAPONS } from '../game/weapons';
import { Skull, Volume2, VolumeX, Pause, Compass, Music, Settings, Play, SkipForward } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { musicStudio } from '../audio/musicStudio';

interface HUDProps {
  stats: PlayerStats;
  damageNumbers: DamageNumber[];
  killNotifications: KillNotification[];
  hitmarker: { show: boolean; isHeadshot: boolean };
  minimapEntities: MinimapEntity[];
  playerHeading: number;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenMusicStudio?: () => void;
  onOpenSettings?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  damageNumbers,
  killNotifications,
  hitmarker,
  minimapEntities,
  playerHeading,
  onPause,
  isMuted,
  onToggleMute,
  onOpenMusicStudio,
  onOpenSettings,
}) => {
  const currentWeapon = WEAPONS[stats.currentWeaponIndex] || WEAPONS[0];
  const hpPercent = Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));
  const studioState = musicStudio.getState();

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans">
      {/* 1. TOP BAR: Match Header, Minimap, Kill Counter, Pause & Audio */}
      <div className="absolute top-3 left-4 right-4 flex items-start justify-between">
        {/* Left: Player Status Badge & Kill Counter */}
        <div className="flex items-center gap-3">
          {/* Free Fire Style Kill Counter */}
          <div className="flex items-center gap-2 bg-black/60 border border-zinc-700/80 rounded-lg px-3 py-1.5 shadow-md">
            <Skull className="w-5 h-5 text-red-500 fill-red-500/20" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Kills</span>
              <span className="text-lg font-black text-white tabular-nums">{stats.kills}</span>
            </div>
            {stats.headshots > 0 && (
              <span className="ml-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-600/40 px-1.5 py-0.5 rounded">
                🎯 {stats.headshots}
              </span>
            )}
          </div>

          {/* Survival Rank / Remaining Alive (4 Total: You + 3 Enemies) */}
          <div className="bg-black/60 border border-zinc-700/80 rounded-lg px-3 py-1.5 flex flex-col leading-none shadow-md">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Alive</span>
            <span className="text-lg font-black text-amber-400 tabular-nums">
              {Math.max(1, 4 - stats.kills)} <span className="text-xs text-zinc-400">/ 4</span>
            </span>
          </div>
        </div>

        {/* Center: Top Kill Feed Banner (Free Fire Announcement Style) */}
        <div className="flex flex-col items-center gap-1 max-w-sm">
          {killNotifications.slice(-2).map((notif) => (
            <div
              key={notif.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-black shadow-lg animate-bounce ${
                notif.isHeadshot
                  ? 'bg-gradient-to-r from-red-900 to-amber-900 border border-red-500 text-yellow-300'
                  : 'bg-zinc-900/90 border border-zinc-700 text-white'
              }`}
            >
              <span className="text-cyan-400">{notif.killer}</span>
              {notif.isHeadshot ? (
                <span className="text-red-400 font-extrabold flex items-center gap-1">
                  💥 HEADSHOT
                </span>
              ) : (
                <span className="text-zinc-400">eliminated</span>
              )}
              <span className="text-red-400">{notif.victim}</span>
              <span className="text-[10px] text-zinc-400">({notif.weapon})</span>
            </div>
          ))}
        </div>

        {/* Right: Radar Mini-map + Settings buttons */}
        <div className="flex items-start gap-2">
          {/* Circular Radar Minimap */}
          <div className="relative w-24 h-24 rounded-full border-2 border-amber-500/50 bg-black/60 overflow-hidden shadow-lg">
            {/* Radar Sweep grid lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-white/15" />
              <div className="absolute w-full h-[1px] bg-white/10" />
              <div className="absolute h-full w-[1px] bg-white/10" />
            </div>

            {/* Radar Blips */}
            {minimapEntities.map((ent) => {
              // Convert 3D world (X: -40 to 40, Z: -40 to 40) into 24x24 radar
              const radarX = 48 + (ent.x / 40) * 40;
              const radarY = 48 + (ent.z / 40) * 40;

              if (ent.type === 'player') {
                return (
                  <div
                    key={ent.id}
                    className="absolute w-3 h-3 -ml-1.5 -mt-1.5"
                    style={{
                      left: `${radarX}px`,
                      top: `${radarY}px`,
                      transform: `rotate(${playerHeading}rad)`,
                    }}
                  >
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400 drop-shadow" />
                  </div>
                );
              } else {
                return (
                  <div
                    key={ent.id}
                    className={`absolute w-2 h-2 -ml-1 -mt-1 rounded-full ${
                      ent.isShooting ? 'bg-red-500 scale-150 animate-ping' : 'bg-red-500 shadow-sm shadow-red-500'
                    }`}
                    style={{ left: `${radarX}px`, top: `${radarY}px` }}
                  />
                );
              }
            })}

            <Compass className="absolute bottom-1 right-1 w-3 h-3 text-amber-400/60" />
          </div>

          {/* Quick Action Buttons (Music Studio, Settings, Pause & Sound) */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            {onOpenMusicStudio && (
              <button
                onClick={onOpenMusicStudio}
                className="p-2 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 hover:text-white hover:bg-amber-500/40 transition active:scale-95 shadow"
                title="Bhojpuri Music Studio"
              >
                <Music className="w-4 h-4" />
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg bg-black/60 border border-zinc-700/80 text-white hover:bg-zinc-800 transition active:scale-95 shadow"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-black/60 border border-zinc-700/80 text-white hover:bg-zinc-800 transition active:scale-95 shadow"
              title="Pause Game (Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-black/60 border border-zinc-700/80 text-white hover:bg-zinc-800 transition active:scale-95 shadow"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC RETICLE / CROSSHAIR & HITMARKERS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Reticle Lines */}
        <div
          className={`relative flex items-center justify-center transition-all duration-75 ${
            stats.isAiming ? 'scale-75' : 'scale-100'
          }`}
        >
          {/* Center Dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/90 shadow-sm shadow-amber-400" />

          {/* Crosshair 4 bars */}
          <div
            className={`absolute w-3.5 h-[2px] bg-white/80 transition-all ${
              stats.isAiming ? 'left-[-12px]' : 'left-[-18px]'
            }`}
          />
          <div
            className={`absolute w-3.5 h-[2px] bg-white/80 transition-all ${
              stats.isAiming ? 'right-[-12px]' : 'right-[-18px]'
            }`}
          />
          <div
            className={`absolute h-3.5 w-[2px] bg-white/80 transition-all ${
              stats.isAiming ? 'top-[-12px]' : 'top-[-18px]'
            }`}
          />
          <div
            className={`absolute h-3.5 w-[2px] bg-white/80 transition-all ${
              stats.isAiming ? 'bottom-[-12px]' : 'bottom-[-18px]'
            }`}
          />

          {/* HITMARKER: Displayed on confirmed bullet impact */}
          {/* HITMARKER: Displayed on confirmed bullet impact */}
          {hitmarker.show && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {hitmarker.isHeadshot ? (
                // Free Fire Style Explosive Red Headshot Indicator
                <div className="relative flex flex-col items-center justify-center animate-bounce">
                  <div className="w-12 h-12 rounded-full border-2 border-red-500 animate-ping absolute" />
                  <Skull className="w-8 h-8 text-red-500 fill-red-500/40 drop-shadow-[0_0_12px_rgba(239,68,68,1)]" />
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 border border-yellow-300 shadow-[0_0_15px_rgba(239,68,68,0.8)] text-white text-[11px] font-black uppercase tracking-wider">
                    ⚡ HEADSHOT 100 ⚡
                  </div>
                </div>
              ) : (
                // White/Yellow Body Hitmarker Cross
                <div className="w-6 h-6 relative scale-110">
                  <div className="absolute top-0 left-0 w-3 h-[2px] bg-amber-400 rotate-45 shadow-sm" />
                  <div className="absolute top-0 right-0 w-3 h-[2px] bg-amber-400 -rotate-45 shadow-sm" />
                  <div className="absolute bottom-0 left-0 w-3 h-[2px] bg-amber-400 -rotate-45 shadow-sm" />
                  <div className="absolute bottom-0 right-0 w-3 h-[2px] bg-amber-400 rotate-45 shadow-sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. FLOATING 2D DAMAGE NUMBERS (3D -> 2D Projected) */}
      {damageNumbers.map((dmg) => (
        <div
          key={dmg.id}
          className={`absolute -translate-x-1/2 -translate-y-1/2 font-black tabular-nums transition-all duration-300 pointer-events-none drop-shadow-md ${
            dmg.isHeadshot
              ? 'text-2xl text-red-500 font-extrabold animate-bounce'
              : 'text-lg text-amber-300 font-bold'
          }`}
          style={{
            left: `${dmg.x}px`,
            top: `${dmg.y - 20}px`,
            opacity: dmg.opacity,
          }}
        >
          {dmg.isHeadshot && '💥 '}
          {dmg.text}
        </div>
      ))}

      {/* 4. BOTTOM DOCK (Unified HUD cluster: Health & Weapon Ammo) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-auto">
        {/* Health Bar Cluster (Free Fire style Green/Red segmented bar) */}
        <div className="flex flex-col gap-1 w-56 sm:w-64 bg-black/70 border border-zinc-700/80 rounded-xl p-2.5 shadow-xl">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> HP
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {stats.health} <span className="text-zinc-400 text-[10px]">/ 100</span>
            </span>
          </div>

          {/* Progress track */}
          <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                hpPercent > 50
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : hpPercent > 25
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Weapon & Ammo Counter Cluster */}
        <div className="flex items-center gap-3 bg-black/70 border border-zinc-700/80 rounded-xl px-4 py-2.5 shadow-xl">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-400">{currentWeapon.name}</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {currentWeapon.type} · 7.62mm
            </span>
          </div>

          <div className="h-7 w-[1px] bg-zinc-700" />

          {/* Ammo in Mag / Reserve */}
          <div className="flex items-baseline gap-1 font-mono">
            <span
              className={`text-2xl font-black tabular-nums ${
                stats.ammoInMag <= 5 ? 'text-red-500 animate-pulse' : 'text-white'
              }`}
            >
              {stats.isReloading ? '--' : stats.ammoInMag}
            </span>
            <span className="text-sm font-bold text-zinc-400 tabular-nums">/ {stats.ammoReserve}</span>
          </div>

          {stats.isReloading && (
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider animate-pulse">
              RELOADING...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
