import { ArrowDownToLine, ArrowUpToLine, Bike, Construction, type LucideIcon } from 'lucide-react';

export type WorkId = 'underpass' | 'viaduct' | 'resurfacing' | 'bikeLane';
export type BlockLevel = 'partial' | 'total';

export interface WorkImpactProfile {
  shops: number;
  busLines: number;
  bikeKm: number;
  travelGainPct: number;
  realEstateGainPct: number;
  co2TonsYear: number;
  legacyHighlight: string;
}

export interface WorkDefinition {
  id: WorkId;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultScope: string;
  defaultLevel: BlockLevel;
  defaultDuration: number;
  impact: WorkImpactProfile;
}

export const DURATION_RANGE = { min: 1, max: 24 } as const;

export const WORK_DEFINITIONS: Record<WorkId, WorkDefinition> = {
  underpass: {
    id: 'underpass',
    title: 'Mergulhão Av. Vitória × Mal. Campos',
    description: 'Trincheira subterrânea na Av. Vitória em frente ao campus da FAESA.',
    icon: ArrowDownToLine,
    defaultScope: 'Escavação em trincheira na Av. Vitória com desvio pelas ruas Aluysio Simões e Camilo Gianordoli',
    defaultLevel: 'total',
    defaultDuration: 8,
    impact: {
      shops: 42,
      busLines: 6,
      bikeKm: 0.8,
      travelGainPct: 38,
      realEstateGainPct: 18,
      co2TonsYear: 620,
      legacyHighlight: 'Travessia livre sem retenção semafórica em frente à FAESA e integração com a passarela',
    },
  },
  viaduct: {
    id: 'viaduct',
    title: 'Viaduto Av. Vitória · Monte Belo',
    description: 'Estrutura elevada liberando o cruzamento da Av. Vitória com a Av. Mal. Campos.',
    icon: ArrowUpToLine,
    defaultScope: 'Estrutura elevada sobre o cruzamento da Av. Vitória preservando o acesso local à FAESA',
    defaultLevel: 'partial',
    defaultDuration: 6,
    impact: {
      shops: 28,
      busLines: 4,
      bikeKm: 0.9,
      travelGainPct: 31,
      realEstateGainPct: 12,
      co2TonsYear: 410,
      legacyHighlight: 'Fluxo contínuo na Av. Vitória e redução de filas nos horários de entrada e saída da FAESA',
    },
  },
  resurfacing: {
    id: 'resurfacing',
    title: 'Recapeamento da Av. Vitória',
    description: 'Renovação asfáltica e sinalização no trecho FAESA – Ilha de Santa Maria.',
    icon: Construction,
    defaultScope: 'Fresagem e recapeamento das faixas da Av. Vitória com reforço de travessia universitária',
    defaultLevel: 'partial',
    defaultDuration: 4,
    impact: {
      shops: 15,
      busLines: 2,
      bikeKm: 0.8,
      travelGainPct: 12,
      realEstateGainPct: 6,
      co2TonsYear: 120,
      legacyHighlight: 'Pavimento de alta durabilidade, menor ruído próximo às salas de aula e nova sinalização',
    },
  },
  bikeLane: {
    id: 'bikeLane',
    title: 'Ciclovia Universitária Av. Vitória',
    description: 'Corredor cicloviário segregado conectando o eixo IFES ↔ FAESA.',
    icon: Bike,
    defaultScope: 'Ciclovia segregada no canteiro da Av. Vitória com bicicletários integrados ao campus FAESA',
    defaultLevel: 'partial',
    defaultDuration: 5,
    impact: {
      shops: 9,
      busLines: 0,
      bikeKm: 1.6,
      travelGainPct: 9,
      realEstateGainPct: 10,
      co2TonsYear: 210,
      legacyHighlight: 'Corredor seguro de mobilidade ativa para estudantes entre o IFES, a FAESA e pontos de ônibus',
    },
  },
};

export const WORK_IDS = Object.keys(WORK_DEFINITIONS) as WorkId[];

export function isWorkId(value: string): value is WorkId {
  return WORK_IDS.includes(value as WorkId);
}
