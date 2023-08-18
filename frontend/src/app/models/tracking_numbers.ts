import { ReceivingNumber } from '@app/models/receiving-number'
import { ICustomer } from './user';
import { SipGateways } from './sip-gateway';

export interface GetNumbers {
	id?: number;
	active?: number;
	tracking_number: string;
	tracking_sourceId?: number;
  receiving_numberId?: number;
  sip_gatewayId?: number;
  routing_action?: string;
	notifications?: number;
	text_support?: number;
	number_tags?: string;
	failsafe_number?: string;
	renewal_date?: string;
	customerId?: number;
	description?: string;
  phonebook_id?: string;
  total_calls?: number;
  NumberProvider?: ReceivingNumber;
  ReceivingNumber?: ReceivingNumber;
  Customer?: ICustomer;
	TrackingSources?: GetSources;
  SipGateways?: SipGateways;
  update_call_logs?: boolean;

  agent_id?: number;
  agent_name?: string;
  agent_timeout?: number,
  failover_agent_id?: number,

  formatted_tracking_number?: string;
}

export interface GetSources {
  id?: number;
  name?: string;
  type?: string;
  position?: number;
  lastTouch?: number;
  customerId?: number;
  updatedAt?: string;
  description?: string;
  color?: string;
}

export interface Country {
  id: number;
  iso: string;
  name: string;
  nicename: string;
  iso3: string;
  numcode: number;
  phonecode: number
}
