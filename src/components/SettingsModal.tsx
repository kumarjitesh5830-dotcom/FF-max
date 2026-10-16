/**
 * FreeFire MAX Style Settings Modal
 * Supports Graphics Quality (Low [Default], Medium, High),
 * Sensitivity multiplier, and Audio volumes.
 */

import React from 'react';
import { Settings, Sliders, Monitor, Volume2, X, Check, Smartphone } from 'lucide-react';
import { GraphicsQuality, GameSettings } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const qualities: { id: GraphicsQuality; label: string; desc: string }[] = [
    {
      id: 'low',
      label: 'LOW (Recommended for Mobile)',
      desc: 'Optimized 60 FPS · Shadows off · Low-end Android phones friendly',
    },
    {
      id: 'medium',
      label: 'MEDIUM',
      desc: 'Balanced performance · Soft 512 shadows · 1.25x pixel density',
    },
    {
      id: 'high',
      label: 'HIGH (Free Fire MAX)',
      desc: 'Full HD fidelity · 1024 PCF shadows · Extended horizon fog',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-zinc-950/95 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_35px_rgba(245,158,11,0.2)] flex flex-col text-white font-sans">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase text-amber-400">
                SETTINGS
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                Graphics, Performance & Controls
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5">
          {/* 1. Graphics Quality Presets */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
              <Monitor className="w-4 h-4 text-amber-400" />
              <span>Graphics Quality (Default: Low for smooth FPS)</span>
            </div>
            <div className="space-y-2">
              {qualities.map((q) => {
                const isSelected = settings.quality === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => onUpdateSettings({ quality: q.id })}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                          {q.label}
                        </span>
                        {q.id === 'low' && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{q.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Sensitivity Slider */}
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Aim & Look Sensitivity</span>
              </div>
              <span className="font-mono text-amber-400 font-bold">{settings.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.1}
              value={settings.sensitivity}
              onChange={(e) => onUpdateSettings({ sensitivity: Number(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>0.4x (Steady)</span>
              <span>1.0x (Standard)</span>
              <span>2.5x (Fast)</span>
            </div>
          </div>

          {/* 3. AUTO HEADSHOT Target Assist Toggle */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                  🎯
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      AUTO HEADSHOT
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      settings.autoHeadshot
                        ? 'bg-red-600 text-white shadow-sm shadow-red-600/50'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {settings.autoHeadshot ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Target assist locks onto visible enemy head hitboxes (100 DMG)
                  </p>
                </div>
              </div>

              {/* ON/OFF Switch */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ autoHeadshot: !settings.autoHeadshot })}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.autoHeadshot
                    ? 'bg-red-600 border-red-400 shadow-md shadow-red-600/40'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                    settings.autoHeadshot ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 4. Audio Volume Sliders */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Sound Effects (SFX)</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Footer OK button */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-sm uppercase tracking-wider transition hover:scale-[1.02] active:scale-98 shadow-lg shadow-amber-500/20"
        >
          CONFIRM SETTINGS
        </button>
      </div>
    </div>
  );
};
