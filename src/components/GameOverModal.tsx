/**
 * FreeFire 3D Victory, Defeat & Pause Modals
 * Free Fire Booyah victory celebration, defeat summary, and pause overlay.
 */

import React from 'react';
import { Trophy, Skull, Target, RotateCcw, Play, Crosshair } from 'lucide-react';
import { PlayerStats, GameStatus } from '../types/game';

interface GameOverModalProps {
  status: GameStatus;
  stats: PlayerStats;
  onResume: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  stats,
  onResume,
  onRestart,
}) => {
  if (status !== 'VICTORY' && status !== 'DEFEAT' && status !== 'PAUSED') {
    return null;
  }

  const isVictory = status === 'VICTORY';
  const isPause = status === 'PAUSED';

  const accuracy =
    stats.shotsFired > 0
      ? Math.round((stats.shotsHit / stats.shotsFired) * 100)
      : 0;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 select-none backdrop-blur-none">
      <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Header Icon & Title */}
        {isPause ? (
          <div className="mb-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Crosshair className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wider text-white">
              MATCH PAUSED
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">Take a breath, Survivor.</p>
          </div>
        ) : isVictory ? (
          <div className="mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-200 flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-yellow-500/40 animate-bounce">
              <Trophy className="w-10 h-10 text-zinc-950" />
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500">
              BOOYAH!
            </div>
            <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mt-1">
              #1 VICTORY ROYALE · SURVIVOR CHAMPION
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-red-900 border-2 border-red-500 flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-red-600/40">
              <Skull className="w-10 h-10 text-white" />
            </div>
            <div className="text-3xl font-black uppercase tracking-tight text-red-500">
              ELIMINATED
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">Better luck next drop!</p>
          </div>
        )}

        {/* Stats Grid (Only on Game Over) */}
        {!isPause && (
          <div className="w-full grid grid-cols-3 gap-2.5 my-4 text-center font-mono">
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center">
              <span className="text-[10px] text-zinc-400 uppercase">Eliminations</span>
              <span className="text-xl font-black text-white tabular-nums mt-0.5">
                {stats.kills} <span className="text-xs text-zinc-400">/ 3</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center">
              <span className="text-[10px] text-zinc-400 uppercase">Headshots</span>
              <span className="text-xl font-black text-red-400 tabular-nums mt-0.5">
                {stats.headshots}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center">
              <span className="text-[10px] text-zinc-400 uppercase">Accuracy</span>
              <span className="text-xl font-black text-amber-400 tabular-nums mt-0.5">
                {accuracy}%
              </span>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="w-full flex flex-col gap-3 mt-2">
          {isPause && (
            <button
              onClick={onResume}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-sm tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>RESUME MATCH</span>
            </button>
          )}

          <button
            onClick={onRestart}
            className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wider uppercase transition active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
              isVictory
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black'
                : 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isVictory ? 'PLAY AGAIN' : isPause ? 'RESTART MATCH' : 'TRY AGAIN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
