export type SplitItem = {
  id: string;
  quantity: number;
  parentItemId: string;
};

export type ItemSplits = {
  [key: string]: SplitItem[];
};

export type OrderItem = {
  item: string;
  itemId: string;
  quantityCommitted: number;
  quantityOrdered: number;
  description?: string;
};

export type PrintItem = {
  item: string;
  itemId: string;
  quantityCommitted: number;
  quantityOrdered: number;
  poNumber: string;
  tranId: string;
  isSalesOrder: boolean;
  quantity: number;
  cartonInfo?: string;
};

export type NetsuiteOrder = {
  items: OrderItem[];
  isSalesOrder: boolean;
  tranId: string;
  poNumber: string;
  entity: string;
  entityContact: string;
  shipAddress: string;
  transactionDate: string;
};
