/**
 * FreeFire 3D Battle Royale - Main Application
 * Connects Three.js Game Engine, Desktop Keyboard/Mouse input, Mobile Multitouch Controls,
 * Gaming HUD, Free Fire MAX Title Screen, Operatives Roster, Music Studio (Bhojpuri & Beats),
 * and Quality Settings.
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/gameEngine';
import {
  GameStatus,
  PlayerStats,
  DamageNumber,
  KillNotification,
  MinimapEntity,
  GameSettings,
  CharacterDef,
} from './types/game';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { MusicStudioModal } from './components/MusicStudioModal';
import { SettingsModal } from './components/SettingsModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { soundManager } from './audio/soundManager';
import { musicStudio, MusicStudioState } from './audio/musicStudio';
import { CHARACTERS } from './game/characters';

const DEFAULT_STATS: PlayerStats = {
  health: 100,
  maxHealth: 100,
  shield: 100,
  maxShield: 100,
  currentWeaponIndex: 0,
  ammoInMag: 30,
  ammoReserve: 120,
  isReloading: false,
  reloadProgress: 0,
  isAiming: false,
  isCrouching: false,
  isSprinting: false,
  isGrounded: true,
  kills: 0,
  headshots: 0,
  shotsFired: 0,
  shotsHit: 0,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>('TITLE');
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [killNotifications, setKillNotifications] = useState<KillNotification[]>([]);
  const [hitmarker, setHitmarker] = useState<{ show: boolean; isHeadshot: boolean }>({
    show: false,
    isHeadshot: false,
  });
  const [minimapEntities, setMinimapEntities] = useState<MinimapEntity[]>([]);
  const [playerHeading, setPlayerHeading] = useState<number>(0);
  const [selectedWeaponIdx, setSelectedWeaponIdx] = useState<number>(0);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDef>(CHARACTERS[0]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Modals state
  const [isMusicStudioOpen, setIsMusicStudioOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState<boolean>(false);

  // Settings state (Default to LOW for budget Android phones)
  const [settings, setSettings] = useState<GameSettings>({
    quality: 'low',
    sensitivity: 1.0,
    sfxVolume: 0.8,
    musicVolume: 0.6,
    invertY: false,
    autoHeadshot: false,
  });

  // Track Music Studio playback
  const [musicState, setMusicState] = useState<MusicStudioState>(musicStudio.getState());

  useEffect(() => {
    return musicStudio.subscribe(setMusicState);
  }, []);

  // Detect touch capability
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  // Initialize GameEngine
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, {
      onStatsUpdate: (newStats) => setStats(newStats),
      onGameStatusChange: (status) => setGameStatus(status),
      onDamageNumber: (dmg) => {
        setDamageNumbers((prev) => [...prev, dmg]);
        setTimeout(() => {
          setDamageNumbers((prev) => prev.filter((d) => d.id !== dmg.id));
        }, 800);
      },
      onKillNotification: (notif) => {
        setKillNotifications((prev) => [...prev, notif]);
      },
      onHitmarker: (isHeadshot) => {
        setHitmarker({ show: true, isHeadshot });
        setTimeout(() => {
          setHitmarker((prev) => ({ ...prev, show: false }));
        }, 160);
      },
      onMinimapUpdate: (entities, heading) => {
        setMinimapEntities(entities);
        setPlayerHeading(heading);
      },
    });

    // Apply default low quality and initial settings
    engine.setQuality(settings.quality);
    engine.setSensitivity(settings.sensitivity);
    engine.setAutoHeadshot(settings.autoHeadshot);
    engine.setPlayerCharacter(selectedCharacter);

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Desktop Keyboard Controls
  useEffect(() => {
    const keysDown = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.code);
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Escape') {
        engine.togglePause();
        return;
      }

      if (engine.status !== 'PLAYING') return;

      if (e.code === 'KeyR') {
        engine.reload();
      } else if (e.code === 'Space') {
        engine.jump();
      } else if (e.code === 'KeyC') {
        engine.toggleCrouch();
      } else if (e.code === 'KeyQ') {
        engine.toggleAim();
      } else if (e.code === 'Digit1') {
        engine.switchWeapon(0);
      } else if (e.code === 'Digit2') {
        engine.switchWeapon(1);
      } else if (e.code === 'Digit3') {
        engine.switchWeapon(2);
      }

      updateKeyboardMovement();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      updateKeyboardMovement();
    };

    const updateKeyboardMovement = () => {
      const engine = engineRef.current;
      if (!engine || engine.status !== 'PLAYING') return;

      let fwd = 0;
      let right = 0;

      if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) fwd += 1;
      if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) fwd -= 1;
      if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) right += 1;
      if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) right -= 1;

      engine.moveInput.forward = fwd;
      engine.moveInput.right = right;
      engine.isSprinting = keysDown.has('ShiftLeft') || keysDown.has('ShiftRight');
    };

    const onBlur = () => {
      keysDown.clear();
      const engine = engineRef.current;
      if (engine) {
        engine.moveInput.forward = 0;
        engine.moveInput.right = 0;
        engine.isShootingHeld = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Desktop Mouse Aiming & Shooting (Pointer Lock with Sensitivity)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const engine = engineRef.current;
      if (!engine || engine.status !== 'PLAYING') return;

      if (document.pointerLockElement === mountRef.current || e.buttons === 1 || e.buttons === 2) {
        const baseSens = engine.isAiming ? 0.002 : 0.0035;
        const sens = baseSens * (engine.sensitivity || 1.0);
        engine.playerYaw -= e.movementX * sens;
        // Moving mouse down tilts view down, moving mouse up tilts view up
        const yDir = settings.invertY ? 1 : -1;
        engine.playerPitch = Math.max(
          -Math.PI * 0.35,
          Math.min(Math.PI * 0.35, engine.playerPitch + e.movementY * sens * yDir)
        );
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const engine = engineRef.current;
      if (!engine || engine.status !== 'PLAYING') return;

      if (e.button === 0) {
        // Immediate zero-delay shooting
        engine.startShooting();
      } else if (e.button === 2) {
        e.preventDefault();
        engine.toggleAim();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      if (e.button === 0) {
        engine.stopShooting();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [settings.invertY]);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.switchWeapon(selectedWeaponIdx);
      engineRef.current.setPlayerCharacter(selectedCharacter);
      engineRef.current.startMatch();
      if (!isTouchDevice && mountRef.current) {
        mountRef.current.requestPointerLock?.();
      }
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.quality && engineRef.current) {
        engineRef.current.setQuality(newSettings.quality);
      }
      if (newSettings.sensitivity !== undefined && engineRef.current) {
        engineRef.current.setSensitivity(newSettings.sensitivity);
      }
      if (newSettings.autoHeadshot !== undefined && engineRef.current) {
        engineRef.current.setAutoHeadshot(newSettings.autoHeadshot);
      }
      if (newSettings.musicVolume !== undefined) {
        musicStudio.setVolume(newSettings.musicVolume);
      }
      return updated;
    });
  };

  const handleSelectCharacter = (char: CharacterDef) => {
    setSelectedCharacter(char);
    if (engineRef.current) {
      engineRef.current.setPlayerCharacter(char);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 1. Isolated WebGL 3D Canvas Container */}
      <div
        ref={mountRef}
        onClick={() => {
          if (gameStatus === 'PLAYING' && !isTouchDevice && mountRef.current) {
            mountRef.current.requestPointerLock?.();
          }
        }}
        className="absolute inset-0 cursor-crosshair z-0"
      />

      {/* 2. Free Fire MAX Style Title Screen */}
      {gameStatus === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          selectedWeaponIndex={selectedWeaponIdx}
          onSelectWeapon={(idx) => {
            setSelectedWeaponIdx(idx);
            if (engineRef.current) engineRef.current.switchWeapon(idx);
          }}
          selectedCharacter={selectedCharacter}
          onOpenCharacters={() => setIsCharacterSelectOpen(true)}
          onOpenMusicStudio={() => setIsMusicStudioOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          currentMusicTitle={musicState.currentTrack?.title}
          isMusicPlaying={musicState.isPlaying}
        />
      )}

      {/* 3. In-Game HUD (Visible during gameplay and paused) */}
      {(gameStatus === 'PLAYING' || gameStatus === 'PAUSED') && (
        <HUD
          stats={stats}
          damageNumbers={damageNumbers}
          killNotifications={killNotifications}
          hitmarker={hitmarker}
          minimapEntities={minimapEntities}
          playerHeading={playerHeading}
          onPause={() => engineRef.current?.togglePause()}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenMusicStudio={() => setIsMusicStudioOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* 4. Touch Controls (Responsive Virtual Thumbstick & Multitouch Buttons) */}
      {(gameStatus === 'PLAYING' || gameStatus === 'PAUSED') && (
        <TouchControls
          engine={engineRef.current}
          isAiming={stats.isAiming}
          isCrouching={stats.isCrouching}
          isSprinting={stats.isSprinting}
          isReloading={stats.isReloading}
          currentWeaponIndex={stats.currentWeaponIndex}
        />
      )}

      {/* 5. Game Over / Victory (Booyah) / Defeat / Pause Modal */}
      <GameOverModal
        status={gameStatus}
        stats={stats}
        onResume={() => engineRef.current?.togglePause()}
        onRestart={handleStartGame}
      />

      {/* 6. Music Studio Modal (Bhojpuri / Custom Songs & Web Audio Beats) */}
      <MusicStudioModal
        isOpen={isMusicStudioOpen}
        onClose={() => setIsMusicStudioOpen(false)}
      />

      {/* 7. Settings Modal (Low/Medium/High Quality & Sensitivity) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* 8. Character / Operatives Selection Modal */}
      <CharacterSelectModal
        isOpen={isCharacterSelectOpen}
        onClose={() => setIsCharacterSelectOpen(false)}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={handleSelectCharacter}
      />
    </div>
  );
}
