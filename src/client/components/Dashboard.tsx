import { useState, useMemo } from 'react';
import { useModQueue } from '../hooks/useModQueue';
import { ModQueueItemCard } from './ModQueueItemCard';
import { UserContextModal } from './UserContextModal';
import type { UserContext } from '../../shared/types';
import { context } from '@devvit/web/client';
import { navigateTo } from '@devvit/web/client';

export function Dashboard() {
  const {
    items,
    activeModerators,
    loading,
    error,
    fetchQueue,
    claimItem,
    unclaimItem,
    fetchUserContext,
    markProcessed
  } = useModQueue();

  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'mine'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserContext, setCurrentUserContext] = useState<UserContext | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const currentUser = context.username;

  const handleAnalyze = async (userId: string, username: string) => {
    setIsModalOpen(true);
    setModalLoading(true);
    const result = await fetchUserContext(userId, username);
    setCurrentUserContext(result);
    setModalLoading(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter === 'all') return true;
      if (filter === 'unclaimed') return !item.claim;
      if (filter === 'mine') return item.claim?.claimedBy === currentUser;
      return true;
    });
  }, [items, filter, currentUser]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold">ModQueue Intelligence Hub</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {currentUser || 'Mod'}. You have {items.length} items in the queue.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 overflow-hidden" title="Active Moderators">
              {activeModerators.map(mod => (
                <div
                  key={mod.username}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-medium uppercase"
                  title={`${mod.username} (Active now)`}
                >
                  {mod.username.slice(0, 2)}
                </div>
              ))}
            </div>

            <button
              onClick={() => void fetchQueue()}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white rounded-lg transition-colors disabled:opacity-50"
              title="Refresh Queue"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Filters and List */}
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filter === 'all' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setFilter('unclaimed')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filter === 'unclaimed' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              Unclaimed
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filter === 'mine' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              Assigned to Me
            </button>
          </div>

          <div className="grid gap-4">
            {loading && items.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                Loading queue...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                No items found matching the current filter.
              </div>
            ) : (
              filteredItems.map(item => (
                <ModQueueItemCard
                  key={item.id}
                  item={item}
                  onClaim={(id) => void claimItem(id)}
                  onUnclaim={(id) => void unclaimItem(id)}
                  onAnalyze={(userId, username) => void handleAnalyze(userId, username)}
                  onMarkProcessed={(priority) => void markProcessed(priority)}
                  currentUser={currentUser || undefined}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8 pb-4">
          <button
            className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors mx-2"
            onClick={() => navigateTo('https://developers.reddit.com/docs')}
          >
            Devvit Docs
          </button>
          |
          <button
            className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors mx-2"
            onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
          >
            r/Devvit
          </button>
        </footer>

      </div>

      <UserContextModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userContext={currentUserContext}
        loading={modalLoading}
      />
    </div>
  );
}