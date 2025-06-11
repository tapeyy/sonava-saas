import { Card, CardContent } from '@/components/ui/card';

import { useOrderStore } from '../store/orderStore';

export const OrderHeader = () => {
  const { orderData } = useOrderStore();

  if (!orderData) {
    return null;
  }

  const {
    tranId,
    poNumber,
    entity,
    entityContact,
    shipAddress,
    transactionDate,
  } = orderData;

  return (
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
  );
};
