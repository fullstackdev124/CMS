import {GetNumbers} from '@app/models/tracking_numbers'

export interface ReceivingNumber {
  id?: number;
  number: string;
  tracking_numbers: any[];
  total_calls?: number;
  description?: string;
  customerId?: number;
  nums?: GetNumbers[];
  label?: string;
}

export interface DialNumber {
  id: number;
  number?: string;
  schedule?: string;
}

export const ReceivingNumberAction = {
  ForwardTo: {
    key: 'forward_to',
    value: 'Not Mapped'
  },
  RemapForwardTo: {
    key: 'remap_forward_to',
    value: 'Remap forward to'
  }
}
