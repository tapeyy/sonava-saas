'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useBarcodeScan } from '@/hooks/useBarcodeScan';

export default function LabelGeneratorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState('');

  // Add barcode scanning
  const { isValidScan } = useBarcodeScan();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedOrderNumber = orderNumber.trim().toUpperCase();

    if (!isValidScan(trimmedOrderNumber)) {
      toast({
        title: 'Invalid Order Number',
        description: 'Please enter a valid Sales Order (SXXXXX) or Item Fulfillment (IFXXXXX) number.',
        variant: 'destructive',
      });
      return;
    }

    router.push(`/service/labelgenerator/${trimmedOrderNumber}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold">Label Generator</h1>
              <p className="mt-2 text-gray-600">
                Enter or scan a Sales Order (SXXXXX) or Item Fulfillment (IFXXXXX) number
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  type="text"
                  placeholder="Enter Order Number"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-blue-500 hover:bg-blue-700">
                  Generate Labels
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>You can also use a barcode scanner to automatically process orders</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
