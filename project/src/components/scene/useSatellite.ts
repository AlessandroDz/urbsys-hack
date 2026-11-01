import { useEffect, useState } from 'react';
import { SRGBColorSpace, Texture } from 'three';
import satelliteUrl from '@/assets/satellite.jpg';
import { SATELLITE_HALF, type RoofSampler } from './mapData';

export interface Satellite {
  /** false enquanto a imagem carrega; depois de falhar fica true com texture nula */
  ready: boolean;
  texture: Texture | null;
  sampleRoof: RoofSampler | undefined;
}

const LOADING: Satellite = { ready: false, texture: null, sampleRoof: undefined };

/** Carrega a imagem de satélite e permite ler a cor do telhado visto do alto em qualquer ponto da cena. */
export function useSatellite(): Satellite {
  const [state, setState] = useState<Satellite>(LOADING);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context?.drawImage(image, 0, 0);
      const pixels = context?.getImageData(0, 0, image.width, image.height).data;

      const texture = new Texture(image);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;

      const sampleRoof: RoofSampler | undefined = pixels
        ? (x, z) => {
            const px = Math.round((x / (SATELLITE_HALF * 2) + 0.5) * image.width);
            const py = Math.round((z / (SATELLITE_HALF * 2) + 0.5) * image.height);
            if (px < 1 || py < 1 || px >= image.width - 1 || py >= image.height - 1) return null;
            let r = 0;
            let g = 0;
            let b = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const i = ((py + dy) * image.width + (px + dx)) * 4;
                r += pixels[i];
                g += pixels[i + 1];
                b += pixels[i + 2];
              }
            }
            return [r / 9 / 255, g / 9 / 255, b / 9 / 255];
          }
        : undefined;

      setState({ ready: true, texture, sampleRoof });
    };
    image.onerror = () => {
      if (!cancelled) setState({ ready: true, texture: null, sampleRoof: undefined });
    };
    image.src = satelliteUrl;

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
