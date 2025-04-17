import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';

import type { NetsuiteOrder } from '@/types/netsuite';

type NetsuiteResponse = {
  order: NetsuiteOrder;
};

type FetcherError = {
  status?: number;
} & Error;

const fetchNetsuiteData = async (url: string, token: string): Promise<NetsuiteResponse> => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=300', // Cache for 5 minutes
    },
  });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.') as FetcherError;
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export function useNetsuiteData(orderId: string | null) {
  const { getToken } = useAuth();

  return useQuery<NetsuiteResponse, FetcherError>({
    queryKey: ['netsuite', orderId],
    queryFn: async () => {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token is required');
      }
      return fetchNetsuiteData(`/api/proxy?id=${orderId}`, token);
    },
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes (formerly cacheTime)
    retry: (failureCount, error: FetcherError) => {
      // Don't retry on 404 or 403
      if (error.status === 404 || error.status === 403) {
        return false;
      }
      // Only retry up to 3 times
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
