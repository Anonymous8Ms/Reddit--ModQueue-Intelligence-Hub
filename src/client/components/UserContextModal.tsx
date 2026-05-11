import { useEffect, useRef } from 'react';
import type { UserContext } from '../../shared/types';

interface UserContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: UserContext | null;
  loading: boolean;
}

export function UserContextModal({ isOpen, onClose, userContext, loading }: UserContextModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : userContext ? (
          <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                u/{userContext.username}
              </h2>
              <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Account Age: {userContext.accountAgeDays} days</span>
                <span>Total Karma: {userContext.karma.total}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Karma Breakdown</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Post: {userContext.karma.post}</li>
                  <li>Comment: {userContext.karma.comment}</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Subreddit Stats</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Posts: {userContext.subredditParticipation.postCount}</li>
                  <li>Comments: {userContext.subredditParticipation.commentCount}</li>
                </ul>
              </div>
            </div>

            {userContext.modActions && userContext.modActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Previous Mod Actions</h3>
                <div className="space-y-2">
                  {userContext.modActions.map((action, i) => (
                    <div key={i} className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm border border-red-100 dark:border-red-800">
                      <span className="font-medium text-red-800 dark:text-red-300 capitalize">{action.action}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        by {action.modUsername} - {new Date(action.timestamp).toLocaleDateString()}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">{action.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userContext.recentActivity && userContext.recentActivity.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  {userContext.recentActivity.map((activity, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                        <span className="uppercase">{activity.type} in r/{activity.subreddit}</span>
                        <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                        {activity.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Could not load user context.
          </div>
        )}
      </div>
    </div>
  );
}