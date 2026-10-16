/**
 * FreeFire MAX Style Character / Operative Selection Modal
 * Inspect and equip stylized 3D combatants (Hayato, Kelly, Alok, Moco)
 * with their distinctive tactical perks.
 */

import React from 'react';
import { CHARACTERS } from '../game/characters';
import { CharacterDef } from '../types/game';
import { Shield, Zap, Activity, Eye, X, Check, Award } from 'lucide-react';

interface CharacterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacter: CharacterDef;
  onSelectCharacter: (char: CharacterDef) => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  isOpen,
  onClose,
  selectedCharacter,
  onSelectCharacter,
}) => {
  if (!isOpen) return null;

  const getPerkIcon = (id: string) => {
    switch (id) {
      case 'hayato':
        return <Shield className="w-4 h-4 text-red-400" />;
      case 'kelly':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'alok':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'moco':
        return <Eye className="w-4 h-4 text-emerald-400" />;
      default:
        return <Award className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-xl bg-zinc-950/95 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_35px_rgba(245,158,11,0.2)] flex flex-col text-white font-sans">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wider uppercase text-amber-400">
                  OPERATIVES ROSTER
                </h2>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded uppercase">
                  Free Fire MAX
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Select your 3D tactical survivor and unique combat perk
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

        {/* Characters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
          {CHARACTERS.map((char) => {
            const isEquipped = selectedCharacter.id === char.id;
            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isEquipped
                    ? 'bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Accent top stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: char.accentColor }}
                />

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                      {char.name}
                      {isEquipped && (
                        <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black tracking-wider">
                          EQUIPPED
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-amber-400 font-mono">{char.title}</p>
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
                    {getPerkIcon(char.id)}
                  </div>
                </div>

                {/* Perk Box */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800/80 text-[11px] mb-3">
                  <div className="font-bold text-zinc-200 flex items-center gap-1.5 mb-0.5">
                    <span className="text-amber-400">⚡ PERK:</span> {char.perk}
                  </div>
                  <p className="text-zinc-400 leading-snug">{char.perkDescription}</p>
                </div>

                {/* Outfit preview indicator */}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span>Uniform:</span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: `#${char.vestColor.toString(16).padStart(6, '0')}` }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: `#${char.helmetColor.toString(16).padStart(6, '0')}` }}
                    />
                  </div>

                  {isEquipped && (
                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Check className="w-3.5 h-3.5" /> ACTIVE
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer OK */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-sm uppercase tracking-wider transition hover:scale-[1.02] active:scale-98 shadow-lg shadow-amber-500/20"
        >
          CONFIRM OPERATIVE
        </button>
      </div>
    </div>
  );
};
