"use client";

import { useAccount } from "./account";

/**
 * Saved + selected audiences. The saved list is shared by the workspace; which ones
 * are selected is per user. Stored in Supabase (see lib/account.js).
 */
export default function useAudiences() {
  const { loaded, audiences, selected, addAudience, removeAudience, toggleAudience } = useAccount();
  return {
    audiencesLoaded: loaded,
    savedAudiences: audiences.map((a) => a.name),
    audiences: selected,
    addAudience,
    removeAudience,
    toggleAudience,
  };
}
