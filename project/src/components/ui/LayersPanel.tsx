import { Building2, Car, GraduationCap, Footprints, Layers as LayersIcon, Moon, Route, Satellite, Sun, Tag, TreePine, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { Layers } from '@/components/scene/layers';
import { GLASS_PANEL } from './primitives';

interface LayersPanelProps {
  layers: Layers;
  onChange: (next: Layers) => void;
}

const ITEMS: Array<{ key: keyof Omit<Layers, 'night'>; label: string; icon: LucideIcon }> = [
  { key: 'satellite', label: 'Satélite', icon: Satellite },
  { key: 'buildings', label: 'Prédios 3D', icon: Building2 },
  { key: 'trees', label: 'Árvores', icon: TreePine },
  { key: 'campus', label: 'Destaque FAESA', icon: GraduationCap },
  { key: 'roads', label: 'Traçado das vias', icon: Route },
  { key: 'traffic', label: 'Tráfego', icon: Car },
  { key: 'pedestrians', label: 'Pedestres', icon: Footprints },
  { key: 'labels', label: 'Nomes das ruas', icon: Tag },
];

export function LayersPanel({ layers, onChange }: LayersPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <aside className={`absolute bottom-4 right-4 z-10 w-56 rounded-2xl p-3 md:bottom-6 md:right-6 ${GLASS_PANEL}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-1 text-sm font-semibold text-slate-100"
      >
        <LayersIcon size={16} className="text-sky-300" />
        Camadas
      </button>

      {open && (
        <div className="mt-3 space-y-1">
          {ITEMS.map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={(event) => onChange({ ...layers, [key]: event.target.checked })}
                className="size-3.5 accent-sky-400"
              />
              <Icon size={14} className="text-slate-400" />
              {label}
            </label>
          ))}

          <button
            type="button"
            onClick={() => onChange({ ...layers, night: !layers.night })}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
          >
            {layers.night ? <Sun size={14} /> : <Moon size={14} />}
            {layers.night ? 'Ver de dia' : 'Ver de noite'}
          </button>
        </div>
      )}
    </aside>
  );
}
