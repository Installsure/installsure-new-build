declare module 'opossum' {
  interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    group?: string;
    volumeThreshold?: number;
    onSuccess?: (result: any) => void;
    onFailure?: (error: Error) => void;
    onTimeout?: (error: Error) => void;
    onReject?: (error: Error) => void;
    onOpen?: () => void;
    onHalfOpen?: () => void;
    onClose?: () => void;
  }

  class CircuitBreaker {
    constructor(fn: (...args: any[]) => Promise<any>, options?: CircuitBreakerOptions);
    fire(...args: any[]): Promise<any>;
    fallback(fn: (...args: any[]) => Promise<any>): CircuitBreaker;
    open(): void;
    close(): void;
    halfOpen(): void;
    isOpen(): boolean;
    isClosed(): boolean;
    isHalfOpen(): boolean;
    on(event: string, handler: (...args: any[]) => void): CircuitBreaker;
    name: string;
    stats: {
      fires: number;
      successes: number;
      failures: number;
      timeouts: number;
      rejects: number;
      opens: number;
      halfOpens: number;
      closes: number;
      fallbacks: number;
    };
  }

  export = CircuitBreaker;
}
