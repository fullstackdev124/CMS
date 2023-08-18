import { GetNumbers } from './tracking_numbers'
export interface SipGateways {
  id?: number;
  name: string;
  customerId: number;
  address: string;
  port: number;
  digitsStrip: string;
  description: string;
  type?: number;
  nums: GetNumbers[];
  isWhitelisted?: boolean;
}
