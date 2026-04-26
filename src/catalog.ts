import type { Lang } from './store';

export type Variant = {
  asset: string;
  loopable?: boolean;
  license?: string;
  labelSuffix?: string;
};

export type Preset = {
  id: string;
  category: string;
  iconKey: string;
  labels: Partial<Record<Lang, string>>;
  variants: Variant[];
};

type Manifest = {
  version?: number;
  presets: Preset[];
};

let presets: Preset[] = [];
let byIdMap = new Map<string, Preset>();

export const catalog = {
  async load(): Promise<void> {
    const res = await fetch('assets/manifest.json');
    if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
    const data = (await res.json()) as Manifest;
    presets = data.presets || [];
    byIdMap = new Map(presets.map((p) => [p.id, p]));
  },
  all(): Preset[] {
    return presets;
  },
  categories(): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of presets) {
      if (!seen.has(p.category)) {
        seen.add(p.category);
        out.push(p.category);
      }
    }
    return out;
  },
  byCategory(category: string): Preset[] {
    return presets.filter((p) => p.category === category);
  },
  byId(id: string): Preset | null {
    return byIdMap.get(id) ?? null;
  },
  search(query: string, _lang: Lang = 'en'): Preset[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return presets.filter((p) => {
      const fields = [
        p.iconKey ?? '',
        p.category ?? '',
        p.labels?.zh ?? '',
        p.labels?.en ?? '',
      ];
      return fields.some((f) => f.toLowerCase().includes(q));
    });
  },
  primaryAsset(preset: Preset | null): string | null {
    return preset?.variants?.[0]?.asset ?? null;
  },
  variantAsset(preset: Preset | null, index: number): string | null {
    return preset?.variants?.[index]?.asset ?? null;
  },
};
