import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useOrderStore } from '../store/orderStore';
import { CartonSplitManager } from './CartonSplitManager';

export const OrderItemTable = () => {
  const {
    orderData,
    selectedRows,
    splitItems,
    toggleRow,
    markAll,
    updateSplitQuantity,
  } = useOrderStore();

  if (!orderData?.items) {
    return null;
  }

  return (
    <div>
      <div className="mb-8 mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Order Items</h2>
        </div>
        <div className="space-x-4 space-y-2 text-right">
          <Button
            className="bg-gray-500 hover:bg-gray-700"
            onClick={() => markAll(true)}
          >
            Mark All
          </Button>
          <Button
            className="bg-gray-500 hover:bg-gray-700"
            onClick={() => markAll(false)}
          >
            Unmark All
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
          {orderData.items.map((item) => {
            const itemKey = item.item || item.itemId;
            const splits = splitItems[itemKey] || [];
            const isDisabled = !item?.quantityCommitted || item.quantityCommitted === 0;
            const totalQuantity = orderData.isSalesOrder ? item.quantityCommitted : item.quantityOrdered;
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
                      onChange={() => toggleRow(itemKey)}
                      disabled={isDisabled}
                    />
                  </TableCell>
                  <TableCell>
                    {orderData.isSalesOrder
                      ? (item?.item ? item.item.split(' ')[0] : 'Unknown Item')
                      : item.itemId}
                  </TableCell>
                  <TableCell>
                    {orderData.isSalesOrder
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
                      <CartonSplitManager
                        item={item}
                        itemKey={itemKey}
                      />
                    )}
                  </TableCell>
                </TableRow>

                {/* Split rows */}
                {hasSplits && splits.map((split, index) => (
                  <TableRow
                    key={`split-${split.id}`}
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
    </div>
  );
};
