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

  const traffic = ['Sincronizar onda verde na via paralela das 17h às 19h'];
  if (busLines > 0) {
    traffic.push('Criar corredor exclusivo provisório para ônibus na via paralela');
  }
  if (isTotal) {
    traffic.push('Instalar painéis de mensagem variável 2 km antes do bloqueio com rotas alternativas');
  }
  if (duration >= 6) {
    traffic.push('Concentrar atividades ruidosas em janelas noturnas para liberar a via no horário de pico');
  }
  if (work.id === 'bikeLane') {
    traffic.push('Manter ciclofaixa provisória protegida por balizadores durante a obra');
  }

  const iptuPct = isTotal ? 50 : 30;
  const monthsLabel = duration === 1 ? 'mês' : 'meses';
  const economic = [
    `Isenção temporária de ${iptuPct}% do IPTU para CNPJs do polígono afetado durante os ${duration} ${monthsLabel} de obra`,
    'Linha de crédito com juros subsidiados para capital de giro do comércio local',
    'Vale-consumo para moradores do entorno em estabelecimentos do polígono afetado',
  ];
  if (revenueDropPct >= 20) {
    economic.push('Programa de compensação para lojas com queda de faturamento acima de 20%');
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
        `Redução de ${impact.travelGainPct}% no tempo de travessia do cruzamento`,
        `Valorização imobiliária estimada em ${impact.realEstateGainPct}% para o comércio local`,
        `Redução de ${impact.co2TonsYear} toneladas de CO2 por ano na região`,
        impact.legacyHighlight,
      ],
    },
  };
}
