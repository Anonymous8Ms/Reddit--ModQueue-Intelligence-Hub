// ============================================================================
// MODQUEUE ITEM CARD COMPONENT
// ============================================================================

import { useEffect, useState, type CSSProperties } from 'react';
import { api, getPriorityColor, getPriorityLevel, formatTimeAgo } from './api';
import type { ClaimResponse, EnrichedModQueueItem, ItemClaim } from '../shared/api';

type Props = {
  item: EnrichedModQueueItem;
  onClaim?: (itemId: string, claim: ItemClaim | null) => void;
  onContextRequest?: (userId: string, username: string) => void;
};

export function ModQueueCard({ item, onClaim, onContextRequest }: Props) {
  const [claiming, setClaiming] = useState(false);
  const [claim, setClaim] = useState(item.claim);

  useEffect(() => {
    setClaim(item.claim);
  }, [item.claim]);

  const priorityColor = getPriorityColor(item.priority.score);
  const priorityLevel = getPriorityLevel(item.priority.score);
  const isPost = item.kind === 't3';
  const isClaimed = !!claim;
  const claimLabel = isClaimed ? `Claimed by ${claim.claimedBy}` : 'Available';

  const handleClaim = async () => {
    setClaiming(true);
    try {
      if (isClaimed) {
        const res = await api.releaseItem(item.id);
        if (res.success) {
          setClaim(undefined);
          onClaim?.(item.id, null);
        }
      } else {
        const res = await api.claimItem(item.id);
        syncClaimState(res);
      }
    } finally {
      setClaiming(false);
    }
  };

  const syncClaimState = (res: ClaimResponse) => {
    if (res.success && res.claim) {
      setClaim(res.claim);
      onClaim?.(item.id, res.claim);
      return;
    }

    if (res.existingClaim) {
      setClaim(res.existingClaim);
      onClaim?.(item.id, res.existingClaim);
    }
  };

  const handleContextClick = () => {
    onContextRequest?.(item.author.id, item.author.name);
  };

  return (
    <div
      style={{
        ...styles.card,
        borderColor: `${priorityColor}30`,
        boxShadow: `inset 0 1px 0 ${priorityColor}12, 0 16px 30px rgba(2, 6, 23, 0.18)`,
      }}
    >
      <div style={{ ...styles.cardAccent, backgroundColor: priorityColor }} />

      <div style={{ ...styles.priorityBadge, backgroundColor: priorityColor }}>
        {Math.round(item.priority.score)}
      </div>

      <div style={styles.header}>
        <span style={styles.type}>{isPost ? 'POST' : 'COMMENT'}</span>
        <span style={styles.time}>{formatTimeAgo(item.createdUtc * 1000)}</span>
      </div>

      {isPost && item.title && (
        <h3 style={styles.title}>{item.title}</h3>
      )}

      <p style={styles.body}>
        {item.body.length > 150 ? `${item.body.substring(0, 150)}...` : item.body}
      </p>

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

      <div style={styles.meta}>
        <span style={styles.reports}>{item.numReports} reports</span>
        {item.priority.factors.hasKeywords && (
          <span style={styles.keywordBadge}>Keywords flagged</span>
        )}
      </div>

      <div
        style={{
          ...styles.claimStatus,
          backgroundColor: isClaimed ? 'rgba(59, 130, 246, 0.14)' : 'rgba(100, 116, 139, 0.12)',
          color: isClaimed ? '#93c5fd' : '#cbd5e1',
          borderColor: isClaimed ? 'rgba(59, 130, 246, 0.24)' : 'rgba(100, 116, 139, 0.18)',
        }}
      >
        <span style={styles.claimIcon}>{isClaimed ? '🔒' : '○'}</span>
        <span>{claimLabel}</span>
      </div>

      <div style={styles.reasoning}>
        <span style={{ ...styles.reasoningLevel, color: priorityColor }}>{priorityLevel.toUpperCase()}</span>
        <span style={styles.reasoningText}>: {item.priority.reasoning}</span>
      </div>

      <div style={styles.actions}>
        <button
          style={{
            ...styles.claimBtn,
            backgroundColor: isClaimed ? '#475569' : '#2563eb',
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

const styles: Record<string, CSSProperties> = {
  card: {
    background:
      'linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
    borderRadius: '20px',
    padding: '18px',
    marginBottom: '14px',
    position: 'relative',
    border: '1px solid #374151',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
  },
  priorityBadge: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    minWidth: '42px',
    height: '42px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 800,
    fontSize: '14px',
    padding: '0 10px',
    boxShadow: '0 10px 18px rgba(15, 23, 42, 0.26)',
  },
  header: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    fontSize: '12px',
    alignItems: 'center',
  },
  type: {
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
    padding: '4px 9px',
    borderRadius: '999px',
    color: '#cbd5e1',
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  time: {
    color: '#94a3b8',
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    lineHeight: 1.3,
    fontWeight: 700,
    color: '#f9fafb',
    paddingRight: '64px',
  },
  body: {
    margin: '0 0 14px 0',
    fontSize: '14px',
    color: '#cbd5e1',
    lineHeight: 1.6,
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  authorLabel: {
    color: '#94a3b8',
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
    marginBottom: '10px',
    fontSize: '13px',
    flexWrap: 'wrap',
  },
  reports: {
    color: '#fecaca',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    padding: '4px 8px',
    borderRadius: '999px',
  },
  keywordBadge: {
    color: '#fdba74',
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
    padding: '4px 8px',
    borderRadius: '999px',
  },
  claimStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 10px',
    borderRadius: '10px',
    marginBottom: '10px',
    fontSize: '13px',
    border: '1px solid transparent',
  },
  claimIcon: {
    fontSize: '14px',
  },
  reasoning: {
    fontSize: '12px',
    marginBottom: '14px',
    lineHeight: 1.5,
  },
  reasoningLevel: {
    fontWeight: 800,
    letterSpacing: '0.04em',
  },
  reasoningText: {
    color: '#94a3b8',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  claimBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(96, 165, 250, 0.2)',
    color: 'white',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 12px 18px rgba(37, 99, 235, 0.18)',
  },
  contextBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(71, 85, 105, 0.75)',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};
