import { QueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500) {
          if (error.status !== 408 && error.status !== 429) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      onError: (error: any) => {
        const message = error?.message || "An unexpected error occurred";
        toast.error(message);
      },
    },
  },
});
