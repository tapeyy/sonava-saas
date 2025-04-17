'use client';

import { useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlusCircle, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';

// Types
type SplitItem = {
  id: string;
  quantity: number;
  parentItemId: string;
};

type ItemSplits = {
  [key: string]: SplitItem[];
};

type OrderItem = {
  item: string;
  itemId: string;
  quantityCommitted: number;
  quantityOrdered: number;
  description?: string;
};

type NetsuiteOrder = {
  tranId: string;
  poNumber: string;
  items: OrderItem[];
  entity: string;
  entityContact: string;
  shipAddress: string;
  transactionDate: string;
  isSalesOrder: boolean;
};

type PrintItem = {
  poNumber: string;
  tranId: string;
  isSalesOrder: boolean;
  quantity: number;
  cartonInfo?: string;
} & OrderItem;

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main content component
function OrderPageContent(props: { params: { id: string } }) {
  const { id } = props.params;
  const router = useRouter();
  const { toast } = useToast();
  const { getToken } = useAuth();

  // State for Order Lookup
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [splitItems, setSplitItems] = useState<ItemSplits>({});
  const [orderData, setOrderData] = useState<NetsuiteOrder | null>(null);

  // Fetching order data
  const fetchOrderData = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
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
          setError('You must be logged in to access this resource.');
          return;
        }
        if (response.status === 403) {
          setError('You do not have permission to access this resource.');
          return;
        }
        setError('The order number you entered is invalid. Please try again.');
        return;
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
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

      // Get the isSalesOrder flag from the fetched order data
      const isSalesOrder = data.order.isSalesOrder;

      // Automatically select items with the appropriate quantity condition
      const autoSelected = sortedItems
        .filter(
          isSalesOrder
            ? (item: { quantityCommitted: number }) => item.quantityCommitted > 0
            : (item: { quantityOrdered: number }) => item.quantityOrdered > 0,
        )
        .map(item => item.item);

      if (!sortedItems.length) {
        setError('No items found for this order.');
      }

      setOrderData({ ...data.order, items: sortedItems });
      setSelectedRows(autoSelected);
    } catch (err: string | any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (id) {
      fetchOrderData(id);
    }
  }, [id, fetchOrderData]);

  // Remove the initialization effect since we don't want to create splits initially
  useEffect(() => {
    if (orderData?.items) {
      const initialSplits: ItemSplits = {};
      setSplitItems(initialSplits);
    }
  }, [orderData]);

  // Handle order number form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid order number.',
      });
      return;
    }

    router.push(orderNumber);
  };

  // Handle row selection
  const handleRowSelect = useCallback((itemId: string, isSelected: boolean) => {
    setSelectedRows(prevSelected =>
      isSelected
        ? [...prevSelected, itemId]
        : prevSelected.filter(id => id !== itemId),
    );
  }, []);

  // Handle "Mark All" functionality
  const handleMarkAll = useCallback(
    (isSelected: boolean) => {
      if (!orderData?.items) {
        return;
      }

      const selectableItems = orderData.items.filter(
        orderData.isSalesOrder
          ? (item: OrderItem) => item.quantityCommitted > 0
          : (item: OrderItem) => item.quantityOrdered > 0,
      );

      setSelectedRows(
        isSelected
          ? selectableItems.map(item => item.item)
          : [],
      );
    },
    [orderData],
  );

  // Handle "Unmark All" functionality
  const handleUnMarkAll = useCallback(() => {
    setSelectedRows([]);
  }, []);

  // Function to add a split
  const addSplit = useCallback((item: OrderItem) => {
    const itemKey = item.item || item.itemId;
    const totalQuantity = orderData?.isSalesOrder ? item.quantityCommitted : item.quantityOrdered;

    if (!totalQuantity) {
      toast({
        variant: 'destructive',
        title: 'Cannot split item',
        description: 'This item has no quantity to split.',
      });
      return;
    }

    const currentSplits = splitItems[itemKey] || [];

    // If no splits exist, create initial two splits
    if (currentSplits.length === 0) {
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

      setSplitItems(prev => ({
        ...prev,
        [itemKey]: newSplits,
      }));

      toast({
        title: 'Split created',
        description: `Created 2 cartons with quantities ${firstSplitQuantity} and ${secondSplitQuantity}`,
      });
    } else {
      // Calculate current total of all splits
      const currentTotal = currentSplits.reduce((sum, split) => sum + split.quantity, 0);
      const remainingToSplit = totalQuantity - currentTotal;

      // If we have remaining quantity that can be split
      if (remainingToSplit > 0) {
        // Just create a new carton with the remaining quantity
        const updatedSplits = [...currentSplits];
        updatedSplits.push({
          id: crypto.randomUUID(),
          quantity: remainingToSplit,
          parentItemId: itemKey,
        });

        setSplitItems(prev => ({
          ...prev,
          [itemKey]: updatedSplits,
        }));

        toast({
          title: 'New carton added',
          description: `Added carton with quantity ${remainingToSplit}`,
        });
      } else {
        // If no remaining quantity, split the largest existing carton
        const largestSplit = [...currentSplits].sort((a, b) => b.quantity - a.quantity)[0];
        if (!largestSplit || largestSplit.quantity <= 1) {
          toast({
            variant: 'destructive',
            title: 'Cannot split further',
            description: 'No carton has enough quantity to split.',
          });
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

        setSplitItems(prev => ({
          ...prev,
          [itemKey]: updatedSplits,
        }));

        toast({
          title: 'Split created',
          description: `Split carton into ${remainingQuantity} and ${newSplitQuantity}`,
        });
      }
    }
  }, [orderData, splitItems, toast]);

  // Function to validate split quantities
  const validateSplitQuantities = useCallback(() => {
    if (!orderData?.items) {
      return [];
    }

    const invalidItems = [];

    for (const item of orderData.items) {
      const itemKey = item.item || item.itemId;
      const splits = splitItems[itemKey];
      const totalQuantity = orderData.isSalesOrder ? item.quantityCommitted : item.quantityOrdered;

      if (splits && splits.length > 0) {
        const splitSum = splits.reduce((sum, split) => sum + split.quantity, 0);
        if (splitSum !== totalQuantity) {
          invalidItems.push(itemKey);
        }
      }
    }

    return invalidItems;
  }, [orderData, splitItems]);

  // Function to remove a split
  const removeSplit = useCallback((itemKey: string) => {
    setSplitItems((prev) => {
      const currentSplits = prev[itemKey];
      if (!currentSplits || currentSplits.length === 0) {
        return prev;
      }

      // If we're about to be left with only one carton (deleting second-to-last)
      if (currentSplits.length === 2) {
        const firstCarton = currentSplits[0];
        const secondCarton = currentSplits[1];

        if (!firstCarton || !secondCarton) {
          return prev;
        }

        // Remove all splits to restore header quantity
        const newSplits = { ...prev };
        delete newSplits[itemKey];

        toast({
          title: 'Splits removed',
          description: 'Restored quantity to header level',
        });

        return newSplits;
      }

      // For more than 2 cartons, merge last into second-last
      const lastCarton = currentSplits[currentSplits.length - 1];
      const secondLastCarton = currentSplits[currentSplits.length - 2];

      if (!lastCarton || !secondLastCarton) {
        return prev;
      }

      const updatedSplits = currentSplits.slice(0, -1);
      const newQuantity = secondLastCarton.quantity + lastCarton.quantity;

      updatedSplits[updatedSplits.length - 1] = {
        ...secondLastCarton,
        quantity: newQuantity,
      };

      toast({
        title: 'Carton merged',
        description: `Merged last carton into previous (new quantity: ${newQuantity})`,
      });

      return {
        ...prev,
        [itemKey]: updatedSplits,
      };
    });
  }, [toast]);

  // Function to update split quantity with validation
  const updateSplitQuantity = useCallback((itemKey: string, splitId: string, newQuantity: number) => {
    const currentSplits = splitItems[itemKey];
    if (!currentSplits?.length) {
      return;
    }

    const item = orderData?.items.find((i: OrderItem) => (i.item || i.itemId) === itemKey);
    if (!item) {
      return;
    }

    const totalQuantity = orderData?.isSalesOrder ? item.quantityCommitted : item.quantityOrdered;
    const updatedSplits = [...currentSplits];
    const splitIndex = updatedSplits.findIndex(split => split.id === splitId);

    if (splitIndex === -1) {
      return;
    }

    // Calculate the total of other splits
    const otherSplitsTotal = updatedSplits
      .filter((_, index) => index !== splitIndex)
      .reduce((sum, split) => sum + split.quantity, 0);

    // Ensure new quantity doesn't exceed total available
    const maxAllowed = totalQuantity - otherSplitsTotal;
    const validQuantity = Math.min(Math.max(0, newQuantity), maxAllowed);

    if (validQuantity !== newQuantity) {
      toast({
        variant: 'destructive',
        title: 'Quantity adjusted',
        description: `Quantity limited to ${validQuantity} to match total committed quantity`,
      });
    }

    if (updatedSplits[splitIndex]) {
      updatedSplits[splitIndex].quantity = validQuantity;
    }

    setSplitItems(prev => ({
      ...prev,
      [itemKey]: updatedSplits,
    }));
  }, [splitItems, orderData, toast]);

  // Modify the printLabels function to handle split quantities correctly
  const printLabels = useCallback(() => {
    if (!selectedRows || !selectedRows.length) {
      toast({
        variant: 'destructive',
        title: 'Cannot print labels',
        description: 'Please select at least one item to print labels.',
      });
      return;
    }

    if (!orderData) {
      toast({
        variant: 'destructive',
        title: 'Cannot print labels',
        description: 'No order data available.',
      });
      return;
    }

    // Validate split quantities before printing
    const invalidItems = validateSplitQuantities();
    if (invalidItems.length > 0) {
      const itemNames = invalidItems.map((itemKey) => {
        const item = orderData.items.find(i => (i.item || i.itemId) === itemKey);
        return orderData.isSalesOrder
          ? (item?.item ? item.item.split(' ')[0] : itemKey)
          : item?.itemId || itemKey;
      });

      toast({
        variant: 'destructive',
        title: 'Cannot print labels',
        description: `The following items have split quantities that don't match their total committed quantity: ${itemNames.join(', ')}`,
      });
      return;
    }

    const selectedItems = orderData.items.filter(item =>
      selectedRows.includes(item.item),
    );

    const printItems = selectedItems.flatMap((item: any) => {
      const itemKey = item.item || item.itemId;
      const splits = splitItems[itemKey];

      if (!splits || splits.length === 0) {
        // If no splits, print the full quantity
        return [{
          ...item,
          quantity: orderData?.isSalesOrder ? item.quantityCommitted : item.quantityOrdered,
          cartonInfo: null, // No carton info for unsplit items
        }];
      }

      // If splits exist, print each split quantity with carton information
      return splits.map((split, index) => ({
        ...item,
        quantity: split.quantity,
        cartonInfo: `Split ${index + 1} of ${splits.length}`, // Add carton count info
      }));
    });

    const printContent = printItems
      .map((item: PrintItem) => `
      <div class="label" style="width: 100mm; height: 150mm; border: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; padding: 10px; box-sizing: border-box; page-break-after: always;">
        <!-- Header Section -->
        <div style="width: 100%; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px;">
          <h1 style="font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase;">PO #: ${orderData.poNumber
          }</h1>
          <p style="font-size: 14px; margin: 0; color: #555;">${orderData.isSalesOrder ? 'Order #' : 'Fulfillment #'}: ${orderData.tranId.toUpperCase()
          }</p>
        </div>

        <!-- Logo Section -->
        <div style="width: 100%; display: flex; justify-content: center; align-items: center; margin-bottom: 10px;">
          <img src="/assets/images/mcc-logo-grayscale.png" alt="Millennium Coupling Company" style="width: 226px; height: 100px; object-fit: contain;" />
        </div>
  
        <!-- Item Information -->
        <div style="width: 100%; flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <p style="font-size: 24px; font-weight: bold; margin: 0;">Part Number</p>
          <p style="font-size: 22px; margin: 5px 0;">${orderData.isSalesOrder
            ? (item?.item ? item.item.split(' ')[0] : 'Unknown Item')
            : item.itemId}
          </p>

          <p style="font-size: 24px; font-weight: bold; margin: 0;">Description</p>
          <p style="font-size: 18px; margin: 5px 0;">${orderData.isSalesOrder
            ? (item?.item ? item.item.split(' ').slice(1).join(' ') : 'No Description')
            : item.item}
          </p>

          <p style="font-size: 24px; font-weight: bold; margin-top: 20;">Quantity</p>
          <p style="font-size: 22px; margin: 5px 0;">${item.quantity}</p>
          ${item.cartonInfo ? `<p style="font-size: 16px; margin: 5px 0; color: #666;">${item.cartonInfo}</p>` : ''}
        </div>
  
        <!-- Footer Section -->
        <div style="width: 100%; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px;">
          <p style="font-size: 12px; color: #777; margin: 0;">Millennium Coupling Company</p>
          <p style="font-size: 12px; color: #777; margin: 0;">www.mcc-ltd.com.au</p>
        </div>
      </div>
    `)
      .join('');

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      setError('Please allow pop-ups to print labels.');
      return;
    }

    printWindow.document.write(`
    <html>
      <head>
      <meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
          }
          .label {
            border: 1px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            text-align: center;
            padding: 10px;
            box-sizing: border-box;
            page-break-after: always;
          }
          .label h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
          }
          .label p {
            margin: 5px 0;
          }
          .label .header {
            width: 100%;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .label .footer {
            width: 100%;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `);
    printWindow.document.close();
    // Add a delay to ensure images load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300); // Adjust the delay if necessary
  }, [orderData, selectedRows, splitItems, validateSplitQuantities, toast]);

  const {
    tranId,
    poNumber,
    items,
    entity,
    entityContact,
    shipAddress,
    transactionDate,
  } = useMemo((): NetsuiteOrder => {
    if (!orderData) {
      return {
        tranId: '',
        poNumber: '',
        items: [],
        entity: '',
        entityContact: '',
        shipAddress: '',
        transactionDate: '',
        isSalesOrder: false,
      };
    }
    return orderData;
  }, [orderData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-lg rounded-lg bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-3xl font-semibold text-red-600">
            Oops, something went wrong!
          </h1>
          <p className="mb-6 text-gray-500">
            We couldn't process your request, but don't worry, you can go back
            and try again.
          </p>
          <Button
            className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          <div className="mt-6 text-sm text-gray-500">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3">
      {/* Order Lookup Form */}
      <div className="mb-8 flex w-full justify-center">
        <Card className="w-full">
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="my-auto flex w-full flex-row items-center justify-between space-x-4"
            >
              <Input
                type="text"
                placeholder="Enter Sales Order or Fulfillment Number"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
              />
              <Button
                className="bg-blue-500 hover:bg-blue-700"
                type="submit"
              >
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card className="mb-8 shadow">
        <CardContent>
          <h1 className="text-2xl font-bold uppercase">{tranId}</h1>
          <p className="pt-4">
            <strong>Shipping Address:</strong>
            <br />
            {shipAddress.replace(/\r\n/g, ', ')}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p>
                <strong>Entity:</strong>
                {' '}
                {entity}
              </p>
              <p>
                <strong>Contact:</strong>
                {' '}
                {entityContact.split(':')[1] || ''}
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p>
                <strong>PO Number:</strong>
                {' '}
                {poNumber}
              </p>
              <p>
                <strong>Transaction Date:</strong>
                {' '}
                {new Date(transactionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow">
        <CardContent>
          <div className="mb-8 mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="mb-4 text-xl font-semibold">Order Items</h2>
            </div>
            <div className="space-x-4 space-y-2 text-right">
              <Button
                className="bg-gray-500 hover:bg-gray-700"
                onClick={() => handleMarkAll(true)}
              >
                Mark All
              </Button>
              <Button
                className="bg-gray-500 hover:bg-gray-700"
                onClick={handleUnMarkAll}
              >
                Unmark All
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-700"
                onClick={printLabels}
              >
                Print Labels
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Select</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Description</TableCell>
                <TableCell className="text-center">Quantity Ordered</TableCell>
                <TableCell className="text-center">Quantity Committed</TableCell>
                <TableCell className="text-center">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: OrderItem) => {
                const itemKey = item.item || item.itemId;
                const splits = splitItems[itemKey] || [];
                const isDisabled = !item?.quantityCommitted || item.quantityCommitted === 0;
                const totalQuantity = orderData?.isSalesOrder ? item.quantityCommitted : item.quantityOrdered;
                const hasSplits = splits.length > 0;

                return (
                  <React.Fragment key={itemKey}>
                    {/* Header row */}
                    <TableRow className="bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedRows.includes(itemKey)}
                          onChange={e => handleRowSelect(itemKey, e.target.checked)}
                          disabled={isDisabled}
                        />
                      </TableCell>
                      <TableCell>
                        {orderData?.isSalesOrder
                          ? (item?.item ? item.item.split(' ')[0] : 'Unknown Item')
                          : item.itemId}
                      </TableCell>
                      <TableCell>
                        {orderData?.isSalesOrder
                          ? (item?.item ? item.item.split(' ').slice(1).join(' ') : 'No Description')
                          : item.item}
                      </TableCell>
                      <TableCell className="text-center">
                        {item?.quantityOrdered ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {!hasSplits ? totalQuantity : null}
                      </TableCell>
                      <TableCell className="text-center">
                        {!isDisabled && (
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              className="inline-flex size-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                addSplit(item);
                              }}
                            >
                              <PlusCircle className="size-4 text-blue-500" />
                            </button>
                            {hasSplits && (
                              <button
                                type="button"
                                className="inline-flex size-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSplit(itemKey);
                                }}
                              >
                                <Trash className="size-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                    {/* Split rows */}
                    {hasSplits && splits.map((split, index) => (
                      <TableRow
                        key={split.id}
                        className="bg-white hover:bg-gray-50"
                      >
                        <TableCell />
                        <TableCell />
                        <TableCell className="pl-8 italic text-gray-500">
                          Carton
                          {' '}
                          {index + 1}
                        </TableCell>
                        <TableCell />
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Input
                              type="number"
                              value={split.quantity}
                              onChange={(e) => {
                                const newQuantity = Number.parseInt(e.target.value) || 0;
                                updateSplitQuantity(itemKey, split.id, newQuantity);
                              }}
                              className="w-20 text-center"
                              min="0"
                              max={totalQuantity}
                            />
                          </div>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap with QueryClientProvider
export default function OrderPage(props: { params: { id: string } }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OrderPageContent params={props.params} />
    </QueryClientProvider>
  );
}
