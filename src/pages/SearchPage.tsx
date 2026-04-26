import { useState } from 'react';
import { Input } from 'antd';
import { useStore } from '../hooks';
import { catalog } from '../catalog';
import { makeT } from '../i18n';
import SoundCard from '../components/SoundCard';

export default function SearchPage() {
  const lang = useStore((s) => s.lang);
  const tr = makeT(lang);
  const [q, setQ] = useState('');

  const trimmed = q.trim();
  const results = trimmed ? catalog.search(trimmed, lang) : [];
  const countLabel = tr(
    results.length === 1 ? 'search.count_one' : 'search.count_many',
    { n: results.length },
  );

  return (
    <div>
      <Input.Search
        size="large"
        allowClear
        autoFocus
        placeholder={`${tr('label.search')}…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onSearch={setQ}
        autoComplete="off"
        spellCheck={false}
        inputMode="search"
        style={{ marginBottom: 24 }}
      />
      {!trimmed ? (
        <div className="sl-empty">
          <span className="sl-empty-emoji" aria-hidden="true">🔎</span>
          {tr('search.hint')}
        </div>
      ) : results.length === 0 ? (
        <div className="sl-empty">
          <span className="sl-empty-emoji" aria-hidden="true">🤔</span>
          {tr('search.no_match', { q: trimmed })}
        </div>
      ) : (
        <>
          <div className="sl-page-head">
            <span className="sl-page-count">{countLabel}</span>
          </div>
          <div className="sl-grid">
            {results.map((preset) => (
              <SoundCard key={preset.id} preset={preset} tr={tr} lang={lang} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
