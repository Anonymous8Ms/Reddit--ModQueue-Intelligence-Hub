// ============================================================================
// PATTERN ALERT COMPONENT
// ============================================================================

import type { CSSProperties } from 'react';
import { getPatternIcon, getPatternColor } from './api';
import type { DetectedPattern } from '../shared/types';

type Props = {
  patterns: DetectedPattern[];
  onItemClick?: (itemId: string) => void;
};

export function PatternAlerts({ patterns, onItemClick }: Props) {
  if (patterns.length === 0) return null;

  return (
    <div style={styles.container}>
      {patterns.map((p, i) => (
        <div key={i} style={{ ...styles.alert, borderLeftColor: getPatternColor(p.severity) }}>
          <span style={styles.icon}>{getPatternIcon(p.type)}</span>
          <div style={styles.content}>
            <div style={styles.header}>
              <span style={styles.type}>{p.type.replace('_', ' ').toUpperCase()}</span>
              <span style={{ ...styles.severity, color: getPatternColor(p.severity) }}>
                {p.severity.toUpperCase()}
              </span>
            </div>
            <p style={styles.desc}>{p.description}</p>
            <div style={styles.items}>
              {p.affectedItems.slice(0, 3).map((id) => (
                <button key={id} style={styles.itemBtn} onClick={() => onItemClick?.(id)}>
                  {id.substring(0, 8)}...
                </button>
              ))}
              {p.affectedItems.length > 3 && (
                <span style={styles.more}>+{p.affectedItems.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    marginBottom: '16px',
  },
  alert: {
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    borderLeft: '4px solid',
    marginBottom: '8px',
  },
  icon: {
    fontSize: '24px',
  },
  content: {
    flex: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  type: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#f9fafb',
  },
  severity: {
    fontSize: '10px',
    fontWeight: 700,
  },
  desc: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#d1d5db',
  },
  items: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  itemBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    border: 'none',
    borderRadius: '4px',
    padding: '2px 8px',
    color: '#60a5fa',
    fontSize: '11px',
    cursor: 'pointer',
  },
  more: {
    fontSize: '11px',
    color: '#6b7280',
    alignSelf: 'center',
  },
};
