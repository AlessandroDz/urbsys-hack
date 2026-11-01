import { GripVertical } from 'lucide-react';
import { WORK_IDS, WORK_DEFINITIONS, type WorkId } from '@/lib/interventions';
import { GLASS_PANEL } from './primitives';

interface InterventionsPanelProps {
  activeWork: WorkId | null;
  hidden: boolean;
  onSelect: (id: WorkId) => void;
}

export function InterventionsPanel({ activeWork, hidden, onSelect }: InterventionsPanelProps) {
  return (
    <aside
      className={`absolute right-4 top-4 z-10 w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-5 transition-all duration-500 ease-out md:right-6 md:top-6 ${GLASS_PANEL} ${
        hidden ? 'pointer-events-none translate-x-[calc(100%+2rem)] opacity-0' : 'animate-panel-in'
      }`}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Intervenções · Av. Vitória</h2>
        <p className="mt-1 text-xs text-slate-400">Arraste uma obra para qualquer rua do mapa, ou clique para colocá-la no centro da tela</p>
      </div>

      <ul className="space-y-2.5">
        {WORK_IDS.map((id) => {
          const work = WORK_DEFINITIONS[id];
          const Icon = work.icon;
          const isActive = activeWork === id;
          return (
            <li key={id}>
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', id);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onSelect(id)}
                aria-pressed={isActive}
                className={`group flex w-full cursor-grab items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white/10 active:cursor-grabbing ${
                  isActive
                    ? 'border-sky-400/60 bg-sky-500/15 shadow-lg shadow-sky-900/30'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 transition ${
                    isActive ? 'bg-sky-400/25 text-sky-200 ring-sky-300/50' : 'bg-sky-400/10 text-sky-300 ring-sky-400/20'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-100">{work.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-400">{work.description}</span>
                </span>
                <GripVertical size={16} className="shrink-0 text-slate-500 transition group-hover:text-slate-300" />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
