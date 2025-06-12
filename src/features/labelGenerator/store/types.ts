export type OrderItem = {
  item: string;
  itemId?: string;
  description: string;
  quantityOrdered: number;
  quantityCommitted: number;
  location: string;
  rate: number;
  amount: number;
  units?: string;
  entryId: string; // Unique identifier for each item entry
};

export type NetsuiteOrder = {
  id: string;
  tranId: string;
  entity: string;
  subsidiary: string;
  location: string;
  memo?: string;
  shipDate?: string;
  poNumber?: string;
  entityContact: string;
  shipAddress: string;
  transactionDate: string;
  items: OrderItem[];
  isSalesOrder: boolean;
};

export type Split = {
  id: string;
  quantity: number;
  parentEntryId: string; // Changed from parentItemId to parentEntryId
};

export type ItemSplits = {
  [entryId: string]: Split[]; // Changed from itemKey to entryId
};

export type PrintItem = {
  poNumber: string;
  tranId: string;
  isSalesOrder: boolean;
  quantity: number;
  cartonInfo?: string;
} & OrderItem;
