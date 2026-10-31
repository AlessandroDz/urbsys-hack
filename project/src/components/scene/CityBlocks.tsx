import { Html } from '@react-three/drei';
import { Coffee, Croissant, Pill, ShoppingBag, Wrench, type LucideIcon } from 'lucide-react';
import { SIDEWALK_TOP, blockSpans, createRandom } from './cityLayout';

export type CommerceKind = 'pharmacy' | 'bakery' | 'workshop' | 'market' | 'cafe';

interface CommerceSpec {
  kind: CommerceKind;
  name: string;
  categoryLabel: string;
}

interface CityBlock {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  park: boolean;
  commerce?: CommerceSpec;
  facingRotation: number;
  inImpactZone: boolean;
}

interface CommerceTheme {
  icon: LucideIcon;
  wallColor: string;
  trimColor: string;
  awningColor: string;
  windowEmissive: string;
  badgeBg: string;
  badgeText: string;
  badgeRing: string;
}

const COMMERCE_THEMES: Record<CommerceKind, CommerceTheme> = {
  pharmacy: {
    icon: Pill,
    wallColor: '#e2e8f0',
    trimColor: '#10b981',
    awningColor: '#059669',
    windowEmissive: '#6ee7b7',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeRing: 'ring-emerald-400/40',
  },
  bakery: {
    icon: Croissant,
    wallColor: '#e7e5e4',
    trimColor: '#f59e0b',
    awningColor: '#d97706',
    windowEmissive: '#fcd34d',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeRing: 'ring-amber-400/40',
  },
  workshop: {
    icon: Wrench,
    wallColor: '#475569',
    trimColor: '#f97316',
    awningColor: '#ea580c',
    windowEmissive: '#fdba74',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    badgeRing: 'ring-orange-400/40',
  },
  market: {
    icon: ShoppingBag,
    wallColor: '#cbd5e1',
    trimColor: '#0ea5e9',
    awningColor: '#0284c7',
    windowEmissive: '#7dd3fc',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    badgeRing: 'ring-sky-400/40',
  },
  cafe: {
    icon: Coffee,
    wallColor: '#d6d3d1',
    trimColor: '#f43f5e',
    awningColor: '#e11d48',
    windowEmissive: '#fda4af',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    badgeRing: 'ring-rose-400/40',
  },
};

const COMMERCE_BY_CELL: Record<string, CommerceSpec> = {
  '3,4': { kind: 'pharmacy', name: 'Farmácia Central', categoryLabel: 'Farmácia' },
  '4,3': { kind: 'bakery', name: 'Padaria Pão Dourado', categoryLabel: 'Padaria' },
  '4,4': { kind: 'workshop', name: 'Oficina AutoCenter', categoryLabel: 'Oficina' },
  '3,3': { kind: 'market', name: 'Mercadinho Avenida', categoryLabel: 'Mercado' },
  '2,4': { kind: 'workshop', name: 'Oficina União', categoryLabel: 'Oficina' },
  '5,3': { kind: 'pharmacy', name: 'Drogaria Saúde', categoryLabel: 'Farmácia' },
  '3,2': { kind: 'bakery', name: 'Confeitaria & Pães', categoryLabel: 'Padaria' },
  '4,5': { kind: 'cafe', name: 'Café da Praça', categoryLabel: 'Cafeteria' },
  '2,2': { kind: 'pharmacy', name: 'Farmácia Popular', categoryLabel: 'Farmácia' },
  '5,5': { kind: 'workshop', name: 'Auto Mecânica Sul', categoryLabel: 'Oficina' },
  '1,3': { kind: 'bakery', name: 'Padaria São José', categoryLabel: 'Padaria' },
};

const PALETTE = ['#94a3b8', '#64748b', '#cbd5e1', '#a8a29e', '#78716c', '#475569', '#7c8b99', '#b8c4cf', '#d6d3d1', '#4f7f7a'];
const PARK_COLOR = '#2f4a40';
const PARK_HEIGHT = 0.2;
const IMPACT_RADIUS = 17;

