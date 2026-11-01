import { useMemo } from 'react';
import { getBuildingGeometries } from './mapData';

interface CityBlocksProps {
  active?: boolean;
}

export function CityBlocks({ active = false }: CityBlocksProps) {
  const { near, far } = useMemo(getBuildingGeometries, []);

  return (
    <group>
      {far && (
        <mesh geometry={far} castShadow receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.85} />
        </mesh>
      )}
      {/* Prédios dentro do raio de impacto da obra acendem quando há intervenção */}
      {near && (
        <mesh geometry={near} castShadow receiveShadow>
          <meshStandardMaterial
            vertexColors
            roughness={0.85}
            emissive={active ? '#f59e0b' : '#000000'}
            emissiveIntensity={active ? 0.18 : 0}
          />
        </mesh>
      )}
    </group>
  );
}
