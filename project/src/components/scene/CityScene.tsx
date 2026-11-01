import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type DragEvent } from 'react';
import { MOUSE, Plane, Raycaster, TOUCH, Vector2, Vector3 } from 'three';
import { isWorkId, type BlockLevel, type WorkId } from '@/lib/interventions';
import { CityBlocks } from './CityBlocks';
import { Pedestrians } from './Pedestrians';
import { Ground, Roads } from './Roads';
import { Traffic } from './Traffic';
import { WorkSite } from './WorkSite';
import { Campus } from './Campus';
import { Trees } from './Trees';
import type { Layers } from './layers';
import { useSatellite } from './useSatellite';
import { CLOSURE_RADIUS, createSite, type Vec2 } from './mapData';
import { ROAD_TOP } from './cityLayout';

/** Ponto do mapa (x, z) onde a obra foi colocada. */
export type Placement = Vec2;

const DEFAULT_PLACEMENT: Placement = [0, 0];

export interface CitySceneHandle {
  /** ponto do mapa no centro da tela */
  viewCenter: () => Placement;
}

interface CitySceneProps {
  activeWork: WorkId | null;
  level: BlockLevel;
  placement: Placement | null;
  layers: Layers;
  onDropWork: (id: WorkId, point: Placement) => void;
}

interface Bridge {
  project: (clientX: number, clientY: number) => Placement | null;
  viewCenter: () => Placement;
}

/** Dá ao DOM acesso à câmera: converte posição na tela em ponto do mapa. */
function SceneBridge({ bridgeRef }: { bridgeRef: { current: Bridge | null } }) {
  const { camera, gl, get } = useThree();

  bridgeRef.current = useMemo<Bridge>(() => {
    const raycaster = new Raycaster();
    const ground = new Plane(new Vector3(0, 1, 0), 0);
    const hit = new Vector3();
    return {
      project: (clientX, clientY) => {
        const rect = gl.domElement.getBoundingClientRect();
        const ndc = new Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        return raycaster.ray.intersectPlane(ground, hit) ? [hit.x, hit.z] : null;
      },
      viewCenter: () => {
        const controls = get().controls as unknown as { target: Vector3 } | null;
        return controls ? [controls.target.x, controls.target.z] : DEFAULT_PLACEMENT;
      },
    };
  }, [camera, gl, get]);

  return null;
}

function DropPreview({ point }: { point: Placement }) {
  return (
    <group position={[point[0], ROAD_TOP + 0.05, point[1]]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[CLOSURE_RADIUS - 0.25, CLOSURE_RADIUS, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} depthTest={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[CLOSURE_RADIUS, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} depthTest={false} />
      </mesh>
    </group>
  );
}

export const CityScene = forwardRef<CitySceneHandle, CitySceneProps>(function CityScene(
  { activeWork, level, placement, layers, onDropWork },
  ref,
) {
  const night = layers.night;
  const satellite = useSatellite();
  const bridgeRef = useRef<Bridge | null>(null);
  const [dropPoint, setDropPoint] = useState<Placement | null>(null);
  const site = useMemo(() => createSite(placement ?? DEFAULT_PLACEMENT), [placement]);

  useImperativeHandle(ref, () => ({ viewCenter: () => bridgeRef.current?.viewCenter() ?? DEFAULT_PLACEMENT }), []);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDropPoint(bridgeRef.current?.project(event.clientX, event.clientY) ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropPoint(null);
    const id = event.dataTransfer.getData('text/plain');
    const point = bridgeRef.current?.project(event.clientX, event.clientY);
    if (isWorkId(id) && point) onDropWork(id, point);
  };

  return (
    <div className="absolute inset-0" onDragOver={handleDragOver} onDragLeave={() => setDropPoint(null)} onDrop={handleDrop}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={[night ? '#050914' : '#a9c3d9']} />
        <OrthographicCamera makeDefault position={[60, 60, 60]} zoom={9} near={0.1} far={1000} />
        <SceneBridge bridgeRef={bridgeRef} />
        <ambientLight intensity={night ? 0.35 : 0.35} />
        <hemisphereLight args={night ? ['#475569', '#1e293b', 0.55] : ['#ffffff', '#7a7a70', 0.6]} />
        <directionalLight
          position={[80, 140, 60]}
          color={night ? '#9db4ff' : '#fff1dc'}
          intensity={night ? 0.45 : 1.25}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
          shadow-camera-near={1}
          shadow-camera-far={400}
        />
        <Ground texture={layers.satellite ? satellite.texture : null} night={night} />
        <Roads showRoads={layers.roads || !layers.satellite} showLabels={layers.labels} />
        {layers.buildings && satellite.ready && (
          <CityBlocks active={activeWork !== null} night={night} site={site} sampleRoof={satellite.sampleRoof} />
        )}
        {layers.trees && <Trees />}
        {layers.campus && <Campus />}
        {layers.pedestrians && <Pedestrians active={activeWork !== null} level={level} site={site} />}
        {layers.traffic && <Traffic active={activeWork !== null} level={level} site={site} />}
        {activeWork && <WorkSite key={`${activeWork}-${site.center.join()}`} workId={activeWork} level={level} site={site} />}
        {dropPoint && <DropPreview point={dropPoint} />}
        <OrbitControls
          makeDefault
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.08}
          minZoom={3}
          maxZoom={60}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.1}
          enablePan
          screenSpacePanning={false}
          zoomToCursor
          mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }}
          touches={{ ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE }}
        />
      </Canvas>
    </div>
  );
});
