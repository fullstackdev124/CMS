import { ReceivingNumber } from './receiving-number'
import { SipGateways } from './sip-gateway'

export interface RoutingAction {
  id?: number;
  action: string;
  sip_gatewayId: number;
  receiving_numberId: number;

  SipGateways?: SipGateways;
  ReceivingNumber?: ReceivingNumber;
}

export const RoutingActionEnum = {
  NotMapped: {
    key: 'NOT_MAPPED',
    value: 'Not Mapped'
  },
  ForwardTo: {
    key: 'FORWARD_TO',
    value: 'Forward'
  },
  RemapForwardTo: {
    key: 'REMAP_FORWARD_TO',
    value: 'Remap forward to'
  },
  // DialAgent: {
  //   key: 'DIAL_AGENT',
  //   value: 'Dial Agent'
  // },
  HangUp: {
    key: 'HANG_UP',
    value: 'Hang Up'
  }
}
