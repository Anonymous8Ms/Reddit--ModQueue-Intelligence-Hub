// ============================================================================
// ACTIVE MODERATORS COMPONENT
// ============================================================================

import type { CSSProperties } from 'react';
import { formatTimeAgo } from './api';
import type { ModPresence } from '../shared/types';

type Props = {
  moderators: ModPresence[];
};

export function ActiveModerators({ moderators }: Props) {
  if (moderators.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Active Moderators</h3>
        <p style={styles.empty}>No moderators online</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Active Moderators</h3>
        <span style={styles.count}>{moderators.length} live</span>
      </div>
      <div style={styles.list}>
        {moderators.map((mod) => (
          <div key={mod.username} style={styles.modItem}>
            <div style={styles.avatar}>
              {mod.username.charAt(0).toUpperCase()}
            </div>
            <div style={styles.info}>
              <span style={styles.username}>{mod.username}</span>
              <span style={styles.seen}>
                Seen {formatTimeAgo(mod.lastSeen)}
              </span>
            </div>
            <div style={styles.online} />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    background:
      'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid rgba(71, 85, 105, 0.32)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#f9fafb',
  },
  count: {
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    color: '#5eead4',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  empty: {
    color: '#94a3b8',
    fontSize: '13px',
    margin: 0,
  },
  list: {},
  modItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(71, 85, 105, 0.35)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 600,
    fontSize: '14px',
  },
  info: {
    flex: 1,
  },
  username: {
    display: 'block',
    fontSize: '14px',
    color: '#f9fafb',
  },
  seen: {
    display: 'block',
    fontSize: '11px',
    color: '#94a3b8',
  },
  online: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    boxShadow: '0 0 0 6px rgba(34, 197, 94, 0.12)',
  },
};
