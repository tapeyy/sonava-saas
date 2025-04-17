// CartonAllocator.tsx
// A drag-and-drop modal for allocating selected items into cartons with quantities

'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

type CartonAllocatorProps = {
  items: { itemId: string; item?: string }[];
  selectedItems: string[];
  onClose: () => void;
};

type CartonItem = {
  itemId: string;
  label: string;
  quantity: number;
};

type Carton = {
  id: number;
  items: CartonItem[];
};

export function CartonAllocator({ items, selectedItems, onClose }: CartonAllocatorProps) {
  const { toast } = useToast();
  const [cartons, setCartons] = useState<Carton[]>([{ id: 1, items: [] }]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const availableItems = items.filter(i => selectedItems.includes(i.itemId));

  const sensors = useSensors(useSensor(PointerSensor));

  const handleAddCarton = () => {
    setCartons(prev => [...prev, { id: prev.length + 1, items: [] }]);
  };

  const handleDrop = (event: DragEndEvent, cartonId: number) => {
    const { active } = event;
    const draggedItem = availableItems.find(i => i.itemId === active.id);
    if (!draggedItem) {
      return;
    }

    const label = draggedItem.item || draggedItem.itemId;
    const qty = quantities[draggedItem.itemId] || 1;

    setCartons(prev =>
      prev.map(c =>
        c.id === cartonId
          ? {
              ...c,
              items: [...c.items, { itemId: draggedItem.itemId, label, quantity: qty }],
            }
          : c,
      ),
    );
  };

  const handleRemoveItem = (cartonId: number, itemId: string) => {
    setCartons(prev =>
      prev.map(c =>
        c.id === cartonId ? { ...c, items: c.items.filter(i => i.itemId !== itemId) } : c,
      ),
    );
  };

  const handleQuantityChange = (itemId: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  const handlePrint = () => {
    const printContent = cartons
      .map(
        carton => `
        <div style="width: 100mm; height: 150mm; padding: 10px; border: 1px solid #000; box-sizing: border-box; page-break-after: always;">
          <h2 style="font-size: 20px;">Carton #${carton.id}</h2>
          <ul style="margin-top: 10px; font-size: 16px;">
            ${carton.items.map(item => `<li>${item.label} - Qty: ${item.quantity}</li>`).join('')}
          </ul>
        </div>
      `,
      )
      .join('');

    const win = window.open('', '_blank');
    if (!win) {
      toast({
        variant: 'destructive',
        title: 'Warning',
        description: 'Enable pop-ups to print carton labels.',
      });
      return;
    }
    win.document.write(`<html><body>${printContent}</body></html>`);
    win.document.close();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-6">
        <h1 className="mb-4 text-xl font-bold">Carton Allocator</h1>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {cartons.map(carton => (
            <div key={carton.id} className="rounded border p-4">
              <h2 className="mb-2 font-semibold">
                Carton #
                {carton.id}
              </h2>
              <ul className="mb-4 space-y-1">
                {carton.items.map(item => (
                  <li
                    key={item.itemId}
                    className="flex items-center justify-between rounded bg-gray-100 px-2 py-1"
                  >
                    {item.label}
                    {' '}
                    - Qty:
                    {item.quantity}
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveItem(carton.id, item.itemId)}
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={e => handleDrop(e, carton.id)}
              >
                <SortableContext
                  items={availableItems.map(i => i.itemId)}
                  strategy={verticalListSortingStrategy}
                >
                  {availableItems
                    .filter(i =>
                      !cartons.some(c => c.items.find(x => x.itemId === i.itemId)),
                    )
                    .map(item => (
                      <DraggableItem
                        key={item.itemId}
                        id={item.itemId}
                        label={item.item || item.itemId}
                        quantities={quantities}
                        handleQuantityChange={handleQuantityChange}
                      />
                    ))}
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="secondary" onClick={handleAddCarton}>
            + Add Carton
          </Button>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>Print Carton Labels</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableItem({
  id,
  label,
  quantities,
  handleQuantityChange,
}: {
  id: string;
  label: string;
  quantities: { [key: string]: number };
  handleQuantityChange: (itemId: string, qty: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="cursor-move rounded border bg-blue-100 p-2"
    >
      {label}
      <Input
        type="number"
        min={1}
        className="mt-1"
        value={quantities[id] || ''}
        onChange={e => handleQuantityChange(id, Number.parseInt(e.target.value))}
        placeholder="Qty"
      />
    </div>
  );
}
