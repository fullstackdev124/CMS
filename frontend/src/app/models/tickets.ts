export interface ITicket {
	id: number,
	slatimeout: Date,
	title: string,
	customerId: number,
	serviceId: number,
	creator: number
}

export interface ITicketCreator {
  activated: number,
  email: string,
  note: string,
  username: string,
  realm: string,
  emailVerified: boolean,
  id: number
}

export interface ITicketCustomer {
  id: number,
  enabled: number,
  name: string,
  vatnumber: string,
  businessname: string,
  email: string,
  emailaccount: string
}

export interface ITicketService {
  id: number,
  name: string,
  label: string,
  description: string
}

export interface ITicketVersion {
	id: number,
	version: number,
	priority: number,
	scheduledSince: Date,
	scheduledTo: Date,
	createdAt: Date,
	note: string,
	state: number,
	ticketId: number,
	owner: number
}

export interface ITicketAsset {
	id: number,
	name: string,
	vendor: string,
	model: string,
	serial: string,
	managementip: string,
	note: string,
	customerId: number
}

export interface ITicketAssetRel {
	id: number,
  assetId: number,
  versionId: number
}

export interface ITicketAttachment {
	id: number,
	nome: string,
	url: string,
	note: string,
	versionId: number
}

export interface ITicketNotification {
	id: number,
	text: string,
	versionId: number
}

export interface ITicketObserver {
	id: number,
	versionId: number,
	userId: number
}

export interface ITicketOwner {
  activated: number,
  email: string,
  note: string,
  username: string,
  realm: string,
  emailVerified: true,
  id: number
}

export interface IticketState {
  id: number,
  name: string,
  label: string
}
