import React from 'react';
import { useStore } from '../lib/store';
import { groupByRecency } from '../lib/grouping';
import { EntryRow } from '../components/EntryRow';
import type { ScreenId } from '../lib/types';

export function Home({
  navigate,
  openEntry,
}: {
  navigate: (s: ScreenId) => void;
  openEntry: (id: string) => void;
}) {
  const { entries, featuredQuote, images } = useStore();
  const heroImage = images[0];
  const groups = groupByRecency(entries).slice(0, 2);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="screen">
      <h1 className="screen-title">{today}</h1>

      <section className="section">
        <div className="section-label">Today's words</div>
        <button className="card quote-card" onClick={() => navigate('words')}>
          {featuredQuote ? (
            <>
              <p className="quote-text">“{featuredQuote.text}”</p>
              {featuredQuote.source && <p className="quote-source">— {featuredQuote.source}</p>}
            </>
          ) : (
            <p className="empty-hint">Keep a quote to see it here.</p>
          )}
        </button>
      </section>

      <section className="section">
        <div className="section-label">Today's image</div>
        <button className="card image-hero" onClick={() => navigate('images')}>
          {heroImage ? (
            <img src={heroImage.dataUrl} alt="" />
          ) : (
            <p className="empty-hint">Add an image to see it here.</p>
          )}
        </button>
      </section>

      <section className="section">
        <div className="section-row">
          <div className="section-label">Recent entries</div>
          <button className="see-all" onClick={() => navigate('entries')}>
            See all
          </button>
        </div>
        {groups.length === 0 && <p className="empty-hint">No entries yet. Tap New to write one.</p>}
        {groups.map((group) => (
          <div key={group.label} className="entry-group">
            <div className="entry-group-label">{group.label}</div>
            {group.entries.map((e) => (
              <EntryRow key={e.id} entry={e} onOpen={openEntry} />
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
