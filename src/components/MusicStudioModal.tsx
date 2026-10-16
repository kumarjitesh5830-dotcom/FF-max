/**
 * FreeFire MAX Style Music Studio Modal
 * Allows players to select and play their own Bhojpuri songs using an audio file picker
 * supporting MP3, WAV, OGG, and other browser formats.
 * Includes Play, Pause, Next, Previous, Volume, Seek, and Stop controls.
 */

import React, { useEffect, useState, useRef } from 'react';
import { musicStudio, MusicStudioState } from '../audio/musicStudio';
import { MusicTrack } from '../types/game';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  Upload,
  X,
  Radio,
  Sparkles,
} from 'lucide-react';

interface MusicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicStudioModal: React.FC<MusicStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [studioState, setStudioState] = useState<MusicStudioState>(musicStudio.getState());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = musicStudio.subscribe((state) => {
      setStudioState(state);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      musicStudio.addCustomTracks(e.target.files);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const { isPlaying, currentTrack, currentTime, duration, volume, playlist } = studioState;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-zinc-950/95 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_35px_rgba(245,158,11,0.2)] flex flex-col text-white">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wider uppercase text-amber-400">
                  MUSIC STUDIO
                </h2>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded uppercase">
                  Bhojpuri & Beats
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Load custom MP3/WAV tracks to play during battle
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

        {/* Currently Playing Card */}
        <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Music className="w-6 h-6 text-amber-400" />
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-black text-zinc-100 truncate">
                  {currentTrack ? currentTrack.title : 'No Track Selected'}
                </div>
                <div className="text-xs text-amber-400/80 font-mono truncate">
                  {currentTrack ? currentTrack.artist : 'Select a track or load your songs'}
                </div>
              </div>
            </div>

            {/* Equalizer Wave Bars */}
            <div className="flex items-end gap-1 h-6 shrink-0 pl-2">
              <div className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'h-6 animate-pulse' : 'h-1.5'}`} />
              <div className={`w-1 bg-amber-500 rounded-full transition-all ${isPlaying ? 'h-4 animate-bounce' : 'h-2'}`} />
              <div className={`w-1 bg-red-500 rounded-full transition-all ${isPlaying ? 'h-5 animate-pulse' : 'h-1'}`} />
              <div className={`w-1 bg-orange-400 rounded-full transition-all ${isPlaying ? 'h-3 animate-bounce' : 'h-2'}`} />
            </div>
          </div>

          {/* Progress Bar & Seek */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => musicStudio.seek(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls Cluster */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {/* Previous */}
              <button
                onClick={() => musicStudio.prev()}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition active:scale-95"
                title="Previous"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Main Play / Pause */}
              <button
                onClick={() => musicStudio.togglePlay()}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
              </button>

              {/* Next */}
              <button
                onClick={() => musicStudio.next()}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition active:scale-95"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Stop */}
              <button
                onClick={() => musicStudio.stop()}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-95"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => musicStudio.setVolume(Number(e.target.value))}
                className="w-20 sm:w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Load Bhojpuri / Custom Audio Files CTA */}
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-red-600/30 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs tracking-wider uppercase transition active:scale-98 flex items-center justify-center gap-2 shadow-md"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>SELECT YOUR BHOJPURI / MP3 / WAV SONGS</span>
          </button>
          <p className="text-[10px] text-zinc-400 text-center font-mono mt-1.5">
            Supported formats: MP3, WAV, OGG, AAC, M4A · Plays smoothly during matches
          </p>
        </div>

        {/* Playlist List */}
        <div className="flex-1 max-h-48 overflow-y-auto space-y-1.5 pr-1 font-sans">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Studio Playlist ({playlist.length})
          </span>
          {playlist.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => musicStudio.playTrack(idx)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400/80 text-white shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isCurrent ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      {track.title}
                      {track.isCustom && (
                        <span className="text-[9px] bg-red-600/30 text-red-300 border border-red-500/40 px-1 py-0.2 rounded font-mono">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">{track.artist}</div>
                  </div>
                </div>

                <div className="text-xs shrink-0 text-amber-400 font-mono">
                  {isCurrent && isPlaying ? (
                    <span className="text-emerald-400 font-bold">PLAYING</span>
                  ) : (
                    <span>READY</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
