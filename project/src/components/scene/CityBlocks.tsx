import { useMemo } from 'react';
import { Vector4, type MeshStandardMaterial } from 'three';
import { IMPACT_RADIUS, getBuildingGeometry, type RoofSampler, type WorkSiteFrame } from './mapData';

interface CityBlocksProps {
  active?: boolean;
  night: boolean;
  site: WorkSiteFrame;
  sampleRoof: RoofSampler | undefined;
  highlightPlaces: boolean;
}

type Shader = Parameters<NonNullable<MeshStandardMaterial['onBeforeCompile']>>[0];

export function CityBlocks({ active = false, night, site, sampleRoof, highlightPlaces }: CityBlocksProps) {
  const geometry = useMemo(() => getBuildingGeometry(sampleRoof, highlightPlaces), [sampleRoof, highlightPlaces]);
  // x, z do centro da obra, raio de impacto e intensidade (0 = sem obra)
  const siteUniform = useMemo(() => ({ value: new Vector4() }), []);
  const nightUniform = useMemo(() => ({ value: 0 }), []);
  siteUniform.value.set(site.center[0], site.center[1], IMPACT_RADIUS, active ? 1 : 0);
  nightUniform.value = night ? 1 : 0;

  const onBeforeCompile = useMemo(
    () => (shader: Shader) => {
      shader.uniforms.uSite = siteUniform;
      shader.uniforms.uNight = nightUniform;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBPos;\nvarying vec3 vBNormal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBPos = transformed;\nvBNormal = normal;');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform vec4 uSite;
          uniform float uNight;
          varying vec3 vBPos;
          varying vec3 vBNormal;
          float bHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }`,
        )
        // janelas em grade nas paredes, com variação por janela (a malha está na origem: posição local = mundo)
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          vec3 bn = normalize(vBNormal);
          float isWall = 1.0 - step(0.5, abs(bn.y));
          vec2 cell = vec2(dot(vBPos.xz, vec2(-bn.z, bn.x)), vBPos.y / 1.067);
          vec2 f = fract(cell);
          float windowMask = step(0.2, f.x) * step(f.x, 0.8) * step(0.3, f.y) * step(f.y, 0.78) * step(1.0, vBPos.y) * isWall;
          float windowRnd = bHash(floor(cell));
          vec3 glass = mix(vec3(0.2, 0.28, 0.36), vec3(0.55, 0.68, 0.78), windowRnd);
          diffuseColor.rgb = mix(diffuseColor.rgb, glass, windowMask * 0.85);`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float siteGlow = uSite.w * (1.0 - smoothstep(uSite.z * 0.8, uSite.z, distance(vBPos.xz, uSite.xy)));
          totalEmissiveRadiance += vec3(0.96, 0.62, 0.04) * 0.18 * siteGlow;
          totalEmissiveRadiance += vec3(1.0, 0.78, 0.4) * windowMask * step(0.55, windowRnd) * uNight * 0.9;`,
        );
    },
    [siteUniform, nightUniform],
  );

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      {/* Prédios dentro do raio de impacto da obra acendem quando há intervenção */}
      <meshStandardMaterial vertexColors roughness={0.8} onBeforeCompile={onBeforeCompile} />
    </mesh>
  );
}
