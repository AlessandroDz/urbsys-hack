import { useCallback, useEffect, useState } from 'react';
import type { Placement } from '@/components/scene/CityScene';
import { computeDiagnosis, type Diagnosis, type WorkParams } from '@/lib/diagnosis';
import { WORK_DEFINITIONS, type WorkId } from '@/lib/interventions';

export type DiagnosisStatus = 'idle' | 'loading' | 'ready';

const DIAGNOSIS_DELAY_MS = 1500;

export function useUrbanSimulation() {
  const [activeWork, setActiveWork] = useState<WorkId | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [params, setParams] = useState<WorkParams>({ duration: 6, level: 'partial', scope: '' });
  const [status, setStatus] = useState<DiagnosisStatus>('idle');
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const definition = activeWork ? WORK_DEFINITIONS[activeWork] : null;

  const selectWork = useCallback((id: WorkId, point: Placement) => {
    const work = WORK_DEFINITIONS[id];
    setActiveWork(id);
    setPlacement(point);
    setParams({ duration: work.defaultDuration, level: work.defaultLevel, scope: work.defaultScope });
    setStatus('idle');
    setDiagnosis(null);
    setDrawerOpen(false);
  }, []);

  const resetSimulation = useCallback(() => {
    setActiveWork(null);
    setStatus('idle');
    setDiagnosis(null);
    setDrawerOpen(false);
  }, []);

  const updateParams = useCallback((next: WorkParams) => {
    setParams(next);
  }, []);

  const generateDiagnosis = useCallback(() => {
    if (!definition) return;
    setDrawerOpen(true);
    setStatus('loading');
  }, [definition]);

  useEffect(() => {
    if (status !== 'loading' || !definition) return;
    const timer = window.setTimeout(() => {
      setDiagnosis(computeDiagnosis(definition, params));
      setStatus('ready');
    }, DIAGNOSIS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [status, definition, params]);

  return {
    activeWork,
    placement,
    definition,
    params,
    status,
    diagnosis,
    drawerOpen,
    setDrawerOpen,
    selectWork,
    resetSimulation,
    updateParams,
    generateDiagnosis,
  };
}