function computeFacingRotation(cx: number, cz: number): number {
  if (Math.abs(cx) < Math.abs(cz)) {
    return cz > 0 ? Math.PI : 0;
  }
  return cx > 0 ? -Math.PI / 2 : Math.PI / 2;
}

function generateCityBlocks(): CityBlock[] {
  const random = createRandom(2026);
  const spans = blockSpans();
  const blocks: CityBlock[] = [];

  spans.forEach((xs, ix) => {
    spans.forEach((zs, iz) => {
      const cellW = xs.max - xs.min;
      const cellD = zs.max - zs.min;
      const cx = (xs.min + xs.max) / 2;
      const cz = (zs.min + zs.max) / 2;
      const commerce = COMMERCE_BY_CELL[`${ix},${iz}`];
      const inImpactZone = Math.hypot(cx, cz) <= IMPACT_RADIUS;
      const facingRotation = computeFacingRotation(cx, cz);

      if (commerce) {
        random();
        const theme = COMMERCE_THEMES[commerce.kind];
        const heightByKind: Record<CommerceKind, number> = {
          pharmacy: 2.3,
          bakery: 2.1,
          workshop: 1.9,
          market: 2.5,
          cafe: 2.0,
        };
        blocks.push({
          x: cx,
          z: cz,
          w: cellW * 0.84,
          d: cellD * 0.84,
          h: heightByKind[commerce.kind],
          color: theme.wallColor,
          park: false,
          commerce,
          facingRotation,
          inImpactZone,
        });
        return;
      }

      if (random() < 0.12) {
        blocks.push({
          x: cx,
          z: cz,
          w: cellW,
          d: cellD,
          h: PARK_HEIGHT,
          color: PARK_COLOR,
          park: true,
          facingRotation,
          inImpactZone,
        });
        return;
      }

      const w = cellW * (0.7 + random() * 0.2);
      const d = cellD * (0.7 + random() * 0.2);
      const h = random() < 0.2 ? 6 + random() * 5 : 1.2 + random() * 3.2;
      const color = PALETTE[Math.floor(random() * PALETTE.length)];
      blocks.push({
        x: cx + (random() - 0.5) * (cellW - w) * 0.5,
        z: cz + (random() - 0.5) * (cellD - d) * 0.5,
        w,
        d,
        h,
        color,
        park: false,
        facingRotation,
        inImpactZone,
      });
    });
  });

  return blocks;
}

const CITY_BLOCKS = generateCityBlocks();

function PharmacyRoofSign({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.16, 0.4, 0.16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.75, 0.22, 0.2]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.2]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.85} />
      </mesh>
    </group>
  );
}

function BakeryRoofDetails({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[-0.65, 0.4, -0.5]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.8, 12]} />
        <meshStandardMaterial color="#9a3412" roughness={0.85} />
      </mesh>
      <mesh position={[-0.65, 0.82, -0.5]}>
        <cylinderGeometry args={[0.25, 0.25, 0.08, 12]} />
        <meshStandardMaterial color="#431407" />
      </mesh>
      <mesh position={[0.3, 0.28, 0.4]} castShadow>
        <boxGeometry args={[1.1, 0.36, 0.14]} />
        <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

