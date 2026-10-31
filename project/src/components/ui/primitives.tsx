import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export const GLASS_PANEL = 'border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/40 backdrop-blur-xl';

export type Tone = 'sky' | 'amber' | 'emerald' | 'rose';

export const TONE_STYLES: Record<Tone, { text: string; bar: string; badge: string; tile: string }> = {
  sky: {
    text: 'text-sky-300',
    bar: 'bg-sky-400',
    badge: 'bg-sky-400/15 text-sky-200 ring-sky-400/30',
    tile: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
  },
  amber: {
    text: 'text-amber-300',
    bar: 'bg-amber-400',
    badge: 'bg-amber-400/15 text-amber-200 ring-amber-400/30',
    tile: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  },
  emerald: {
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/30',
    tile: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  },
  rose: {
    text: 'text-rose-300',
    bar: 'bg-rose-400',
    badge: 'bg-rose-400/15 text-rose-200 ring-rose-400/30',
    tile: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
  },
};

interface SectionCardProps {
  index: number;
  title: string;
  icon: LucideIcon;
  tone: Tone;
  children: ReactNode;
}

export function SectionCard({ index, title, icon: Icon, tone, children }: SectionCardProps) {
  return (
    <section className={`rounded-2xl ${GLASS_PANEL} p-5`}>
      <header className="mb-5 flex items-center gap-3">
        <span className={`grid size-9 place-items-center rounded-xl ring-1 ${TONE_STYLES[tone].tile}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Bloco {index}</p>
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${TONE_STYLES[tone].badge}`}>
      {children}
    </span>
  );
}

interface ProgressBarProps {
  label: string;
  valueLabel: string;
  percent: number;
  tone: Tone;
}

export function ProgressBar({ label, valueLabel, percent, tone }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={`font-semibold ${TONE_STYLES[tone].text}`}>{valueLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${TONE_STYLES[tone].bar} transition-[width] duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
  hint: string;
  tone: Tone;
}

export function Metric({ label, value, hint, tone }: MetricProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${TONE_STYLES[tone].text}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
