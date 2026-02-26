export interface TaxSettings {
  taxName: string;
  taxPercentage: number;
  serviceCharge: number;
  taxEnabled: boolean;
  serviceChargeEnabled: boolean;
}

export interface ReceiptDesignSettings {
  logoUrl: string;
  headerText: string;
  footerMessage: string;
  showQrCode: boolean;
  paperSize: "80mm" | "a4";
}

export interface PaymentMethodSetting {
  id: string;
  name: string;
  enabled: boolean;
}

export type DefaultOrderType = "dine-in" | "takeaway" | "delivery";

export interface POSPreferences {
  defaultOrderType: DefaultOrderType;
  autoPrintReceipt: boolean;
  soundOnNewOrder: boolean;
  kitchenAutoAccept: boolean;
}

export interface SettingsState {
  tax: TaxSettings;
  receipt: ReceiptDesignSettings;
  paymentMethods: PaymentMethodSetting[];
  pos: POSPreferences;
}
