"use client";

import { useState, useEffect, useCallback } from "react";
import type { RecentItem, SearchItem } from "./types";
import { getRecentItems, saveRecentItem, recentItemsToSearchItems } from "./utils";

export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Load recent items on mount
  useEffect(() => {
    setRecentItems(getRecentItems());
  }, []);

  // Add item to recent
  const addRecentItem = useCallback((item: Omit<RecentItem, "timestamp">) => {
    saveRecentItem(item);
    setRecentItems(getRecentItems());
  }, []);

  // Convert to search items
  const recentSearchItems: SearchItem[] = recentItemsToSearchItems(recentItems);

  return {
    recentItems,
    recentSearchItems,
    addRecentItem,
  };
}
