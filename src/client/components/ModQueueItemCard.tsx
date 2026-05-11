import type { EnrichedModQueueItem } from '../../shared/types';
import { PriorityIndicator } from './PriorityIndicator';
import { clsx } from 'clsx';
import { navigateTo } from '@devvit/web/client';

interface ModQueueItemCardProps {
  item: EnrichedModQueueItem;
  onClaim: (itemId: string) => void;
  onUnclaim: (itemId: string) => void;
  onAnalyze: (userId: string, username: string) => void;
  onMarkProcessed: (priority?: number) => void;
  currentUser?: string | undefined;
}

export function ModQueueItemCard({
  item,
  onClaim,
  onUnclaim,
  onAnalyze,
  onMarkProcessed,
  currentUser
}: ModQueueItemCardProps) {
  const isClaimedByMe = item.claim?.claimedBy === currentUser && currentUser !== undefined;
  const isClaimedByOther = item.claim && !isClaimedByMe;

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 transition-colors',
      isClaimedByOther ? 'border-red-300 dark:border-red-800 opacity-75' :
      isClaimedByMe ? 'border-orange-500 dark:border-orange-500 ring-1 ring-orange-500' :
      'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    )}>
      {/* Header Info */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="uppercase font-medium text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {item.kind === 't3' ? 'Post' : 'Comment'}
          </span>
          <span>•</span>
          <span
            className="hover:underline cursor-pointer text-gray-700 dark:text-gray-300"
            onClick={() => navigateTo(`https://reddit.com/user/${item.author.name}`)}
          >
            u/{item.author.name}
          </span>
          <span>•</span>
          <span>{new Date(item.createdUtc).toLocaleDateString()}</span>
          {item.numReports > 0 && (
            <>
              <span>•</span>
              <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                {item.numReports} Reports
              </span>
            </>
          )}
        </div>

        <PriorityIndicator
          score={item.priority.score}
          reasoning={item.priority.reasoning}
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        {item.title && (
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {item.title}
          </h3>
        )}
        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
          {item.body || '[No content]'}
        </p>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          {item.claim ? (
            isClaimedByMe ? (
              <button
                onClick={() => onUnclaim(item.id)}
                className="px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 transition-colors"
              >
                Release Claim
              </button>
            ) : (
              <div className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-gray-100 rounded dark:bg-gray-800 flex items-center gap-1">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Claimed by {item.claim.claimedBy}
              </div>
            )
          ) : (
            <button
              onClick={() => onClaim(item.id)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Claim Item
            </button>
          )}

          <button
            onClick={() => onAnalyze(item.author.id, item.author.name)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Analyze User
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigateTo(item.permalink)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            View on Reddit
          </button>

          {isClaimedByMe && (
             <button
              onClick={() => onMarkProcessed(item.priority.score)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors flex items-center gap-1"
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
               Mark Done
             </button>
          )}
        </div>
      </div>
    </div>
  );
}