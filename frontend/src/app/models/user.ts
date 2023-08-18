export interface IUserLogin {
  username: string;
  password: string;
}

export interface IUserToken {
  id: string;
  userId: number;
  srcip: string;
  ttl: number;
  created: string;
  expires: Date;
  rememberedIf: boolean;
}

export interface IUserPreferences {
  darkMode: boolean;
}

export interface IUser {
  id: number;
  activated: number | boolean;
  emailVerified: boolean;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  primaryAdmin: number;
  password: string;
  note: string;
  realm: null; // TODO;
  roleId: number;
  customerId: number;
  timezone: string;
  uiSettings: string;
  languagesId: number;
  DashRoleMapping: IRoleMapping[];
  Customer: ICustomer;
  Languages: ILanguages;
  label?: string;
  tracking_numberId?: number;
}

export interface ILanguages {
  id: number;
  iso: string;
  name: string;
}

export interface IRoleMapping {
  id: number;
  customerId: number;
  principalId: string;
  principalType: string;
  roleId: number;
  Customer: ICustomer;
  DashRole: IRole;
}

export interface IRole {
  id: number;
  name: string;
  customerId: number;
  created: Date;
  description: string;
  modified: Date;
  Customer: ICustomer;
}

export interface IRoleChild {
  id: number;
  name: string;
  description: string;
  created: Date;
  modified: Date;
  CustomerId: number;
  Customer: ICustomer;
  Childs: IRoleChild[]; // NB
}

export interface ICustomer {
  id: number;
  balance: number;
  enabled: number | boolean;
  vatNumber?: string;
  companyName: string;
  companyId?: string;
  firstName?: string;
  lastName?: string;
  contactEmail?: string;
  billingEmail?: string;
  billingId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  phone?: string;
  token?: string;
  settings?: string;
  accounting_type?: number;
  isPostpaid: boolean;
}
