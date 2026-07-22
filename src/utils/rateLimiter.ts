// Rate Limiter Utility for Authentication and Sensitive Endpoints

interface RateLimitStore {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private keyPrefix: string;
  private maxAttempts: number;
  private windowMs: number;
  private inMemoryStore: Map<string, RateLimitStore> = new Map();

  constructor(keyPrefix: string, maxAttempts: number, windowMs: number) {
    this.keyPrefix = keyPrefix;
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  private getKey(identifier: string): string {
    return `rate_limit_${this.keyPrefix}_${identifier}`;
  }

  private getStore(key: string): RateLimitStore {
    const now = Date.now();
    let data = this.inMemoryStore.get(key);

    if (!data) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          data = JSON.parse(stored);
        }
      } catch {
        // Fallback to in-memory store if localStorage is unavailable
      }
    }

    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + this.windowMs };
    }

    return data;
  }

  private saveStore(key: string, store: RateLimitStore): void {
    this.inMemoryStore.set(key, store);
    try {
      localStorage.setItem(key, JSON.stringify(store));
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Checks if the identifier has exceeded rate limits.
   * Throws an error with remaining wait time if limit exceeded.
   */
  public check(identifier: string = 'default'): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
    const key = this.getKey(identifier);
    const store = this.getStore(key);
    const now = Date.now();

    if (now > store.resetTime) {
      store.count = 0;
      store.resetTime = now + this.windowMs;
      this.saveStore(key, store);
    }

    if (store.count >= this.maxAttempts) {
      const retryAfterSeconds = Math.ceil((store.resetTime - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - store.count,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Increments attempt count for identifier.
   */
  public increment(identifier: string = 'default'): void {
    const key = this.getKey(identifier);
    const store = this.getStore(key);
    const now = Date.now();

    if (now > store.resetTime) {
      store.count = 1;
      store.resetTime = now + this.windowMs;
    } else {
      store.count += 1;
    }

    this.saveStore(key, store);
  }

  /**
   * Resets rate limit for identifier upon successful action.
   */
  public reset(identifier: string = 'default'): void {
    const key = this.getKey(identifier);
    this.inMemoryStore.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore localStorage errors
    }
  }
}

// 5 attempts per minute per IP/user on login
export const loginRateLimiter = new RateLimiter('login', 5, 60 * 1000);

// 3 attempts per hour on password reset
export const passwordResetRateLimiter = new RateLimiter('password_reset', 3, 60 * 60 * 1000);

// 5 attempts per 15 minutes for OTP verification
export const otpRateLimiter = new RateLimiter('otp', 5, 15 * 60 * 1000);

// 5 signup attempts per hour
export const signupRateLimiter = new RateLimiter('signup', 5, 60 * 60 * 1000);
