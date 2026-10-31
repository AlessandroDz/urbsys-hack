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
    title: 'Construção de Mergulhão',
    description: 'Trincheira subterrânea para o tráfego da avenida principal.',
    icon: ArrowDownToLine,
    defaultScope: 'Escavação em trincheira na avenida principal com desvio pela via paralela',
    defaultLevel: 'total',
    defaultDuration: 8,
    impact: {
      shops: 42,
      busLines: 5,
      bikeKm: 0.6,
      travelGainPct: 38,
      realEstateGainPct: 18,
      co2TonsYear: 620,
      legacyHighlight: 'Fim dos conflitos entre pedestres e veículos na travessia central',
    },
  },
  viaduct: {
    id: 'viaduct',
    title: 'Novo Viaduto',
    description: 'Estrutura elevada que libera o cruzamento central do semáforo.',
    icon: ArrowUpToLine,
    defaultScope: 'Estrutura elevada com pilares laterais e vigas pré-moldadas sobre o cruzamento',
    defaultLevel: 'partial',
    defaultDuration: 6,
    impact: {
      shops: 28,
      busLines: 3,
      bikeKm: 0.9,
      travelGainPct: 31,
      realEstateGainPct: 12,
      co2TonsYear: 410,
      legacyHighlight: 'Fluxo contínuo sem semáforos na avenida principal',
    },
  },
  resurfacing: {
    id: 'resurfacing',
    title: 'Recapeamento de Via',
    description: 'Renovação da camada asfáltica com nova sinalização horizontal.',
    icon: Construction,
    defaultScope: 'Fresagem e recapeamento asfáltico das faixas com nova sinalização viária',
    defaultLevel: 'partial',
    defaultDuration: 4,
    impact: {
      shops: 15,
      busLines: 1,
      bikeKm: 0.8,
      travelGainPct: 12,
      realEstateGainPct: 6,
      co2TonsYear: 120,
      legacyHighlight: 'Pavimento novo com menos ruído e manutenção reduzida por uma década',
    },
  },
  bikeLane: {
    id: 'bikeLane',
    title: 'Implantação de Ciclovia',
    description: 'Faixa segregada para bicicletas ao longo da avenida.',
    icon: Bike,
    defaultScope: 'Ciclofaixa segregada com canteiro, balizadores e sinalização horizontal',
    defaultLevel: 'partial',
    defaultDuration: 5,
    impact: {
      shops: 9,
      busLines: 0,
      bikeKm: 1.4,
      travelGainPct: 9,
      realEstateGainPct: 10,
      co2TonsYear: 210,
      legacyHighlight: 'Rede cicloviária contínua conectando bairros às estações de ônibus',
    },
  },
};

export const WORK_IDS = Object.keys(WORK_DEFINITIONS) as WorkId[];

export function isWorkId(value: string): value is WorkId {
  return WORK_IDS.includes(value as WorkId);
}
