export class Delivery {
  deliveryId: string;
  customer: string;
  merchant: string;
  deposit: number;
  createdTimestamp: Date;
  timeoutTimestamp: Date;
  refundedTimestamp: Date;
  deliveredTimestamp: Date;
  active: boolean;
}
