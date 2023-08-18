import { GetNumbers } from '@app/models/tracking_numbers';
export interface LogsCount {
  total_calls: number;
  today: number;
  yesterday: number;
  cur_week: number;
  past_week: number;
  cur_month: number;
  past_month: number;
}

export interface CallLog {
	id?: number;
	callDirection?: string;
	callerNumber?: string;
	opnumberid?: number;
	sessionData?: string;
	callrecordingid?: number;
	metrics?: string;
	routingid?: number;
	flag?: number;
	callTerminated?: number;
	callStatus?: string;
	callStatusMessage?: string;
	duration?: number;
	msDuration?: number;
	setuptime?: number;
	created?: string;
	isCollapse?: boolean;
	Phonebook?: PhoneBook;
	OpNumber?: GetNumbers;
	source_name?: string;
}

export interface CallLogSupport {
	id?: number;
	callDirection?: string;
	callerNumber?: string;
	sessionData?: string;
	metrics?: string;
	flag?: number;
	callTerminated?: number;
	callStatus?: string;
	callStatusMessage?: string;
	duration?: number;
	msDuration?: number;
	setuptime?: number;
	created?: string;
	isCollapse?: boolean;
	routingAddress?: string;
	receivingNumber?: string;
	trackingSourceName?: string;
	Phonebook?: PhoneBook;
}

export interface LightLog {
	id?: number;
	callDirection?: string;
	callerNumber?: string;
	opnumberid?: number;
	sessionData?: string;
	callrecordingid?: number;
	caller_contactId?: number;
	metrics?: string;
	routingid?: number;
	flag?: number;
	callTerminated?: number;
	callStatus?: string;
	callStatusMessage?: string;
	duration?: number;
	msDuration?: number;
	setuptime?: number;
	created?: string;
	isCollapse?: boolean;
	Phonebook?: PhoneBook;
	LightOpNumber?: GetNumbers;
}

export interface PhoneBook {
	id?: number;
	name?: string;
	email?: string;
	street?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
	note?: string;
	contact_number?: string;
}

export interface CallRecording {
	id: number;
	name: string;
	path: string;
	timestamp: string;
	duration: number;
	tags: string;
	visible: number;
	content: string;
}

export interface FilterObj {
	where?: any;
	order?: string;
	limit?: number;
	skip?: number;
}

export interface ActivityData {
  series?: any[],
  tabular?: any,
  xAxis?: any,
}


export interface IBlacklistNumber {
  id: number;
  customerId: number;
  number: string;
  description?: string
}
