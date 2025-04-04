import { useState, useEffect } from 'react';

/**
 * Hook to fetch and return alert types from the API
 */
export default function useAlertTypes() {
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAlertTypes() {
      try {
        const response = await fetch('/api/alerts/types');
        if (!response.ok) {
          throw new Error('Failed to fetch alert types');
        }
        const data = await response.json();
        if (data.types && Array.isArray(data.types)) {
          setTypes(data.types.map((item: any) => item.type || item));
        } else {
          // Fallback for backward compatibility
          setTypes([
            'prompt_injection',
            'sensitive_data_leak',
            'unusual_behavior',
            'rate_limit_exceeded',
            'authorization_bypass'
          ]);
        }
      } catch (err) {
        console.error('Error fetching alert types:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Provide fallback data
        setTypes([
          'prompt_injection',
          'sensitive_data_leak',
          'unusual_behavior',
          'rate_limit_exceeded',
          'authorization_bypass'
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchAlertTypes();
  }, []);

  return { types, loading, error };
} 