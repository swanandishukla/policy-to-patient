/**
 * Custom hook for monitoring backend connection status.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ConnectionStatus, HealthResponse } from '../types';
import { fetchHealth } from '../services/api';

interface UseBackendStatusResult {
  status: ConnectionStatus;
  health: HealthResponse | null;
  retry: () => void;
}

export function useBackendStatus(): UseBackendStatusResult {
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const checkHealth = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await fetchHealth();
      setHealth(data);
      setStatus('connected');
    } catch {
      setHealth(null);
      setStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { status, health, retry: checkHealth };
}
