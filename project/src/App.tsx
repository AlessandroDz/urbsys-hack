import { useRef, useState } from 'react';
import { CityScene, type CitySceneHandle } from '@/components/scene/CityScene';
import { DEFAULT_LAYERS, type Layers } from '@/components/scene/layers';
import { DiagnosisDrawer } from '@/components/ui/diagnosis/DiagnosisDrawer';
import { Header } from '@/components/ui/Header';
import { InterventionsPanel } from '@/components/ui/InterventionsPanel';
import { LayersPanel } from '@/components/ui/LayersPanel';
import { ParametersCard } from '@/components/ui/ParametersCard';
import { useUrbanSimulation } from '@/hooks/useUrbanSimulation';

export default function App() {
  const sim = useUrbanSimulation();
  const { activeWork, placement, definition, params, status, diagnosis, drawerOpen } = sim;

  const sceneRef = useRef<CitySceneHandle>(null);
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      <CityScene
        ref={sceneRef}
        activeWork={activeWork}
        level={params.level}
        placement={placement}
        layers={layers}
        onDropWork={sim.selectWork}
      />

      <LayersPanel layers={layers} onChange={setLayers} />

      <p className="pointer-events-none absolute bottom-1 left-2 z-10 text-[10px] text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
        Imagem: Esri, Maxar, Earthstar Geographics · Mapa: © colaboradores do OpenStreetMap
      </p>

      <Header isCritical={activeWork !== null} />

      <InterventionsPanel activeWork={activeWork} hidden={drawerOpen} onSelect={(id) => sim.selectWork(id, sceneRef.current?.viewCenter() ?? [0, 0])} />

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
          Arraste uma intervenção para qualquer rua · Arraste o mapa para mover · Botão direito para girar · Roda do mouse para zoom
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
