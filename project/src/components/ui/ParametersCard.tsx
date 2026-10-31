import { RotateCcw, Sparkles } from 'lucide-react';
import { DURATION_RANGE, type BlockLevel, type WorkDefinition } from '@/lib/interventions';
import type { WorkParams } from '@/lib/diagnosis';
import { GLASS_PANEL } from './primitives';

interface ParametersCardProps {
  work: WorkDefinition;
  params: WorkParams;
  isGenerating: boolean;
  onChange: (next: WorkParams) => void;
  onGenerate: () => void;
  onReset: () => void;
}

const LEVEL_OPTIONS: Array<{ value: BlockLevel; label: string; hint: string }> = [
  { value: 'partial', label: 'Parcial', hint: 'Uma faixa bloqueada no sentido principal' },
  { value: 'total', label: 'Total', hint: 'Interdição completa nos dois sentidos' },
];

const SCOPE_MAX_LENGTH = 120;

export function ParametersCard({ work, params, isGenerating, onChange, onGenerate, onReset }: ParametersCardProps) {
  const monthsLabel = params.duration === 1 ? 'mês' : 'meses';

  return (
    <aside
      className={`absolute bottom-4 left-4 right-4 z-10 max-h-[70vh] overflow-y-auto rounded-2xl p-5 animate-panel-in md:bottom-auto md:left-6 md:right-auto md:top-1/2 md:w-96 md:-translate-y-1/2 ${GLASS_PANEL}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-sky-300">Parâmetros da obra</p>
      <h2 className="mt-1 text-lg font-semibold leading-tight text-slate-100">{work.title}</h2>

      <div className="mt-6 space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="work-duration" className="text-sm text-slate-300">
              Duração estimada
            </label>
            <span className="rounded-lg bg-sky-400/15 px-2.5 py-1 text-sm font-semibold tabular-nums text-sky-200 ring-1 ring-sky-400/30">
              {params.duration} {monthsLabel}
            </span>
          </div>
          <input
            id="work-duration"
            type="range"
            min={DURATION_RANGE.min}
            max={DURATION_RANGE.max}
            step={1}
            value={params.duration}
            onChange={(event) => onChange({ ...params, duration: Number(event.target.value) })}
            className="w-full cursor-pointer accent-sky-400"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>{DURATION_RANGE.min} mês</span>
            <span>{DURATION_RANGE.max} meses</span>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm text-slate-300">Nível de bloqueio</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1">
            {LEVEL_OPTIONS.map((option) => {
              const isSelected = params.level === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange({ ...params, level: option.value })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition duration-200 ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-900/40'
                      : 'text-slate-300 hover:bg-white/10 hover:text-slate-100'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">{LEVEL_OPTIONS.find((o) => o.value === params.level)?.hint}</p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="work-scope" className="text-sm text-slate-300">
              Motivo / Escopo da obra
            </label>
            <span className="text-xs tabular-nums text-slate-500">
              {params.scope.length}/{SCOPE_MAX_LENGTH}
            </span>
          </div>
          <input
            id="work-scope"
            type="text"
            maxLength={SCOPE_MAX_LENGTH}
            value={params.scope}
            onChange={(event) => onChange({ ...params, scope: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
          />
        </div>

        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
          >
            <Sparkles size={16} />
            Gerar Diagnóstico Socioeconômico (IA)
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition duration-200 hover:bg-white/10"
          >
            <RotateCcw size={15} />
            Resetar Simulação
          </button>
        </div>
      </div>
    </aside>
  );
}
