import { PlusCircle, Trash } from 'lucide-react';

import { useToast } from '@/components/ui/use-toast';

import { useOrderStore } from '../store/orderStore';
import type { OrderItem } from '../store/types';

type CartonSplitManagerProps = {
  item: OrderItem;
  itemKey: string;
};

export const CartonSplitManager = ({ item, itemKey }: CartonSplitManagerProps) => {
  const { toast } = useToast();
  const {
    orderData,
    splitItems,
    addSplit,
    removeSplit,
  } = useOrderStore();

  if (!orderData) {
    return null;
  }

  const totalQuantity = orderData.isSalesOrder ? item.quantityCommitted : item.quantityOrdered;
  const splits = splitItems[itemKey] || [];
  const hasSplits = splits.length > 0;
  const canSplit = totalQuantity > 1;

  const handleAddSplit = () => {
    if (!totalQuantity) {
      toast({
        variant: 'destructive',
        title: 'Cannot split item',
        description: 'This item has no quantity to split.',
      });
      return;
    }

    if (!canSplit) {
      toast({
        variant: 'destructive',
        title: 'Cannot split item',
        description: 'Items with quantity of 1 or less cannot be split.',
      });
      return;
    }

    addSplit(itemKey, totalQuantity);

    if (splits.length === 0) {
      toast({
        title: 'Split created',
        description: `Created 2 cartons with quantities ${Math.floor(totalQuantity / 2)} and ${totalQuantity - Math.floor(totalQuantity / 2)}`,
      });
    } else {
      toast({
        title: 'New carton added',
        description: 'Split adjusted',
      });
    }
  };

  const handleRemoveSplit = () => {
    removeSplit(itemKey);

    if (splits.length === 2) {
      toast({
        title: 'Splits removed',
        description: 'Restored quantity to header level',
      });
    } else {
      const lastCarton = splits[splits.length - 1];
      const secondLastCarton = splits[splits.length - 2];

      if (lastCarton && secondLastCarton) {
        toast({
          title: 'Carton merged',
          description: `Merged last carton into previous (new quantity: ${lastCarton.quantity + secondLastCarton.quantity})`,
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        type="button"
        className={`inline-flex size-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          canSplit
            ? 'text-gray-700 hover:bg-blue-50 focus:ring-blue-500'
            : 'cursor-not-allowed text-gray-400'
        }`}
        onClick={handleAddSplit}
        disabled={!canSplit}
        title={!canSplit ? 'Items with quantity of 1 or less cannot be split' : undefined}
      >
        <PlusCircle className={`size-4 ${canSplit ? 'text-blue-500' : 'text-gray-400'}`} />
      </button>
      {hasSplits && (
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={handleRemoveSplit}
        >
          <Trash className="size-4 text-red-500" />
        </button>
      )}
    </div>
  );
};
