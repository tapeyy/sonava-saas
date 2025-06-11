'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { LabelPreview } from '@/features/labelGenerator/components/LabelPreview';
import { OrderHeader } from '@/features/labelGenerator/components/OrderHeader';
import { OrderItemTable } from '@/features/labelGenerator/components/OrderItemTable';
import { useOrderData } from '@/features/labelGenerator/hooks/useOrderData';
import { useOrderStore } from '@/features/labelGenerator/store/orderStore';
import { useBarcodeScan } from '@/hooks/useBarcodeScan';

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

function OrderPageContent(props: { params: { id: string } }) {
  const { id } = props.params;
  const router = useRouter();
  const { toast } = useToast();
  const { fetchOrderData } = useOrderData();
  const { isLoading, error } = useOrderStore();
  const [orderNumber, setOrderNumber] = useState('');

  // Add barcode scanning
  useBarcodeScan({
    enabled: true,
    onScan: (barcode) => {
      if (barcode !== id) {
        router.push(barcode);
      }
    },
  });

  // Fetch order data on mount and id change
  useEffect(() => {
    if (id) {
      fetchOrderData(id);
    }
  }, [id, fetchOrderData]);

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

  if (isLoading) {
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

      {/* Order Content */}
      <OrderHeader />
      <Card className="shadow">
        <CardContent>
          <OrderItemTable />
          <LabelPreview />
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
