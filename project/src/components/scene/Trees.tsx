import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import { getTrees } from './mapData';

const TRUNK_HEIGHT = 1.0;
const CROWN_RADIUS = 0.8;

export function Trees() {
  const spots = useMemo(getTrees, []);
  const trunks = useRef<InstancedMesh>(null);
  const crowns = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const trunkMesh = trunks.current;
    const crownMesh = crowns.current;
    if (!trunkMesh || !crownMesh) return;

    const matrix = new Matrix4();
    const position = new Vector3();
    const scale = new Vector3();
    const identity = new Quaternion();
    const color = new Color();

    spots.forEach((tree, i) => {
      scale.setScalar(tree.scale);
      matrix.compose(position.set(tree.x, (TRUNK_HEIGHT / 2) * tree.scale, tree.z), identity, scale);
      trunkMesh.setMatrixAt(i, matrix);

      scale.set(tree.scale, tree.scale * 0.85, tree.scale);
      matrix.compose(position.set(tree.x, (TRUNK_HEIGHT + CROWN_RADIUS * 0.4) * tree.scale, tree.z), identity, scale);
      crownMesh.setMatrixAt(i, matrix);
      crownMesh.setColorAt(i, color.setHSL(0.27 + tree.tint * 0.06, 0.4, 0.14 + tree.tint * 0.08));
    });
    trunkMesh.instanceMatrix.needsUpdate = true;
    crownMesh.instanceMatrix.needsUpdate = true;
    if (crownMesh.instanceColor) crownMesh.instanceColor.needsUpdate = true;
  }, [spots]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, TRUNK_HEIGHT, 6]} />
        <meshStandardMaterial color="#5b4636" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[CROWN_RADIUS, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>
    </group>
  );
}
