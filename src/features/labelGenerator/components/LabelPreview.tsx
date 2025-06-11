import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import { useOrderStore } from '../store/orderStore';
import type { PrintItem } from '../store/types';

export const LabelPreview = () => {
  const { toast } = useToast();
  const {
    orderData,
    selectedRows,
    splitItems,
  } = useOrderStore();

  if (!orderData) {
    return null;
  }

  const validateSplitQuantities = () => {
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
  };

  const printLabels = () => {
    if (!selectedRows || !selectedRows.length) {
      toast({
        variant: 'destructive',
        title: 'Cannot print labels',
        description: 'Please select at least one item to print labels.',
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
          quantity: orderData.isSalesOrder ? item.quantityCommitted : item.quantityOrdered,
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
      toast({
        variant: 'destructive',
        title: 'Print Error',
        description: 'Please allow pop-ups to print labels.',
      });
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
    }, 300);
  };

  return (
    <div className="mt-4 flex justify-end">
      <Button
        className="bg-blue-500 hover:bg-blue-700"
        onClick={printLabels}
      >
        Print Labels
      </Button>
    </div>
  );
};
