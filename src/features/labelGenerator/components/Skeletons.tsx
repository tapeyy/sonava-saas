import { Card, CardContent } from '@/components/ui/card';

export const OrderHeaderSkeleton = () => (
  <Card className="mb-8 animate-pulse shadow">
    <CardContent>
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="pt-4">
        <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-200" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-4 w-40 rounded bg-gray-200" />
          <div className="ml-auto h-4 w-48 rounded bg-gray-200" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const OrderItemTableSkeleton = () => (
  <div>
    <div className="mb-8 mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
      </div>
      <div className="space-x-4 space-y-2 text-right">
        <div className="inline-block h-9 w-24 rounded-md bg-gray-200" />
        <div className="inline-block h-9 w-24 rounded-md bg-gray-200" />
      </div>
    </div>

    <div className="rounded-md border">
      <div className="grid h-12 grid-cols-6 items-center gap-4 border-b bg-gray-50 px-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-gray-200" />
        ))}
      </div>
      <div className="divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-6 items-center gap-4 p-4">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-4 rounded bg-gray-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const LabelPreviewSkeleton = () => (
  <div className="mt-8 animate-pulse">
    <div className="mb-4 flex items-center justify-between">
      <div className="h-6 w-32 rounded bg-gray-200" />
      <div className="h-9 w-24 rounded-md bg-gray-200" />
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-lg bg-gray-200" />
      ))}
    </div>
  </div>
);
