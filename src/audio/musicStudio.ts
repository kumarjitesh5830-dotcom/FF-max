/**
 * Music Studio Manager for FreeFire 3D
 * Supports custom Bhojpuri / MP3 / WAV audio file loading, playlist management,
 * background playback during gameplay, and built-in procedural rhythm beats.
 * Zero copyrighted music bundled!
 */

import { MusicTrack } from '../types/game';

export interface MusicStudioState {
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: MusicTrack[];
}

export type MusicListener = (state: MusicStudioState) => void;

class MusicStudioManager {
  private audioElement: HTMLAudioElement;
  private playlist: MusicTrack[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.6;
  private listeners: Set<MusicListener> = new Set();

  // Procedural Web Audio Synth Beat (for default energizing rhythm without copyrighted audio)
  private synthCtx: AudioContext | null = null;
  private synthInterval: number | null = null;
  private isSynthPlaying: boolean = false;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.volume = this.volume;
    this.audioElement.preload = 'auto';

    // Built-in procedural rhythm track presets (100% legal, synthesized)
    this.playlist = [
      {
        id: 'synth-bhojpuri-beat',
        title: 'Desi Dholak Battle Groove',
        artist: 'Studio Procedural Beats',
        url: 'procedural:desi-groove',
        duration: 180,
        isCustom: false,
      },
      {
        id: 'synth-cyber-hype',
        title: 'Survivor Hype Rush',
        artist: 'Studio Synth Wave',
        url: 'procedural:cyber-rush',
        duration: 160,
        isCustom: false,
      },
    ];

    // Audio element event listeners
    this.audioElement.addEventListener('ended', () => {
      this.next();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.notifyListeners();
    });

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.notifyListeners();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifyListeners();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error on track, skipping to next', e);
      this.next();
    });
  }

  public subscribe(listener: MusicListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  public getState() {
    return {
      isPlaying: this.isPlaying || this.isSynthPlaying,
      currentTrack: this.playlist[this.currentIndex] || null,
      currentTime: this.isSynthPlaying ? 0 : this.audioElement.currentTime || 0,
      duration: this.isSynthPlaying ? 180 : this.audioElement.duration || 0,
      volume: this.volume,
      playlist: [...this.playlist],
    };
  }

  /**
   * Load user-uploaded audio files (Bhojpuri songs, MP3, WAV, OGG, etc.)
   */
  public addCustomTracks(files: FileList | File[]) {
    const newTracks: MusicTrack[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
        const objectUrl = URL.createObjectURL(file);
        // Clean display title from filename
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        newTracks.push({
          id: `custom-${Date.now()}-${i}`,
          title: cleanTitle,
          artist: 'My Bhojpuri / Custom Song',
          url: objectUrl,
          isCustom: true,
        });
      }
    }

    if (newTracks.length > 0) {
      // Prepend user custom tracks to the top of the playlist!
      this.playlist = [...newTracks, ...this.playlist];
      this.currentIndex = 0;
      this.playTrack(0);
      this.notifyListeners();
    }
  }

  /**
   * Play specific track by index
   */
  public playTrack(index: number) {
    if (this.playlist.length === 0) return;
    this.stopSynthBeat();
    this.audioElement.pause();

    this.currentIndex = (index + this.playlist.length) % this.playlist.length;
    const track = this.playlist[this.currentIndex];

    if (track.url.startsWith('procedural:')) {
      // Start procedural rhythmic synth beat
      this.startSynthBeat(track.url);
      this.isPlaying = true;
      this.notifyListeners();
    } else {
      this.audioElement.src = track.url;
      this.audioElement.volume = this.volume;
      this.audioElement
        .play()
        .then(() => {
          this.isPlaying = true;
          this.notifyListeners();
        })
        .catch((err) => {
          console.warn('Playback error (user interaction required):', err);
          this.isPlaying = false;
          this.notifyListeners();
        });
    }
  }

  public play() {
    if (this.playlist.length === 0) return;
    const track = this.playlist[this.currentIndex];
    if (track.url.startsWith('procedural:')) {
      this.startSynthBeat(track.url);
      this.isPlaying = true;
      this.notifyListeners();
    } else {
      this.audioElement.play().catch(() => {});
    }
  }

  public pause() {
    this.stopSynthBeat();
    this.audioElement.pause();
    this.isPlaying = false;
    this.notifyListeners();
  }

  public togglePlay() {
    if (this.isPlaying || this.isSynthPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public stop() {
    this.stopSynthBeat();
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.isPlaying = false;
    this.notifyListeners();
  }

  public next() {
    if (this.playlist.length === 0) return;
    this.playTrack(this.currentIndex + 1);
  }

  public prev() {
    if (this.playlist.length === 0) return;
    this.playTrack(this.currentIndex - 1);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.audioElement.volume = this.volume;
    this.notifyListeners();
  }

  public seek(seconds: number) {
    if (!this.isSynthPlaying && this.audioElement.duration) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration));
      this.notifyListeners();
    }
  }

  // =========================================================================
  // Procedural Energizing Rhythm Generator (Dholak/Desi Kick & Snare Groove)
  // =========================================================================
  private startSynthBeat(type: string) {
    this.stopSynthBeat();

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.synthCtx = new AudioCtx();
      if (this.synthCtx.state === 'suspended') {
        this.synthCtx.resume().catch(() => {});
      }

      this.isSynthPlaying = true;
      let step = 0;
      const bpm = type.includes('desi') ? 116 : 128;
      const stepDuration = (60 / bpm) / 4; // 16th notes

      this.synthInterval = window.setInterval(() => {
        if (!this.synthCtx) return;
        const now = this.synthCtx.currentTime;

        // Dholak / Bass Drum (Steps 0, 4, 8, 10, 12)
        if (step % 4 === 0 || (step === 10 && type.includes('desi'))) {
          this.triggerBassDrum(now);
        }

        // Resonant Slap / Rim / Snare (Steps 4, 12, and syncopated 14)
        if (step === 4 || step === 12 || (step === 14 && Math.random() > 0.4)) {
          this.triggerSlap(now);
        }

        // Tonal Bass melody (every 8 steps)
        if (step % 8 === 0) {
          const notes = [65.41, 73.42, 82.41, 98.0]; // C2, D2, E2, G2
          const note = notes[Math.floor((step / 8) % notes.length)];
          this.triggerBassNote(now, note);
        }

        step = (step + 1) % 16;
      }, stepDuration * 1000);
    } catch (err) {
      console.warn('Could not start synth beat:', err);
    }
  }

  private stopSynthBeat() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthCtx) {
      this.synthCtx.close().catch(() => {});
      this.synthCtx = null;
    }
    this.isSynthPlaying = false;
  }

  private triggerBassDrum(time: number) {
    if (!this.synthCtx) return;
    const osc = this.synthCtx.createOscillator();
    const gain = this.synthCtx.createGain();

    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.16);

    gain.gain.setValueAtTime(this.volume * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(this.synthCtx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private triggerSlap(time: number) {
    if (!this.synthCtx) return;
    const osc = this.synthCtx.createOscillator();
    const gain = this.synthCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.synthCtx.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private triggerBassNote(time: number, freq: number) {
    if (!this.synthCtx) return;
    const osc = this.synthCtx.createOscillator();
    const gain = this.synthCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.synthCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);

    gain.gain.setValueAtTime(this.volume * 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.synthCtx.destination);

    osc.start(time);
    osc.stop(time + 0.36);
  }
}

export const musicStudio = new MusicStudioManager();
