import React from 'react';
import { useStore } from '../lib/store';
import { avgWords, dayStreak, topTags } from '../lib/insights';
import { MoodLineChart } from '../components/MoodLineChart';
import type { ScreenId } from '../lib/types';

export function Insights({ navigate }: { navigate: (s: ScreenId) => void }) {
  const { entries } = useStore();
  const streak = dayStreak(entries);
  const avg = avgWords(entries);
  const tags = topTags(entries);
  const maxCount = tags.length > 0 ? tags[0].count : 1;

  return (
    <div className="screen">
      <h1 className="screen-title">Insights</h1>

      <section className="section stat-tiles">
        <div className="stat-tile">
          <div className="stat-number">{streak}</div>
          <div className="stat-label">day streak</div>
        </div>
        <button className="stat-tile stat-tile-link" onClick={() => navigate('entries')}>
          <div className="stat-number">{entries.length}</div>
          <div className="stat-label">total entries</div>
        </button>
        <div className="stat-tile">
          <div className="stat-number">{avg}</div>
          <div className="stat-label">avg. words</div>
        </div>
      </section>

      <section className="section">
        <div className="section-label">Mood, last 30 days</div>
        <div className="card">
          <MoodLineChart entries={entries} />
        </div>
      </section>

      <section className="section">
        <div className="section-label">Top tags</div>
        {tags.length === 0 ? (
          <p className="empty-hint">No tags yet.</p>
        ) : (
          <div className="tag-bars">
            {tags.slice(0, 8).map((t) => (
              <div key={t.tag} className="tag-bar-row">
                <span className="tag-bar-label">{t.tag}</span>
                <div className="tag-bar-track">
                  <div className="tag-bar-fill" style={{ width: `${(t.count / maxCount) * 100}%` }} />
                </div>
                <span className="tag-bar-count">{t.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
