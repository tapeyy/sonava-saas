'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const [orderNumber, setOrderNumber] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      // eslint-disable-next-line no-alert
      alert('Please enter a valid order number.');
      return;
    }
    // Get the current path and append the order number
    const newPath = `${pathname}/${orderNumber}`;
    // Redirect to the new path
    router.push(newPath);
  };

  return (
    <div className="flex w-full items-center justify-center bg-gray-100 pt-48">
      <div className="w-full max-w-screen-lg rounded bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold">Order Lookup</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter Sales Order or Fulfillment Number"
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            className="w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
