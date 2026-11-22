import type { CrowdingCategory, TransitMode } from '../data/types';

export interface CrowdingVisualMeta {
  label: string;
  shortNote: string;
  textClass: string;
  barClass: string;
  surfaceClass: string;
  barWidthPct: number;
}

export function getCrowdingVisualMeta(
  category: CrowdingCategory | 'Unavailable',
  index: number | null
): CrowdingVisualMeta {
  const width = index !== null ? Math.max(8, Math.min(100, index)) : 0;

  switch (category) {
    case 'Low':
      return {
        label: 'Low crowding',
        shortNote: 'Ample standing & seating space (test category)',
        textClass: 'text-emerald-700',
        barClass: 'bg-emerald-600',
        surfaceClass: 'bg-emerald-50/70 border-emerald-200',
        barWidthPct: width || 24,
      };
    case 'Moderate':
      return {
        label: 'Moderate crowding',
        shortNote: 'Steady passenger load (test category)',
        textClass: 'text-amber-700',
        barClass: 'bg-amber-500',
        surfaceClass: 'bg-amber-50/70 border-amber-200',
        barWidthPct: width || 50,
      };
    case 'High':
      return {
        label: 'High crowding',
        shortNote: 'Busy corridor load (test category)',
        textClass: 'text-orange-700',
        barClass: 'bg-orange-600',
        surfaceClass: 'bg-orange-50/70 border-orange-200',
        barWidthPct: width || 74,
      };
    case 'Very High':
      return {
        label: 'Very High crowding',
        shortNote: 'Peak congestion level (test category)',
        textClass: 'text-red-700',
        barClass: 'bg-red-600',
        surfaceClass: 'bg-red-50/70 border-red-200',
        barWidthPct: width || 90,
      };
    default:
      return {
        label: 'Unavailable',
        shortNote: 'No crowding record in active dataset',
        textClass: 'text-slate-600',
        barClass: 'bg-slate-400',
        surfaceClass: 'bg-slate-50 border-slate-200',
        barWidthPct: 0,
      };
  }
}

export function formatModeLabel(mode: TransitMode | 'all'): string {
  switch (mode) {
    case 'metro':
      return 'Delhi Metro';
    case 'bus':
      return 'DTC Bus';
    case 'multimodal':
      return 'Metro + Bus';
    case 'all':
    default:
      return 'All Modes';
  }
}
