'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

export default function OrderPage(params: { params: { id: string } }) {
  const { id } = params.params;
  const router = useRouter();

  // State for Order Lookup
  const [orderNumber, setOrderNumber] = useState('');

  // State for order data
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Fetching order data
  const fetchOrderData = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      const response = await fetch(`/api/proxy?id=${orderId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        setError('The order number you entered is invalid. Please try again.');
      }
      const data = await response.json();

      // Sort items: Items with `quantityCommitted === 0` go to the bottom
      const sortedItems = [...data.order.items].sort((a, b) => {
        if (a.quantityCommitted === 0 && b.quantityCommitted > 0) {
          return 1;
        }
        if (b.quantityCommitted === 0 && a.quantityCommitted > 0) {
          return -1;
        }
        return 0;
      });

      // Automatically select items with `quantityCommitted > 0`
      const autoSelected = sortedItems
        .filter(item => item.quantityCommitted > 0)
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
  }, []);

  useEffect(() => {
    if (id) {
      fetchOrderData(id);
    }
  }, [id, fetchOrderData]);

  // Handle order number form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please enter a valid order number.');
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
      const selectableItems = orderData?.items.filter(
        (item: { quantityCommitted: number }) => item.quantityCommitted > 0,
      );
      setSelectedRows(
        isSelected
          ? selectableItems.map((item: { item: any }) => item.item)
          : [],
      );
    },
    [orderData?.items],
  );

  // Handle "Unmark All" functionality
  const handleUnMarkAll = useCallback(() => {
    setSelectedRows([]);
  }, []);

  // Handle printing labels
  const printLabels = useCallback(() => {
    if (!selectedRows || !selectedRows.length) {
      setError('Please select at least one item to print labels.');
      return;
    }

    const selectedItems = orderData.items.filter((item: { item: string }) =>
      selectedRows.includes(item.item),
    );

    const printContent = selectedItems
      .map(
        (item: { item: string; quantityCommitted: any }) => `
      <div class="label" style="width: 100mm; height: 150mm; border: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; padding: 10px; box-sizing: border-box; page-break-after: always;">
        <!-- Header Section -->
        <div style="width: 100%; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px;">
          <h1 style="font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase;">PO #: ${
            orderData.poNumber
          }</h1>
          <p style="font-size: 14px; margin: 0; color: #555;">Order #: ${
            orderData.tranId
          }</p>
        </div>

        <!-- Logo Section -->
        <div style="width: 100%; display: flex; justify-content: center; align-items: center; margin-bottom: 10px;">
          <img src="/assets/images/mcc-logo-grayscale.png" alt="Millennium Coupling Company" style="width: 226px; height: 100px; object-fit: contain;" />

        </div>
  
        <!-- Item Information -->
        <div style="width: 100%; flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <p style="font-size: 24px; font-weight: bold; margin: 0;">Part Number</p>
          <p style="font-size: 22px; margin: 5px 0;">${
            item.item.split(' ')[0]
          }</p>

          <p style="font-size: 24px; font-weight: bold; margin: 0;">Description</p>
          <p style="font-size: 18px; margin: 5px 0;">${
            item?.item
              ? item.item.split(' ').slice(1).join(' ')
              : 'No Description'
          }</p>
          

          <p style="font-size: 24px; font-weight: bold; margin-top: 20;">Quantity</p>
          <p style="font-size: 22px; margin: 5px 0;">${
            item.quantityCommitted
          }</p>
        </div>
  
        <!-- Footer Section -->
        <div style="width: 100%; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px;">
          <p style="font-size: 12px; color: #777; margin: 0;">Millennium Coupling Company</p>
          <p style="font-size: 12px; color: #777; margin: 0;">www.mcc-ltd.com.au</p>
        </div>
      </div>
    `,
      )
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
  }, [orderData, selectedRows]);

  const {
    tranId,
    poNumber,
    items,
    entity,
    entityContact,
    shipAddress,
    transactionDate,
  } = useMemo(() => {
    return orderData || {};
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
              <Button className="bg-blue-500 hover:bg-blue-700" type="submit">
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
                <TableCell className="text-center">
                  Quantity Committed
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(
                (item: {
                  item?: string | null;
                  quantityCommitted?: number;
                  quantityOrdered?: number;
                }) => {
                  // Fallbacks and type safety for `item` properties
                  const itemName = item?.item
                    ? item.item.split(' ')[0]
                    : 'Unknown Item';
                  const itemDescription = item?.item
                    ? item.item.split(' ').slice(1).join(' ')
                    : 'No Description';
                  const isDisabled = item?.quantityCommitted === 0;

                  return (
                    <TableRow
                      key={item?.item || Math.random()}
                      className="hover:bg-gray-100"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="form-checkbox size-5 text-blue-600"
                          checked={selectedRows.includes(item?.item || '')}
                          onChange={e =>
                            handleRowSelect(item?.item || '', e.target.checked)}
                          disabled={isDisabled}
                        />
                      </TableCell>
                      <TableCell>{itemName}</TableCell>
                      <TableCell>{itemDescription}</TableCell>
                      <TableCell className="text-center">
                        {item?.quantityOrdered ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {item?.quantityCommitted ?? 0}
                      </TableCell>
                    </TableRow>
                  );
                },
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
