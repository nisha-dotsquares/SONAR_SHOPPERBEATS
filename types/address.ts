export interface Address {
  id?: number;
  title: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  date_of_birth?: string | null;
  is_default?: boolean;
  customTitle?:string;
}
export interface AddressFormValues {

  title: string;
  customTitle?: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  date_of_birth?: string  | null;
  is_default?: boolean;
}
