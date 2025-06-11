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

export type NetsuiteOrder = {
  tranId: string;
  poNumber: string;
  items: OrderItem[];
  entity: string;
  entityContact: string;
  shipAddress: string;
  transactionDate: string;
  isSalesOrder: boolean;
};

export type PrintItem = {
  poNumber: string;
  tranId: string;
  isSalesOrder: boolean;
  quantity: number;
  cartonInfo?: string;
} & OrderItem;
