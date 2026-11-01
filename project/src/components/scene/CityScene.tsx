import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import type { BlockLevel, WorkId } from '@/lib/interventions';
import { CityBlocks } from './CityBlocks';
import { Pedestrians } from './Pedestrians';
import { Ground, Roads } from './Roads';
import { Traffic } from './Traffic';
import { WORK_FRAME } from './mapData';
import { WorkSite } from './WorkSite';

interface CitySceneProps {
  activeWork: WorkId | null;
  level: BlockLevel;
}

export function CityScene({ activeWork, level }: CitySceneProps) {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={['#050914']} />
      <OrthographicCamera makeDefault position={[WORK_FRAME.center[0] + 60, 60, WORK_FRAME.center[1] + 60]} zoom={9} near={0.1} far={1000} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#dbeafe', '#0f172a', 0.5]} />
      <directionalLight
        position={[80, 140, 60]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-near={1}
        shadow-camera-far={400}
      />
      <Ground />
      <Roads />
      <CityBlocks active={activeWork !== null} />
      <Pedestrians active={activeWork !== null} level={level} />
      <Traffic active={activeWork !== null} level={level} />
      {activeWork && <WorkSite key={activeWork} workId={activeWork} level={level} />}
      <OrbitControls
        makeDefault
        target={[WORK_FRAME.center[0], 0, WORK_FRAME.center[1]]}
        enableDamping
        dampingFactor={0.08}
        minZoom={3}
        maxZoom={60}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        enablePan
        screenSpacePanning={false}
      />
    </Canvas>
  );
}
