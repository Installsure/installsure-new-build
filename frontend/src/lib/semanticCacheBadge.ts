export interface CacheBadge {
  isCached: boolean;
  cacheAge?: number;
}

export function getCacheBadge(headers: Headers): CacheBadge {
  const cacheStatus = headers.get("x-cache-status");
  const cacheAge = headers.get("x-cache-age");
  
  return {
    isCached: cacheStatus === "hit",
    cacheAge: cacheAge ? parseInt(cacheAge) : undefined
  };
}
