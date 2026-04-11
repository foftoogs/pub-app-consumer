import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useAuthStore } from '@/stores/auth';

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Logs the user out after {@link TIMEOUT_MS} of inactivity.
 * "Activity" is any touch (reported via `resetTimer`) or the app
 * returning to the foreground. The timer pauses while backgrounded
 * and checks elapsed time when the app comes back.
 */
export function useInactivityTimeout() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActiveRef = useRef(Date.now());

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (!token) return;
    lastActiveRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_MS);
  }, [token, logout, clearTimer]);

  /** Call on every user interaction to reset the countdown. */
  const resetTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  // Handle app state changes — check elapsed time on foreground resume
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (!token) return;
      if (state === 'active') {
        const elapsed = Date.now() - lastActiveRef.current;
        if (elapsed >= TIMEOUT_MS) {
          logout();
        } else {
          startTimer();
        }
      } else {
        // Backgrounded — clear the JS timer (it's unreliable in background)
        clearTimer();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [token, logout, startTimer, clearTimer]);

  // Start/stop timer when auth state changes
  useEffect(() => {
    if (token) {
      startTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [token, startTimer, clearTimer]);

  return resetTimer;
}
