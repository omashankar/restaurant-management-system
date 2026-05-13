/**
 * Single source of truth for all payment settings defaults.
 * Used by: API route, Settings page, and any other consumer.
 */

export const PAYMENT_METHOD_KEYS = [
  "cod", "cashCounter", "upi", "card", "debitCard",
  "netBanking", "wallet", "qrCode", "payLater", "bankTransfer",
];

export const PAYMENT_METHOD_LABELS = {
  cod:         "Cash on Delivery",
  cashCounter: "Cash at Counter",
  upi:         "UPI Payment",
  card:        "Credit Card",
  debitCard:   "Debit Card",
  netBanking:  "Net Banking",
  wallet:      "Wallet Payment",
  qrCode:      "QR Code Payment",
  payLater:    "Pay Later",
  bankTransfer:"Bank Transfer",
};

export const ALL_GATEWAYS = [
  "razorpay", "cashfree", "stripe", "paypal",
  "paytm", "phonepe", "payu", "ccavenue", "custom",
];

const BASE_GW = {
  enabled: false, testMode: true,
  apiKey: "", secretKey: "", merchantId: "", webhookSecret: "",
  callbackUrl: "", successUrl: "", failedUrl: "",
};

export const EMPTY_PAYMENT_SETTINGS = {
  methods: {
    cod: true, cashCounter: true, upi: true, card: true,
    debitCard: true, netBanking: true, wallet: true,
    qrCode: false, payLater: false, bankTransfer: false,
    defaultMethod: "cod",
  },
  gateways: {
    razorpay: { ...BASE_GW, priority: 1 },
    cashfree: { ...BASE_GW, priority: 2 },
    stripe:   { ...BASE_GW, priority: 3 },
    paypal:   { ...BASE_GW, priority: 4 },
    paytm:    { ...BASE_GW, priority: 5 },
    phonepe:  { ...BASE_GW, priority: 6 },
    payu:     { ...BASE_GW, priority: 7 },
    ccavenue: { ...BASE_GW, priority: 8 },
    custom:   {
      ...BASE_GW, testMode: false, priority: 9,
      gatewayName: "", apiEndpoint: "",
      paymentInstructions: "", upiId: "", bankDetails: "",
    },
  },
  bank: {
    accountHolderName: "", bankName: "", accountNumber: "",
    ifscCode: "", branchName: "", upiId: "", verified: false,
  },
  settlement: {
    frequency: "weekly",
    autoSettle: false,
    minWithdrawalAmount: 100,
  },
  tax: {
    gstNumber: "", gstPercentage: "0",
    panNumber: "", invoicePrefix: "INV",
  },
};
