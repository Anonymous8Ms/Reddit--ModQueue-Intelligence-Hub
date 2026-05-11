import { useState, useCallback, useEffect } from 'react';
import type {
  QueueResponse,
  ClaimResponse,
  ContextResponse,
  EnrichedModQueueItem,
  UserContext,
  ModPresence
} from '../../shared/api';

export function useModQueue() {
  const [items, setItems] = useState<EnrichedModQueueItem[]>([]);
  const [activeModerators, setActiveModerators] = useState<ModPresence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/modqueue/queue');
      if (!res.ok) throw new Error('Failed to fetch queue');
      const data: QueueResponse = await res.json();

      const sortedItems = data.items.sort((a, b) => b.priority.score - a.priority.score);
      setItems(sortedItems);
      setActiveModerators(data.activeModerators);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const claimItem = useCallback(async (itemId: string) => {
    try {
      const res = await fetch('/modqueue/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data: ClaimResponse = await res.json();
      if (data.success) {
        void fetchQueue();
        return true;
      } else {
        setError(`Failed to claim: ${data.message}`);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchQueue]);

  const unclaimItem = useCallback(async (itemId: string) => {
    try {
      const res = await fetch('/modqueue/claim', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data: ClaimResponse = await res.json();
      if (data.success) {
        void fetchQueue();
        return true;
      } else {
        setError(`Failed to unclaim: ${data.message}`);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchQueue]);

  const fetchUserContext = useCallback(async (userId: string, username?: string): Promise<UserContext | null> => {
    try {
      const res = await fetch(`/modqueue/context/${userId}${username ? `?username=${username}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch context');
      const data: ContextResponse = await res.json();
      return data.context;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  const markProcessed = useCallback(async (priority?: number) => {
    try {
      const res = await fetch('/modqueue/processed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) {
        void fetchQueue();
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchQueue]);

  useEffect(() => {
    void fetchQueue();
    const interval = setInterval(() => {
      void fetchQueue();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  return { items, activeModerators, loading, error, fetchQueue, claimItem, unclaimItem, fetchUserContext, markProcessed };
}