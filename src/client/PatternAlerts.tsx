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
      <div style={styles.headerBar}>
        <span style={styles.kicker}>Pattern Detection</span>
        <span style={styles.count}>{patterns.length} live alert{patterns.length === 1 ? '' : 's'}</span>
      </div>
      {patterns.map((p, i) => (
        <div
          key={i}
          style={{
            ...styles.alert,
            borderLeftColor: getPatternColor(p.severity),
            boxShadow: `inset 0 1px 0 ${getPatternColor(p.severity)}22`,
          }}
        >
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
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  kicker: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  count: {
    fontSize: '12px',
    color: '#cbd5e1',
  },
  alert: {
    display: 'flex',
    gap: '12px',
    padding: '14px 16px',
    background:
      'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))',
    borderRadius: '16px',
    borderLeft: '4px solid',
    marginBottom: '8px',
    borderTop: '1px solid rgba(71, 85, 105, 0.24)',
    borderRight: '1px solid rgba(71, 85, 105, 0.24)',
    borderBottom: '1px solid rgba(71, 85, 105, 0.24)',
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
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: '#f9fafb',
  },
  severity: {
    fontSize: '11px',
    fontWeight: 700,
  },
  desc: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: 1.5,
  },
  items: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  itemBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
    border: 'none',
    borderRadius: '999px',
    padding: '4px 9px',
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
