import type { DragEvent } from 'react';
import { CityScene } from '@/components/scene/CityScene';
import { DiagnosisDrawer } from '@/components/ui/diagnosis/DiagnosisDrawer';
import { Header } from '@/components/ui/Header';
import { InterventionsPanel } from '@/components/ui/InterventionsPanel';
import { ParametersCard } from '@/components/ui/ParametersCard';
import { useUrbanSimulation } from '@/hooks/useUrbanSimulation';
import { isWorkId } from '@/lib/interventions';

export default function App() {
  const sim = useUrbanSimulation();
  const { activeWork, definition, params, status, diagnosis, drawerOpen } = sim;

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    if (isWorkId(id)) sim.selectWork(id);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      <div className="absolute inset-0" onDragOver={handleDragOver} onDrop={handleDrop}>
        <CityScene activeWork={activeWork} level={params.level} />
      </div>

      <Header isCritical={activeWork !== null} />

      <InterventionsPanel activeWork={activeWork} hidden={drawerOpen} onSelect={sim.selectWork} />

      {definition && (
        <ParametersCard
          work={definition}
          params={params}
          isGenerating={status === 'loading'}
          onChange={sim.updateParams}
          onGenerate={sim.generateDiagnosis}
          onReset={sim.resetSimulation}
        />
      )}

      {!definition && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs text-slate-400 backdrop-blur-xl md:block">
          Arraste uma intervenção para o mapa · Clique e arraste para girar · Use a roda do mouse para zoom
        </p>
      )}

      <DiagnosisDrawer
        open={drawerOpen}
        status={status}
        diagnosis={diagnosis}
        onClose={() => sim.setDrawerOpen(false)}
      />
    </div>
  );
}
