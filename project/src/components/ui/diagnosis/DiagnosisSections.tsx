import {
  Activity,
  Bike,
  Bus,
  Clock,
  Coins,
  Landmark,
  Leaf,
  Percent,
  Route,
  Ruler,
  Store,
  TrafficCone,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Diagnosis } from '@/lib/diagnosis';
import { formatCompactBRL, formatDecimal, formatInteger } from '@/lib/format';
import { Badge, Metric, ProgressBar, SectionCard, TONE_STYLES, type Tone } from '../primitives';

function ListItems({ items, icon: Icon, tone }: { items: string[]; icon: LucideIcon; tone: Tone }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
          <Icon size={16} className={`mt-0.5 shrink-0 ${TONE_STYLES[tone].text}`} />
          <span className="text-sm leading-relaxed text-slate-200">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ShockSection({ shock }: { shock: Diagnosis['shock'] }) {
  return (
    <SectionCard index={1} title="Impacto Imediato (O Choque)" icon={Activity} tone="rose">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Store size={16} className="text-rose-300" />
          <h4 className="text-sm font-medium text-slate-200">Comércios Afetados</h4>
        </div>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-semibold tabular-nums text-slate-100">{formatInteger(shock.shops)}</p>
          <p className="pb-1 text-sm text-slate-400">estabelecimentos na zona de risco</p>
        </div>
        <div className="mt-4 space-y-4">
          <ProgressBar
            label="Queda estimada no faturamento local"
            valueLabel={`-${shock.revenueDropPct}%`}
            percent={shock.revenueDropPct}
            tone="rose"
          />
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Perda mensal estimada"
              value={formatCompactBRL(shock.monthlyLossBRL)}
              hint="por mês de obra"
              tone="rose"
            />
            <Metric
              label="Perda no período"
              value={formatCompactBRL(shock.periodLossBRL)}
              hint="acumulado durante a obra"
              tone="rose"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Bus size={16} className="text-amber-300" />
          <h4 className="text-sm font-medium text-slate-200">Transporte Público</h4>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="amber">{shock.busLines} linhas desviadas</Badge>
          <Badge tone="amber">
            <Clock size={12} className="mr-1.5" />+{shock.extraMinutes} min no tempo de viagem
          </Badge>
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Bike size={16} className="text-emerald-300" />
          <h4 className="text-sm font-medium text-slate-200">Mobilidade Ativa</h4>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Ruler size={16} className="text-emerald-300" />
          <span>
            <span className="font-semibold text-emerald-300">{formatDecimal(shock.bikeKm)} km</span> de ciclovias
            impactadas
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

export function MitigationSection({ mitigation }: { mitigation: Diagnosis['mitigation'] }) {
  return (
    <SectionCard index={2} title="Plano de Mitigação Recomendado pela IA" icon={Route} tone="sky">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrafficCone size={16} className="text-sky-300" />
          <h4 className="text-sm font-medium text-slate-200">Ações para o trânsito</h4>
        </div>
        <ListItems items={mitigation.traffic} icon={Route} tone="sky" />
      </div>
      <div className="border-t border-white/10 pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Wallet size={16} className="text-emerald-300" />
          <h4 className="text-sm font-medium text-slate-200">Ações econômicas</h4>
        </div>
        <ListItems items={mitigation.economic} icon={Coins} tone="emerald" />
      </div>
    </SectionCard>
  );
}

export function LegacySection({ legacy }: { legacy: Diagnosis['legacy'] }) {
  return (
    <SectionCard index={3} title="Legado Pós-Obra (ROI Social e Econômico)" icon={Landmark} tone="emerald">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Tempo de travessia" value={`-${legacy.travelGainPct}%`} hint="no cruzamento" tone="emerald" />
        <Metric label="Valorização" value={`+${legacy.realEstateGainPct}%`} hint="imóveis do entorno" tone="emerald" />
        <Metric label="Emissão de CO2" value={`-${formatInteger(legacy.co2TonsYear)} t`} hint="por ano" tone="emerald" />
      </div>
      <ProgressBar
        label="Ganho de fluidez na travessia"
        valueLabel={`${legacy.travelGainPct}%`}
        percent={legacy.travelGainPct}
        tone="emerald"
      />
      <ul className="space-y-2.5">
        {legacy.highlights.map((item, index) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-slate-200">
            {index === 0 ? (
              <Percent size={16} className="mt-0.5 shrink-0 text-emerald-300" />
            ) : index === 1 ? (
              <TrendingUp size={16} className="mt-0.5 shrink-0 text-emerald-300" />
            ) : (
              <Leaf size={16} className="mt-0.5 shrink-0 text-emerald-300" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
