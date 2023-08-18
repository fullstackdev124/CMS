export interface IPaymentMethod{
  fullName:string;
  cardNumber:string;
  month:string;
  year:string;
  cvv:string;
  postalCode:string;
  country: string;
}

export interface IMonth {
  name: string,
  code: string,
}

export interface IYear {
  name: string,
  code: string,
}
