import { Html, Line } from '@react-three/drei';
import { Fuel, GraduationCap, Landmark, ShoppingCart, Stethoscope, Utensils, type LucideIcon } from 'lucide-react';
import { PLACES, PLACE_COLORS, type PlaceCategory } from './mapData';

const ICONS: Record<PlaceCategory, LucideIcon> = {
  bank: Landmark,
  supermarket: ShoppingCart,
  health: Stethoscope,
  education: GraduationCap,
  food: Utensils,
  fuel: Fuel,
};

const LABEL_HEIGHT = 7;

/** Etiqueta flutuante sobre cada lugar de interesse, ligada ao prédio por uma haste. */
export function Places() {
  return (
    <group>
      {PLACES.map((place) => {
        const Icon = ICONS[place.category];
        const color = PLACE_COLORS[place.category];
        return (
          <group key={`${place.name}-${place.x}-${place.z}`}>
            <Line
              points={[
                [place.x, 0.1, place.z],
                [place.x, LABEL_HEIGHT, place.z],
              ]}
              color={color}
              lineWidth={1.5}
            />
            <Html
              position={[place.x, LABEL_HEIGHT, place.z]}
              center
              zIndexRange={[5, 0]}
              wrapperClass="pointer-events-none select-none"
              style={{ pointerEvents: 'none' }}
            >
              <span
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border bg-slate-950/85 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur-sm"
                style={{ borderColor: color }}
              >
                <span className="grid size-4 place-items-center rounded" style={{ backgroundColor: color }}>
                  <Icon size={10} className="text-slate-950" />
                </span>
                {place.name}
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
