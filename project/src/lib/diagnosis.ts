import type { BlockLevel, WorkDefinition } from '@/lib/interventions';

const AVERAGE_MONTHLY_REVENUE_BRL = 38000;
const TOTAL_CLOSURE_MULTIPLIER = 1.4;

export interface WorkParams {
  duration: number;
  level: BlockLevel;
  scope: string;
}

export interface Diagnosis {
  workTitle: string;
  params: WorkParams;
  shock: {
    shops: number;
    revenueDropPct: number;
    monthlyLossBRL: number;
    periodLossBRL: number;
    busLines: number;
    extraMinutes: number;
    bikeKm: number;
  };
  mitigation: {
    traffic: string[];
    economic: string[];
  };
  legacy: {
    travelGainPct: number;
    realEstateGainPct: number;
    co2TonsYear: number;
    highlights: string[];
  };
}

export function computeDiagnosis(work: WorkDefinition, params: WorkParams): Diagnosis {
  const { duration, level, scope } = params;
  const isTotal = level === 'total';
  const multiplier = isTotal ? TOTAL_CLOSURE_MULTIPLIER : 1;
  const { impact } = work;

  const shops = Math.round(impact.shops * multiplier);
  const revenueDropPct = Math.min(55, Math.max(2, Math.round(2 + duration * 1.1 * multiplier)));
  const monthlyLossBRL = shops * AVERAGE_MONTHLY_REVENUE_BRL * (revenueDropPct / 100);
  const periodLossBRL = monthlyLossBRL * duration;

  const busLines = Math.round(impact.busLines * multiplier);
  const extraMinutes = busLines === 0 ? 0 : Math.round((2 + busLines * 0.8) * multiplier);

  const traffic = [
    'Sincronizar onda verde na R. Aluysio Simões e R. Camilo Gianordoli nos horários de pico da FAESA (7h–8h30 e 18h–19h30)',
    'Garantir acesso sinalizado ao estacionamento da FAESA pela R. Anselmo Serrate e R. João Vieira',
  ];
  if (busLines > 0) {
    traffic.push('Operar faixa prioritária provisória para linhas do Transcol/Municipal no eixo Av. Vitória ↔ Av. Mal. Campos');
  }
  if (isTotal) {
    traffic.push('Instalar painéis de mensagem variável (PMV) na altura do IFES e da Av. Cezar Hilal indicando desvios');
  }
  if (duration >= 6) {
    traffic.push('Concentrar etapas críticas e ruidosas em janela noturna (22h30 às 5h) após o encerramento do turno noturno da FAESA');
  }
  if (work.id === 'bikeLane') {
    traffic.push('Manter travessia de pedestres e ciclistas protegida junto à Passarela FAESA durante toda a obra');
  }

  const iptuPct = isTotal ? 50 : 30;
  const monthsLabel = duration === 1 ? 'mês' : 'meses';
  const economic = [
    `Isenção temporária de ${iptuPct}% do IPTU para comércios da Av. Vitória e entorno da FAESA durante os ${duration} ${monthsLabel} de obra`,
    'Linha de microcrédito com juros subsidiados para restaurantes, padarias e serviços automotivos do polígono afetado',
    'Campanha de incentivo ao consumo universitário nos estabelecimentos parceiros de Monte Belo e Ilha de Santa Maria',
  ];
  if (revenueDropPct >= 20) {
    economic.push('Programa de compensação emergencial para comércios locais com queda de faturamento superior a 20%');
  }

  return {
    workTitle: work.title,
    params: { duration, level, scope },
    shock: {
      shops,
      revenueDropPct,
      monthlyLossBRL,
      periodLossBRL,
      busLines,
      extraMinutes,
      bikeKm: impact.bikeKm,
    },
    mitigation: { traffic, economic },
    legacy: {
      travelGainPct: impact.travelGainPct,
      realEstateGainPct: impact.realEstateGainPct,
      co2TonsYear: impact.co2TonsYear,
      highlights: [
        `Redução de ${impact.travelGainPct}% no tempo de travessia da Av. Vitória em frente à FAESA`,
        `Valorização imobiliária estimada em ${impact.realEstateGainPct}% para o comércio de Monte Belo e Ilha de Santa Maria`,
        `Redução de ${impact.co2TonsYear} toneladas de CO2 por ano no corredor da Av. Vitória`,
        impact.legacyHighlight,
      ],
    },
  };
}
