import type { CSSProperties } from 'react';
import { formatTimeAgo } from './api';

type Props = {
  itemCount: number;
  moderatorCount: number;
  lastUpdated: number | null;
};

const DEMO_STEPS = [
  'Report or remove test content, then refresh after Reddit surfaces it.',
  'Claim a high-priority item before reviewing to avoid collisions.',
  'Open View Context for karma, account age, recent activity, and prior actions.',
];

const LIVE_SIGNALS = [
  'Reads both native modqueue and reported items.',
  'Auto-refreshes every 30 seconds.',
  'Shows the top 10 highest-priority items first.',
];

export function ModeratorGuide({ itemCount, moderatorCount, lastUpdated }: Props) {
  return (
    <section style={styles.card}>
      <h3 style={styles.title}>Moderator Guide</h3>

      <div style={styles.statusGrid}>
        <div style={styles.statusPill}>
          <span style={styles.statusLabel}>Queue</span>
          <span style={styles.statusValue}>{itemCount} live</span>
        </div>
        <div style={styles.statusPill}>
          <span style={styles.statusLabel}>Active Mods</span>
          <span style={styles.statusValue}>{moderatorCount}</span>
        </div>
      </div>

      <p style={styles.syncText}>
        Last sync {lastUpdated ? formatTimeAgo(lastUpdated) : 'pending'}.
        If you just filed a report, give Reddit a minute before refreshing.
      </p>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>How To Demo</h4>
        {DEMO_STEPS.map((item) => (
          <p key={item} style={styles.lineItem}>
            {item}
          </p>
        ))}
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Live Coverage</h4>
        {LIVE_SIGNALS.map((item) => (
          <p key={item} style={styles.lineItem}>
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid #334155',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#f9fafb',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    marginBottom: '12px',
  },
  statusPill: {
    backgroundColor: '#0f172a',
    borderRadius: '10px',
    padding: '10px 12px',
    border: '1px solid #334155',
  },
  statusLabel: {
    display: 'block',
    color: '#94a3b8',
    fontSize: '11px',
    marginBottom: '4px',
  },
  statusValue: {
    color: '#f8fafc',
    fontSize: '14px',
    fontWeight: 600,
  },
  syncText: {
    margin: '0 0 14px 0',
    color: '#cbd5e1',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  section: {
    marginTop: '12px',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    color: '#f8fafc',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  lineItem: {
    margin: '0 0 8px 0',
    color: '#cbd5e1',
    fontSize: '12px',
    lineHeight: 1.5,
  },
};
