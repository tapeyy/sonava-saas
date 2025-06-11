import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

import { useOrderStore } from '../store/orderStore';
import type { NetsuiteOrder } from '../store/types';

export const useOrderData = () => {
  const { getToken } = useAuth();
  const {
    orderData,
    setOrderData,
    setIsLoading,
    setError,
  } = useOrderStore();

  const fetchOrderData = useCallback(async (orderId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();

      const response = await fetch(`/api/proxy?id=${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to access this resource.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to access this resource.');
        }
        throw new Error('The order number you entered is invalid. Please try again.');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Sort items: Items with no committed quantity go to the bottom
      const sortedItems = [...data.order.items].sort((a, b) => {
        if (!a.quantityCommitted && b.quantityCommitted) {
          return 1;
        }
        if (a.quantityCommitted && !b.quantityCommitted) {
          return -1;
        }
        if (a.quantityCommitted === 0 && b.quantityCommitted > 0) {
          return 1;
        }
        if (b.quantityCommitted === 0 && a.quantityCommitted > 0) {
          return -1;
        }
        return 0;
      });

      const orderWithSortedItems: NetsuiteOrder = {
        ...data.order,
        items: sortedItems,
      };

      setOrderData(orderWithSortedItems);

      // Auto-select items with appropriate quantity
      const autoSelected = sortedItems
        .filter(
          orderWithSortedItems.isSalesOrder
            ? (item: { quantityCommitted: number }) => item.quantityCommitted > 0
            : (item: { quantityOrdered: number }) => item.quantityOrdered > 0,
        )
        .map(item => item.item);

      useOrderStore.getState().setSelectedRows(autoSelected);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, setOrderData, setIsLoading, setError]);

  return {
    orderData,
    fetchOrderData,
  };
};
