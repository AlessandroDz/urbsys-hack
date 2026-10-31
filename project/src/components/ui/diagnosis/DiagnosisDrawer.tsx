import { useEffect, useState } from 'react';
import { LoaderCircle, Sparkles, X } from 'lucide-react';
import type { Diagnosis } from '@/lib/diagnosis';
import type { DiagnosisStatus } from '@/hooks/useUrbanSimulation';
import { GLASS_PANEL } from '../primitives';
import { LegacySection, MitigationSection, ShockSection } from './DiagnosisSections';

const LOADING_MESSAGES = [
  'Cruzando dados georreferenciados...',
  'Calculando impacto no comércio local...',
  'Mapeando rotas alternativas de ônibus...',
  'Modelando valorização do entorno...',
];
const MESSAGE_INTERVAL_MS = 375;

interface DiagnosisDrawerProps {
  open: boolean;
  status: DiagnosisStatus;
  diagnosis: Diagnosis | null;
  onClose: () => void;
}

export function DiagnosisDrawer({ open, status, diagnosis, onClose }: DiagnosisDrawerProps) {
  const isLoading = status === 'loading';

  return (
    <aside
      aria-hidden={!open}
      className={`absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-white/10 bg-slate-950/85 shadow-2xl shadow-black/60 backdrop-blur-2xl transition-[transform,visibility] duration-500 ease-out md:w-1/2 ${
        open ? 'visible translate-x-0' : 'invisible translate-x-full'
      }`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5 md:px-8">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-sky-300">
            <Sparkles size={13} />
            Diagnóstico Socioeconômico (IA)
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold text-slate-100">
            {diagnosis?.workTitle ?? 'Aguardando parâmetros'}
          </h2>
          {diagnosis && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-400">
              {diagnosis.params.scope || 'Escopo não informado'} · {diagnosis.params.duration}{' '}
              {diagnosis.params.duration === 1 ? 'mês' : 'meses'} · bloqueio{' '}
              {diagnosis.params.level === 'total' ? 'total' : 'parcial'}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar diagnóstico"
          className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-slate-100"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
        {isLoading && <LoadingState />}
        {status === 'ready' && diagnosis && (
          <div className="space-y-6 animate-panel-in">
            <ShockSection shock={diagnosis.shock} />
            <MitigationSection mitigation={diagnosis.mitigation} />
            <LegacySection legacy={diagnosis.legacy} />
          </div>
        )}
      </div>
    </aside>
  );
}

function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={`flex h-full min-h-[320px] flex-col items-center justify-center gap-5 rounded-2xl ${GLASS_PANEL} p-8 text-center`}>
      <LoaderCircle size={40} className="animate-spin text-sky-300" />
      <div>
        <p className="text-base font-medium text-slate-100">{LOADING_MESSAGES[messageIndex]}</p>
        <p className="mt-2 text-xs text-slate-400">Processando cenários de obra e dados do entorno</p>
      </div>
    </div>
  );
}
