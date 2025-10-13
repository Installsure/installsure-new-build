/**
 * Semantic Cache Badge utilities
 */

export interface CacheInfo {
  cached: boolean;
  timestamp?: string;
}

/**
 * Format cache info for display
 */
export function formatCacheInfo(cacheInfo?: CacheInfo): string {
  if (!cacheInfo?.cached) {
    return 'Fresh response';
  }
  
  if (cacheInfo.timestamp) {
    const date = new Date(cacheInfo.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) {
      return `Cached ${diffSecs}s ago`;
    } else if (diffSecs < 3600) {
      return `Cached ${Math.floor(diffSecs / 60)}m ago`;
    } else {
      return `Cached ${Math.floor(diffSecs / 3600)}h ago`;
    }
  }
  
  return 'Cached response';
}

/**
 * Get badge color based on cache status
 */
export function getCacheBadgeColor(cached: boolean): string {
  return cached ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
}

/**
 * Get badge icon based on cache status
 */
export function getCacheBadgeIcon(cached: boolean): string {
  return cached ? '⚡' : '🔄';
}