function WorkshopDetails({ w, d, h }: { w: number; d: number; h: number }) {
  return (
    <group>
      {/* Portão metálico de oficina */}
      <mesh position={[0, 0.62, d / 2 + 0.015]}>
        <planeGeometry args={[w * 0.56, 1.15]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.5} />
      </mesh>
      {/* Carro estacionado no pátio da oficina */}
      <group position={[0, 0.22, d / 2 + 0.52]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.15, 0.36, 0.58]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.58, 0.22, 0.5]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>
      {/* Placa superior da oficina */}
      <mesh position={[0, h + 0.28, 0]} castShadow>
        <boxGeometry args={[1.3, 0.36, 0.16]} />
        <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

function CommercialBuilding({ block, active }: { block: CityBlock; active: boolean }) {
  const commerce = block.commerce!;
  const theme = COMMERCE_THEMES[commerce.kind];
  const Icon = theme.icon;
  const isAffected = active && block.inImpactZone;

  return (
    <group position={[block.x, SIDEWALK_TOP, block.z]}>
      <group rotation={[0, block.facingRotation, 0]}>
        {/* Piso destacado do lote comercial */}
        <mesh position={[0, 0.015, 0]} receiveShadow>
          <boxGeometry args={[block.w + 0.35, 0.03, block.d + 0.35]} />
          <meshStandardMaterial color={isAffected ? '#4c1d24' : '#475569'} roughness={0.9} />
        </mesh>

        {/* Corpo principal do prédio */}
        <mesh position={[0, block.h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[block.w, block.h, block.d]} />
          <meshStandardMaterial color={theme.wallColor} flatShading roughness={0.7} metalness={0.08} />
        </mesh>

        {/* Faixa de topo / platibanda */}
        <mesh position={[0, block.h + 0.07, 0]} castShadow>
          <boxGeometry args={[block.w + 0.08, 0.14, block.d + 0.08]} />
          <meshStandardMaterial color={theme.trimColor} roughness={0.5} />
        </mesh>

        {/* Toldo frontal */}
        <mesh position={[0, 1.15, block.d / 2 + 0.2]} rotation={[0.25, 0, 0]} castShadow>
          <boxGeometry args={[block.w * 0.78, 0.1, 0.45]} />
          <meshStandardMaterial color={theme.awningColor} roughness={0.6} />
        </mesh>

        {/* Vitrine iluminada (quando não for oficina) */}
        {commerce.kind !== 'workshop' && (
          <mesh position={[0, 0.58, block.d / 2 + 0.015]}>
            <planeGeometry args={[block.w * 0.66, 0.82]} />
            <meshStandardMaterial
              color={theme.windowEmissive}
              emissive={theme.windowEmissive}
              emissiveIntensity={0.55}
              roughness={0.2}
            />
          </mesh>
        )}

        {/* Detalhes específicos por tipo de comércio */}
        {commerce.kind === 'pharmacy' && <PharmacyRoofSign y={block.h + 0.14} />}
        {commerce.kind === 'bakery' && <BakeryRoofDetails y={block.h + 0.14} />}
        {commerce.kind === 'workshop' && <WorkshopDetails w={block.w} d={block.d} h={block.h} />}
      </group>

      {/* Marcador flutuante no mapa */}
      <Html
        position={[0, block.h + 1.45, 0]}
        center
        zIndexRange={[5, 0]}
        wrapperClass="pointer-events-none select-none"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-lg backdrop-blur-md transition-colors duration-300 ${
            isAffected
              ? 'border-rose-400/60 bg-rose-950/85 text-rose-100 shadow-rose-950/50'
              : 'border-white/15 bg-slate-950/80 text-slate-100 shadow-black/50'
          }`}
        >
          <span className={`grid size-4 place-items-center rounded-full ring-1 ${theme.badgeBg} ${theme.badgeText} ${theme.badgeRing}`}>
            <Icon size={10} strokeWidth={2.4} />
          </span>
          <span>{commerce.name}</span>
          {isAffected && <span className="size-1.5 animate-pulse rounded-full bg-rose-400" title="Comércio na zona de impacto" />}
        </div>
      </Html>
    </group>
  );
}

interface CityBlocksProps {
  active?: boolean;
}

export function CityBlocks({ active = false }: CityBlocksProps) {
  return (
    <group>
      {CITY_BLOCKS.map((block, index) => {
        if (block.commerce) {
          return <CommercialBuilding key={index} block={block} active={active} />;
        }

        if (block.park) {
          return (
            <mesh key={index} position={[block.x, SIDEWALK_TOP + PARK_HEIGHT / 2, block.z]} receiveShadow>
              <boxGeometry args={[block.w, PARK_HEIGHT, block.d]} />
              <meshStandardMaterial color={block.color} roughness={1} />
            </mesh>
          );
        }

        return (
          <mesh key={index} position={[block.x, SIDEWALK_TOP + block.h / 2, block.z]} castShadow receiveShadow>
            <boxGeometry args={[block.w, block.h, block.d]} />
            <meshStandardMaterial color={block.color} flatShading roughness={0.75} metalness={0.05} />
          </mesh>
        );
      })}
    </group>
  );
}
