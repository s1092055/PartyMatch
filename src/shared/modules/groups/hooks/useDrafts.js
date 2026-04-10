import { useCallback, useEffect, useState } from "react";
import { getDrafts } from "../api/groupApi.js";
import { useAuth } from "../../auth/hooks/useAuth.js";

async function fetchDraftsByUser(userId) {
  if (!userId) return [];
  return getDrafts(userId);
}

export function useDrafts() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [drafts, setDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextDrafts = await fetchDraftsByUser(currentUserId);
      setDrafts(nextDrafts);
      return nextDrafts;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchDraftsByUser(currentUserId)
      .then((nextDrafts) => { if (isMounted) setDrafts(nextDrafts); })
      .catch(() => {})
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [currentUserId]);

  return {
    currentUserId,
    drafts,
    currentDraft: drafts[0] ?? null,
    isLoading,
    reloadDrafts,
  };
}
