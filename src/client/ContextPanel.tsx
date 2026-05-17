// ============================================================================
// CONTEXT PANEL COMPONENT (Modal/Popup)
// ============================================================================

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { api, formatTimeAgo, formatAccountAge } from './api';
import type { UserContext, RecentActivity, ModAction } from '../shared/types';

type Props = {
  userId: string;
  username: string;
  onClose: () => void;
};

const MIN_GRID_COLUMNS = 'repeat(auto-fit, minmax(140px, 1fr))';

export function ContextPanel({ userId, username, onClose }: Props) {
  const [context, setContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'modHistory'>('activity');

  const loadContext = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUserContext(userId, username);
      if (res.type === 'context') {
        setContext(res.context);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, username]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>User Context: {username}</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : context ? (
          <>
            {/* Stats Cards */}
            <div style={styles.statsGrid}>
              <StatCard label="Account Age" value={formatAccountAge(context.accountAgeDays)} />
              <StatCard label="Total Karma" value={context.karma.total.toLocaleString()} />
              <StatCard label="Post Karma" value={context.karma.post.toLocaleString()} />
              <StatCard label="Comment Karma" value={context.karma.comment.toLocaleString()} />
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
              <button
                style={{ ...styles.tab, ...(activeTab === 'activity' ? styles.tabActive : {}) }}
                onClick={() => setActiveTab('activity')}
              >
                Recent Activity ({context.recentActivity.length})
              </button>
              <button
                style={{ ...styles.tab, ...(activeTab === 'modHistory' ? styles.tabActive : {}) }}
                onClick={() => setActiveTab('modHistory')}
              >
                Mod History ({context.modActions.length})
              </button>
            </div>

            {/* Tab Content */}
            <div style={styles.tabContent}>
              {activeTab === 'activity' && (
                <ActivityList activities={context.recentActivity} />
              )}
              {activeTab === 'modHistory' && (
                <ModHistoryList actions={context.modActions} />
              )}
            </div>
          </>
        ) : (
          <div style={styles.error}>Failed to load context</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
    </div>
  );
}

function ActivityList({ activities }: { activities: RecentActivity[] }) {
  if (activities.length === 0) {
    return <div style={styles.empty}>No recent activity</div>;
  }
  return (
    <div style={styles.list}>
      {activities.map((a, i) => (
        <div key={i} style={styles.listItem}>
          <span style={styles.activityType}>{a.type === 'post' ? '📝' : '💬'}</span>
          <div style={styles.activityContent}>
            <span style={styles.activitySub}>r/{a.subreddit}</span>
            <span style={styles.activityText}>{a.content.substring(0, 80)}...</span>
            <span style={styles.activityTime}>{formatTimeAgo(a.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModHistoryList({ actions }: { actions: ModAction[] }) {
  if (actions.length === 0) {
    return <div style={styles.empty}>No mod actions on this user</div>;
  }
  return (
    <div style={styles.list}>
      {actions.map((a, i) => (
        <div key={i} style={styles.listItem}>
          <span style={styles.actionIcon}>
            {a.action === 'remove' ? '🗑️' : a.action === 'ban' ? '⛔' : '⚠️'}
          </span>
          <div style={styles.activityContent}>
            <span style={styles.activityType}>{a.action.toUpperCase()}</span>
            <span style={styles.activityText}>{a.details || 'No details'}</span>
            <span style={styles.activityTime}>
              by {a.modUsername} • {formatTimeAgo(a.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#111827',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #374151',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#f9fafb',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#6b7280',
    cursor: 'pointer',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#9ca3af',
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#ef4444',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: MIN_GRID_COLUMNS,
    gap: '12px',
    padding: '16px 20px',
    borderBottom: '1px solid #374151',
  },
  statCard: {
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  },
  statLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#9ca3af',
    marginBottom: '4px',
  },
  statValue: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 600,
    color: '#f9fafb',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #374151',
  },
  tab: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabActive: {
    color: '#3b82f6',
    borderBottom: '2px solid #3b82f6',
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },
  list: {},
  listItem: {
    display: 'flex',
    gap: '12px',
    padding: '10px',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  activityType: {
    fontSize: '20px',
  },
  activityContent: {
    flex: 1,
  },
  activitySub: {
    display: 'block',
    fontSize: '12px',
    color: '#60a5fa',
  },
  activityText: {
    display: 'block',
    fontSize: '13px',
    color: '#d1d5db',
    marginTop: '2px',
  },
  activityTime: {
    display: 'block',
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
  },
  actionIcon: {
    fontSize: '20px',
  },
  empty: {
    padding: '24px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
  },
};
