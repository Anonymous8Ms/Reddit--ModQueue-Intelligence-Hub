// ============================================================================
// MODQUEUE ITEM CARD COMPONENT
// ============================================================================

import { useState } from 'react';
import { api, getPriorityColor, getPriorityLevel, formatTimeAgo } from './api';
import type { EnrichedModQueueItem, ItemClaim, UserContext } from '../shared/types';

type Props = {
  item: EnrichedModQueueItem;
  onClaim?: (itemId: string, claimed: boolean) => void;
  onContextRequest?: (userId: string, username: string) => void;
};

export function ModQueueCard({ item, onClaim, onContextRequest }: Props) {
  const [claiming, setClaiming] = useState(false);
  const [claim, setClaim] = useState(item.claim);

  const priorityColor = getPriorityColor(item.priority.score);
  const priorityLevel = getPriorityLevel(item.priority.score);
  const isPost = item.kind === 't3';
  const isClaimed = !!claim;

  const handleClaim = async () => {
    setClaiming(true);
    try {
      if (isClaimed) {
        const res = await api.releaseItem(item.id);
        if (res.success) {
          setClaim(undefined);
          onClaim?.(item.id, false);
        }
      } else {
        const res = await api.claimItem(item.id);
        if (res.success && res.claim) {
          setClaim(res.claim);
          onClaim?.(item.id, true);
        } else if (res.existingClaim) {
          setClaim(res.existingClaim);
        }
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleContextClick = () => {
    onContextRequest?.(item.author.id, item.author.name);
  };

  return (
    <div style={styles.card}>
      {/* Priority Badge */}
      <div style={{ ...styles.priorityBadge, backgroundColor: priorityColor }}>
        {item.priority.score.toFixed(1)}
      </div>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.type}>{isPost ? 'POST' : 'COMMENT'}</span>
        <span style={styles.time}>{formatTimeAgo(item.createdUtc * 1000)}</span>
      </div>

      {/* Title */}
      {isPost && item.title && (
        <h3 style={styles.title}>{item.title}</h3>
      )}

      {/* Body Preview */}
      <p style={styles.body}>
        {item.body.length > 150 ? item.body.substring(0, 150) + '...' : item.body}
      </p>

      {/* Author */}
      <div style={styles.author}>
        <span style={styles.authorLabel}>by</span>
        <button style={styles.authorBtn} onClick={handleContextClick}>
          {item.author.name}
        </button>
        {item.context && (
          <span style={styles.accountAge}>
            {item.context.accountAgeDays < 30 ? `(${item.context.accountAgeDays}d)` : ''}
          </span>
        )}
      </div>

      {/* Meta Info */}
      <div style={styles.meta}>
        <span style={styles.reports}>📋 {item.numReports} reports</span>
        {item.priority.factors.hasKeywords && (
          <span style={styles.keywordBadge}>⚠️ Keywords</span>
        )}
      </div>

      {/* Claim Status */}
      {claim && (
        <div style={styles.claimStatus}>
          <span style={styles.claimIcon}>👤</span>
          <span>Claimed by {claim.claimedBy}</span>
        </div>
      )}

      {/* Priority Reasoning */}
      <div style={styles.reasoning}>
        <span style={{ color: priorityColor }}>{priorityLevel.toUpperCase()}</span>
        <span style={styles.reasoningText}>: {item.priority.reasoning}</span>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          style={{
            ...styles.claimBtn,
            backgroundColor: isClaimed ? '#6b7280' : '#3b82f6',
          }}
          onClick={handleClaim}
          disabled={claiming}
        >
          {claiming ? '...' : isClaimed ? 'Release' : 'Claim'}
        </button>
        <button style={styles.contextBtn} onClick={handleContextClick}>
          View Context
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    position: 'relative',
    border: '1px solid #374151',
  },
  priorityBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '12px',
  },
  type: {
    backgroundColor: '#374151',
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#9ca3af',
  },
  time: {
    color: '#6b7280',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#f9fafb',
  },
  body: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#d1d5db',
    lineHeight: 1.5,
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  authorLabel: {
    color: '#6b7280',
  },
  authorBtn: {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    cursor: 'pointer',
    padding: 0,
    fontSize: '14px',
  },
  accountAge: {
    color: '#f97316',
    fontSize: '12px',
  },
  meta: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
    fontSize: '13px',
  },
  reports: {
    color: '#ef4444',
  },
  keywordBadge: {
    color: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  claimStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '6px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#93c5fd',
  },
  claimIcon: {
    fontSize: '16px',
  },
  reasoning: {
    fontSize: '12px',
    marginBottom: '12px',
  },
  reasoningText: {
    color: '#9ca3af',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  claimBtn: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
  },
  contextBtn: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #3b82f6',
    backgroundColor: 'transparent',
    color: '#60a5fa',
    cursor: 'pointer',
    fontSize: '14px',
  },
};