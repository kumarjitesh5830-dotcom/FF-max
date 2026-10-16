/**
 * FreeFire 3D Mobile Touch Controls
 * Features dual-zone touch architecture:
 * 1. Virtual Thumbstick (Left side) for omnidirectional movement
 * 2. Swipe Aim Surface (Right side) for 360 camera rotation
 * 3. Tactical Action Buttons: Fire, Aim/Scope, Jump, Reload, Crouch, Sprint, Weapon Switch
 */

import React, { useRef, useState, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';
import { Crosshair, Shield, RotateCcw, ArrowUp, Eye, Zap } from 'lucide-react';
import { WEAPONS } from '../game/weapons';

interface TouchControlsProps {
  engine: GameEngine | null;
  isAiming: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  isReloading: boolean;
  currentWeaponIndex: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  engine,
  isAiming,
  isCrouching,
  isSprinting,
  isReloading,
  currentWeaponIndex,
}) => {
  // Joystick UI State
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });

  // Aim Drag Tracking
  const aimTouchIdRef = useRef<number | null>(null);
  const lastAimPosRef = useRef({ x: 0, y: 0 });

  // Handle Joystick touch events
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    setIsJoystickActive(true);
    handleJoystickMove(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (clientX: number, clientY: number) => {
    const dx = clientX - joystickCenterRef.current.x;
    const dy = clientY - joystickCenterRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 45;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: stickX, y: stickY });

    if (engine) {
      // Normalized movement inputs: Forward is negative Y in screen space
      const normX = stickX / maxRadius;
      const normY = -stickY / maxRadius;

      engine.moveInput.right = normX;
      engine.moveInput.forward = normY;
    }
  };

  // Global touchmove & touchend listeners for joystick and aim look
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      // Prevent browser default pull-to-refresh and pinch-zoom
      e.preventDefault();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Process joystick touch
        if (touch.identifier === touchIdRef.current) {
          handleJoystickMove(touch.clientX, touch.clientY);
        }

        // Process aim drag touch
        if (touch.identifier === aimTouchIdRef.current && engine) {
          const dx = touch.clientX - lastAimPosRef.current.x;
          const dy = touch.clientY - lastAimPosRef.current.y;

          lastAimPosRef.current = { x: touch.clientX, y: touch.clientY };

          // Apply camera rotation sensitivity (Smooth & precise)
          const baseSens = engine.isAiming ? 0.003 : 0.005;
          const sens = baseSens * (engine.sensitivity || 1.0);
          engine.playerYaw -= dx * sens;
          // Natural swipe: swipe up tilts camera up, swipe down tilts camera down
          engine.playerPitch = Math.max(
            -Math.PI * 0.35,
            Math.min(Math.PI * 0.35, engine.playerPitch - dy * sens)
          );
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setIsJoystickActive(false);
          setJoystickPos({ x: 0, y: 0 });
          if (engine) {
            engine.moveInput.forward = 0;
            engine.moveInput.right = 0;
          }
        }

        if (touch.identifier === aimTouchIdRef.current) {
          aimTouchIdRef.current = null;
        }
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [engine]);

  // Handle right aim touch zone start
  const handleAimAreaTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (aimTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    aimTouchIdRef.current = touch.identifier;
    lastAimPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const currentWeapon = WEAPONS[currentWeaponIndex] || WEAPONS[0];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
      {/* 1. Transparent Aim Touch Surface (Right 65% of viewport) */}
      <div
        className="absolute top-0 right-0 w-[65%] h-full pointer-events-auto z-10"
        onTouchStart={handleAimAreaTouchStart}
      />

      {/* 2. Virtual Joystick Area (Bottom Left) */}
      <div className="absolute bottom-6 left-6 pointer-events-auto flex items-center justify-center z-30">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          className="relative w-32 h-32 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur-none flex items-center justify-center shadow-lg active:border-amber-400/50"
        >
          {/* Inner Directional Markings */}
          <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/40" />

          {/* Movable Thumbstick Knob */}
          <div
            className={`w-14 h-14 rounded-full border-2 border-amber-400 bg-amber-500/80 shadow-md transition-transform duration-75 flex items-center justify-center ${
              isJoystickActive ? 'scale-105 shadow-amber-500/40' : ''
            }`}
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/70" />
          </div>
        </div>
      </div>

      {/* 3. Action Buttons Cluster (Bottom Right) */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end gap-3 z-30">
        {/* Upper Row: Weapon Switch + Sprint */}
        <div className="flex items-center gap-3 mb-1">
          {/* Weapon Switch Button */}
          <button
            onClick={() => engine?.switchWeapon()}
            className="px-3 py-1.5 rounded-lg bg-zinc-900/85 border border-zinc-700/80 text-white font-mono text-xs flex items-center gap-1.5 shadow-md active:scale-95"
            title="Switch Weapon"
          >
            <span className="font-bold text-amber-400">{currentWeapon.name}</span>
            <span className="text-[10px] text-zinc-400">[{currentWeapon.type}]</span>
          </button>

          {/* Sprint Toggle */}
          <button
            onClick={() => {
              if (engine) {
                engine.isSprinting = !engine.isSprinting;
              }
            }}
            className={`w-12 h-12 rounded-full border flex items-center justify-center text-xs font-bold shadow-md active:scale-95 transition-colors ${
              isSprinting
                ? 'bg-amber-500 border-amber-300 text-black'
                : 'bg-black/60 border-white/20 text-white'
            }`}
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid: Aim, Crouch, Reload, Jump, and Primary FIRE */}
        <div className="flex items-end gap-3">
          {/* Column 1: Crouch & Reload */}
          <div className="flex flex-col gap-3">
            {/* Reload Button */}
            <button
              onClick={() => engine?.reload()}
              disabled={isReloading}
              className={`w-13 h-13 rounded-full border border-white/25 bg-black/65 text-white flex items-center justify-center shadow-lg active:scale-95 ${
                isReloading ? 'animate-spin border-amber-400 text-amber-400' : ''
              }`}
              title="Reload (R)"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            {/* Crouch Button */}
            <button
              onClick={() => engine?.toggleCrouch()}
              className={`w-13 h-13 rounded-full border flex items-center justify-center text-xs font-bold shadow-lg active:scale-95 ${
                isCrouching
                  ? 'bg-amber-500 border-amber-300 text-black'
                  : 'bg-black/65 border-white/25 text-white'
              }`}
              title="Crouch (C)"
            >
              <Shield className="w-6 h-6" />
            </button>
          </div>

          {/* Column 2: Scope/Aim & Jump */}
          <div className="flex flex-col gap-3">
            {/* ADS / Scope Button */}
            <button
              onClick={() => engine?.toggleAim()}
              className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                isAiming
                  ? 'bg-cyan-500 border-cyan-300 text-black shadow-cyan-500/40 scale-105'
                  : 'bg-black/65 border-white/30 text-cyan-400'
              }`}
              title="Aim / Scope (Right Click)"
            >
              <Eye className="w-7 h-7" />
            </button>

            {/* Jump Button */}
            <button
              onClick={() => engine?.jump()}
              className="w-14 h-14 rounded-full border border-white/30 bg-black/65 text-white flex items-center justify-center shadow-lg active:scale-95"
              title="Jump (Space)"
            >
              <ArrowUp className="w-7 h-7" />
            </button>
          </div>

          {/* Column 3: Primary FIRE Button (Large tactical Free Fire style) */}
          <div className="relative">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                engine?.startShooting();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                engine?.stopShooting();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                engine?.startShooting();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                engine?.stopShooting();
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 border-3 border-amber-300/80 text-white flex flex-col items-center justify-center shadow-xl shadow-red-600/40 active:scale-90 transition-transform"
              title="Fire (Left Click / Tap)"
            >
              <Crosshair className="w-9 h-9 drop-shadow" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-100">FIRE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
