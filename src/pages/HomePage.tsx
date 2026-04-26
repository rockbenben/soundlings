import { useEffect, useState } from 'react';
import { Segmented } from 'antd';
import { useStore } from '../hooks';
import { store } from '../store';
import { catalog, type Preset } from '../catalog';
import { makeT } from '../i18n';
import SoundCard from '../components/SoundCard';
import VariantMenu from '../components/VariantMenu';

export default function HomePage() {
  const lang = useStore((s) => s.lang);
  const currentTab = useStore((s) => s.currentTab);
  const tr = makeT(lang);

  const [variantPreset, setVariantPreset] = useState<{
    preset: Preset;
    anchor: HTMLElement;
  } | null>(null);

  const categories = catalog.categories();

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(currentTab)) {
      store.set({ currentTab: categories[0] });
    }
  }, [currentTab, categories]);

  const presets = catalog.byCategory(currentTab);

  const options = categories.map((cat) => ({
    label: tr(`tab.${cat}`),
    value: cat,
  }));

  const tabLabel = tr(`tab.${currentTab}`);
  const countLabel = tr(
    presets.length === 1 ? 'home.count_one' : 'home.count_many',
    { n: presets.length },
  );

  return (
    <div>
      <div className="sl-page-head">
        <h2 className="sl-page-title">{tabLabel}</h2>
        <span className="sl-page-count">{countLabel}</span>
      </div>
      <div className="sl-cat-row">
        <Segmented<string>
          options={options}
          value={currentTab}
          onChange={(value) => store.set({ currentTab: value })}
          size="large"
        />
      </div>
      {presets.length === 0 ? (
        <div className="sl-empty">
          <span className="sl-empty-emoji" aria-hidden="true">🤷</span>
          {tr('home.empty')}
        </div>
      ) : (
        <div className="sl-grid">
          {presets.map((preset) => (
            <SoundCard
              key={preset.id}
              preset={preset}
              tr={tr}
              lang={lang}
              onLongPress={(p, a) => setVariantPreset({ preset: p, anchor: a })}
            />
          ))}
        </div>
      )}
      <VariantMenu
        preset={variantPreset?.preset ?? null}
        anchor={variantPreset?.anchor ?? null}
        onClose={() => setVariantPreset(null)}
      />
    </div>
  );
}
