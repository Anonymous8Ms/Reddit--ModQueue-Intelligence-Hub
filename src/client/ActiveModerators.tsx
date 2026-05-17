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
      <h3 style={styles.title}>
        Active Moderators
        <span style={styles.count}>{moderators.length}</span>
      </h3>
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
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  count: {
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  empty: {
    color: '#6b7280',
    fontSize: '13px',
    margin: 0,
  },
  list: {},
  modItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #374151',
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
    color: '#6b7280',
  },
  online: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
  },
};
