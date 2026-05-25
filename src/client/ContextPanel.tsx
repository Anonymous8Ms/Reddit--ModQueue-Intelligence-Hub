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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'modHistory'>('activity');

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUserContext(userId, username);
      if (res.type === 'context') {
        setContext(res.context);
      }
    } catch (err) {
      setContext(null);
      setError(err instanceof Error ? err.message : 'Unable to load user context');
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

            <div style={styles.participation}>
              <span style={styles.participationLabel}>Subreddit participation</span>
              <span style={styles.participationText}>
                {context.subredditParticipation.postCount} posts •{' '}
                {context.subredditParticipation.commentCount} comments • first seen{' '}
                {formatTimeAgo(context.subredditParticipation.firstSeen)}
              </span>
            </div>
          </>
        ) : (
          <div style={styles.errorWrap}>
            <div style={styles.errorTitle}>Context unavailable</div>
            <div style={styles.errorMessage}>
              {error || 'Reddit did not return enough user data for this account.'}
            </div>
            <div style={styles.errorHint}>
              This usually happens for very new accounts, deleted users, or items where Reddit does
              not expose a stable author id yet.
            </div>
            <button style={styles.retryBtn} onClick={() => void loadContext()}>
              Retry context fetch
            </button>
          </div>
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
    backgroundColor: 'rgba(24, 33, 43, 0.32)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#fffdf8',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '560px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e6ddd0',
    boxShadow: '0 24px 60px rgba(24, 33, 43, 0.16)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #eee6da',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#18212b',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#7a7f87',
    cursor: 'pointer',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
  },
  errorWrap: {
    padding: '28px 24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#18212b',
  },
  errorMessage: {
    fontSize: '14px',
    color: '#d9482b',
    lineHeight: 1.5,
  },
  errorHint: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: 1.6,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: '8px',
    padding: '10px 14px',
    borderRadius: '999px',
    border: '1px solid #f2c3b7',
    backgroundColor: '#fff3ef',
    color: '#d9482b',
    cursor: 'pointer',
    fontWeight: 600,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: MIN_GRID_COLUMNS,
    gap: '12px',
    padding: '16px 20px',
    borderBottom: '1px solid #eee6da',
  },
  statCard: {
    backgroundColor: '#fbf7f1',
    borderRadius: '16px',
    padding: '14px',
    textAlign: 'left',
    border: '1px solid #efe5d8',
  },
  statLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#8a8f98',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  statValue: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 700,
    color: '#18212b',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #eee6da',
    padding: '0 8px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    color: '#8a8f98',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabActive: {
    color: '#d9482b',
    borderBottom: '2px solid #d9482b',
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px 8px',
  },
  list: {},
  listItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#fbf7f1',
    borderRadius: '16px',
    marginBottom: '10px',
    border: '1px solid #efe5d8',
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
    color: '#d9482b',
  },
  activityText: {
    display: 'block',
    fontSize: '13px',
    color: '#18212b',
    marginTop: '2px',
    lineHeight: 1.5,
  },
  activityTime: {
    display: 'block',
    fontSize: '11px',
    color: '#8a8f98',
    marginTop: '4px',
  },
  actionIcon: {
    fontSize: '20px',
  },
  empty: {
    padding: '24px',
    textAlign: 'center',
    color: '#8a8f98',
    fontSize: '14px',
  },
  participation: {
    padding: '0 20px 18px',
  },
  participationLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#8a8f98',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px',
  },
  participationText: {
    display: 'block',
    fontSize: '13px',
    color: '#4f5863',
    lineHeight: 1.5,
  },
};
