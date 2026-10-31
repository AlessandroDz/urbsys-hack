import { Building2 } from 'lucide-react';
import { GLASS_PANEL } from './primitives';

interface HeaderProps {
  isCritical: boolean;
}

export function Header({ isCritical }: HeaderProps) {
  const statusLabel = isCritical ? 'Crítico' : 'Fluido';
  const averageSpeed = isCritical ? 11 : 46;
  const dotClass = isCritical ? 'bg-rose-400' : 'bg-emerald-400';
  const pingClass = isCritical ? 'bg-rose-400' : 'bg-emerald-400';
  const textClass = isCritical ? 'text-rose-300' : 'text-emerald-300';

  return (
    <header className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-3 md:left-6 md:top-6">
      <div className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${GLASS_PANEL}`}>
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-slate-950 shadow-lg shadow-sky-900/40">
          <Building2 size={18} strokeWidth={2.25} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-slate-100">UrbisAI</p>
          <p className="text-xs text-slate-400">Simulador de Impacto Urbano</p>
        </div>
      </div>

      <div className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${GLASS_PANEL}`}>
        <span className="relative flex size-2.5">
          <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${pingClass}`} />
          <span className={`relative inline-flex size-2.5 rounded-full ${dotClass}`} />
        </span>
        <div className="leading-tight">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Trânsito em tempo real</p>
          <p className="text-sm font-semibold">
            <span className={textClass}>{statusLabel}</span>
            <span className="ml-2 font-normal text-slate-400">{averageSpeed} km/h médios</span>
          </p>
        </div>
      </div>
    </header>
  );
}
