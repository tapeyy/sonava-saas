import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { ItemSplits, NetsuiteOrder } from './types';

type OrderState = {
  // Order Data
  orderData: NetsuiteOrder | null;
  setOrderData: (order: NetsuiteOrder | null) => void;

  // Selected Items
  selectedRows: string[];
  setSelectedRows: (rows: string[]) => void;
  toggleRow: (itemId: string) => void;
  markAll: (value: boolean) => void;

  // Split Items
  splitItems: ItemSplits;
  setSplitItems: (splits: ItemSplits) => void;
  addSplit: (itemKey: string, totalQuantity: number) => void;
  removeSplit: (itemKey: string) => void;
  updateSplitQuantity: (itemKey: string, splitId: string, newQuantity: number) => void;

  // Loading State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error State
  error: string | null;
  setError: (error: string | null) => void;
};

export const useOrderStore = create<OrderState>()(
  devtools(
    (set, get) => ({
      // Order Data
      orderData: null,
      setOrderData: order => set({ orderData: order }),

      // Selected Items
      selectedRows: [],
      setSelectedRows: rows => set({ selectedRows: rows }),
      toggleRow: itemId => set(state => ({
        selectedRows: state.selectedRows.includes(itemId)
          ? state.selectedRows.filter(id => id !== itemId)
          : [...state.selectedRows, itemId],
      })),
      markAll: (value) => {
        const { orderData } = get();
        if (!orderData?.items) {
          return;
        }

        const selectableItems = orderData.items
          .filter(orderData.isSalesOrder
            ? item => item.quantityCommitted > 0
            : item => item.quantityOrdered > 0)
          .map(item => item.item);

        set({ selectedRows: value ? selectableItems : [] });
      },

      // Split Items
      splitItems: {},
      setSplitItems: splits => set({ splitItems: splits }),
      addSplit: (itemKey, totalQuantity) => {
        const { splitItems } = get();
        const currentSplits = splitItems[itemKey] || [];

        if (currentSplits.length === 0) {
          // Create initial two splits
          const firstSplitQuantity = Math.floor(totalQuantity / 2);
          const secondSplitQuantity = totalQuantity - firstSplitQuantity;

          const newSplits = [
            {
              id: crypto.randomUUID(),
              quantity: firstSplitQuantity,
              parentItemId: itemKey,
            },
            {
              id: crypto.randomUUID(),
              quantity: secondSplitQuantity,
              parentItemId: itemKey,
            },
          ];

          set({ splitItems: { ...splitItems, [itemKey]: newSplits } });
        } else {
          // Calculate current total of all splits
          const currentTotal = currentSplits.reduce((sum, split) => sum + split.quantity, 0);
          const remainingToSplit = totalQuantity - currentTotal;

          if (remainingToSplit > 0) {
            // Add new carton with remaining quantity
            const updatedSplits = [...currentSplits, {
              id: crypto.randomUUID(),
              quantity: remainingToSplit,
              parentItemId: itemKey,
            }];

            set({ splitItems: { ...splitItems, [itemKey]: updatedSplits } });
          } else {
            // Split the largest existing carton
            const largestSplit = [...currentSplits].sort((a, b) => b.quantity - a.quantity)[0];
            if (!largestSplit || largestSplit.quantity <= 1) {
              return;
            }

            const splitIndex = currentSplits.findIndex(split => split.id === largestSplit.id);
            if (splitIndex === -1) {
              return;
            }

            const newSplitQuantity = Math.floor(largestSplit.quantity / 2);
            const remainingQuantity = largestSplit.quantity - newSplitQuantity;

            const updatedSplits = [...currentSplits];
            updatedSplits[splitIndex] = {
              ...largestSplit,
              quantity: remainingQuantity,
            };

            updatedSplits.push({
              id: crypto.randomUUID(),
              quantity: newSplitQuantity,
              parentItemId: itemKey,
            });

            set({ splitItems: { ...splitItems, [itemKey]: updatedSplits } });
          }
        }
      },
      removeSplit: (itemKey) => {
        const { splitItems } = get();
        const currentSplits = splitItems[itemKey];

        if (!currentSplits || currentSplits.length === 0) {
          return;
        }

        if (currentSplits.length === 2) {
          // Remove all splits to restore header quantity
          const newSplits = { ...splitItems };
          delete newSplits[itemKey];
          set({ splitItems: newSplits });
        } else {
          // Merge last into second-last
          const updatedSplits = currentSplits.slice(0, -1);
          const lastCarton = currentSplits[currentSplits.length - 1];
          const secondLastCarton = currentSplits[currentSplits.length - 2];

          if (!lastCarton || !secondLastCarton) {
            return;
          }

          updatedSplits[updatedSplits.length - 1] = {
            ...secondLastCarton,
            quantity: secondLastCarton.quantity + lastCarton.quantity,
          };

          set({ splitItems: { ...splitItems, [itemKey]: updatedSplits } });
        }
      },
      updateSplitQuantity: (itemKey, splitId, newQuantity) => {
        const { splitItems, orderData } = get();
        const currentSplits = splitItems[itemKey];
        if (!currentSplits?.length || !orderData) {
          return;
        }

        const item = orderData.items.find(i => (i.item || i.itemId) === itemKey);
        if (!item) {
          return;
        }

        const totalQuantity = orderData.isSalesOrder ? item.quantityCommitted : item.quantityOrdered;
        const splitIndex = currentSplits.findIndex(split => split.id === splitId);

        if (splitIndex === -1) {
          return;
        }

        const otherSplitsTotal = currentSplits
          .filter((_, index) => index !== splitIndex)
          .reduce((sum, split) => sum + split.quantity, 0);

        const maxAllowed = totalQuantity - otherSplitsTotal;
        const validQuantity = Math.min(Math.max(0, newQuantity), maxAllowed);

        const updatedSplits = [...currentSplits];
        const currentSplit = updatedSplits[splitIndex];
        if (!currentSplit) {
          return;
        }

        updatedSplits[splitIndex] = {
          id: currentSplit.id,
          parentItemId: currentSplit.parentItemId,
          quantity: validQuantity,
        };

        set({ splitItems: { ...splitItems, [itemKey]: updatedSplits } });
      },

      // Loading State
      isLoading: false,
      setIsLoading: loading => set({ isLoading: loading }),

      // Error State
      error: null,
      setError: error => set({ error }),
    }),
    { name: 'order-store' },
  ),
);
