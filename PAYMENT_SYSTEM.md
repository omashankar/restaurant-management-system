# Restaurant-Wise Payment Management System

## Complete Multi-Restaurant SaaS Payment Architecture

This system provides **independent payment management** for each restaurant in a multi-tenant SaaS platform, similar to Swiggy, Zomato, and Shopify multi-vendor architecture.

---

## 🎯 Key Features

### ✅ Restaurant-Level Independence
- Each restaurant has its own payment methods, gateway credentials, bank account, and tax settings
- Complete isolation between restaurants
- No shared payment credentials

### ✅ Multiple Payment Gateways
- **Razorpay** (preferred for India - UPI, Cards, Net Banking)
- **Stripe** (international payments)
- **PayPal** (global)
- **PhonePe** (India)
- **Paytm** (India)

### ✅ Payment Methods Supported
- Cash on Delivery (COD)
- Cash at Counter
- UPI Payment
- Credit Card
- Debit Card
- Net Banking
- Wallet Payment
- QR Code Payment
- Pay Later
- Bank Transfer

### ✅ Security Features
- **AES-256-GCM encryption** for gateway API keys and secrets
- Masked sensitive data in UI (account numbers, keys)
- Webhook signature verification (HMAC-SHA256)
- CSRF protection
- Encrypted storage in MongoDB

### ✅ Commission Management
- Fixed commission per transaction
- Percentage-based commission
- Category-wise commission (future)
- Auto-deduction before payout

### ✅ Settlement & Payouts
- Daily, Weekly, Monthly, or Manual settlement
- Minimum withdrawal amount
- Auto-settlement toggle
- Payout request system with approval workflow

### ✅ Tax Configuration
- GST Number
- GST Percentage (auto-applied at checkout)
- PAN Number
- Invoice Prefix customization

### ✅ Transaction Management
- Complete transaction history
- Filter by status, method, date range
- Revenue, commission, and net earnings summary
- Export capability (future)

### ✅ Refund Management
- Full and partial refunds
- Approval/rejection workflow
- Refund tracking and history

### ✅ Super Admin Controls
- View all restaurant payment settings
- Set/modify commission rates
- Freeze/unfreeze restaurant accounts
- Approve/reject payout requests
- Monitor failed payments
- Transaction logs across all restaurants

---

## 📁 File Structure

```
src/
├── app/
│   ├── (app)/
│   │   └── payment-settings/
│   │       └── page.jsx                    # Main restaurant payment settings page
│   ├── api/
│   │   ├── payment-settings/
│   │   │   ├── route.js                    # GET/PATCH payment settings
│   │   │   └── test-gateway/
│   │   │       └── route.js                # Test gateway connection
│   │   ├── payment-transactions/
│   │   │   └── route.js                    # GET transaction history
│   │   ├── payout-requests/
│   │   │   └── route.js                    # GET/POST payout requests
│   │   ├── refund-requests/
│   │   │   ├── route.js                    # GET/POST refund requests
│   │   │   └── [id]/
│   │   │       └── route.js                # PATCH approve/reject refund
│   │   └── super-admin/
│   │       └── restaurant-payments/
│   │           ├── route.js                # GET all restaurant payments
│   │           └── [id]/
│   │               └── route.js            # PATCH freeze/commission/payout
│   └── super-admin/
│       └── restaurant-payments/
│           └── page.jsx                    # Super admin payment management
├── components/
│   └── payment-settings/
│       ├── PaymentSettingsSidebar.jsx      # Tab navigation
│       ├── SectionCard.jsx                 # Reusable card with save button
│       ├── PaymentMethodsSection.jsx       # Enable/disable payment methods
│       ├── GatewaySettingsSection.jsx      # Configure gateway credentials
│       ├── BankAccountSection.jsx          # Bank account details
│       ├── SettlementSection.jsx           # Settlement frequency & settings
│       ├── TaxSettingsSection.jsx          # GST, PAN, invoice prefix
│       ├── PaymentTransactionsSection.jsx  # Transaction history table
│       ├── RefundManagementSection.jsx     # Refund requests & approval
│       └── PayoutRequestsSection.jsx       # Payout requests
├── lib/
│   └── cryptoUtils.js                      # AES-256-GCM encryption utilities
└── config/
    └── navigation.jsx                      # Updated with Payment Settings menu
```

---

## 🗄️ Database Collections

### `restaurant_payment_settings`
```javascript
{
  restaurantId: ObjectId,
  methods: {
    cod: Boolean,
    cashCounter: Boolean,
    upi: Boolean,
    card: Boolean,
    debitCard: Boolean,
    netBanking: Boolean,
    wallet: Boolean,
    qrCode: Boolean,
    payLater: Boolean,
    bankTransfer: Boolean,
    defaultMethod: String
  },
  gateways: {
    razorpay: {
      enabled: Boolean,
      testMode: Boolean,
      apiKey: String (encrypted),
      secretKey: String (encrypted),
      merchantId: String,
      webhookSecret: String (encrypted)
    },
    stripe: { ... },
    paypal: { ... },
    phonepe: { ... },
    paytm: { ... }
  },
  bank: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String (masked in API),
    ifscCode: String,
    branchName: String,
    upiId: String,
    verified: Boolean
  },
  settlement: {
    frequency: String, // daily | weekly | monthly | manual
    autoSettle: Boolean,
    minWithdrawalAmount: Number
  },
  tax: {
    gstNumber: String,
    gstPercentage: String,
    panNumber: String,
    invoicePrefix: String
  },
  commission: {
    type: String, // fixed | percentage
    value: String
  },
  updatedAt: Date
}
```

### `payment_transactions`
```javascript
{
  restaurantId: ObjectId,
  transactionId: String,
  orderId: String,
  customerName: String,
  paymentMethod: String,
  amount: Number,
  commission: Number,
  netAmount: Number,
  status: String, // paid | pending | failed | refunded
  gateway: String,
  gatewayTxnId: String,
  createdAt: Date
}
```

### `payout_requests`
```javascript
{
  restaurantId: ObjectId,
  requestId: String,
  amount: Number,
  status: String, // pending | approved | rejected
  note: String,
  adminNote: String,
  requestedBy: ObjectId,
  createdAt: Date,
  processedAt: Date
}
```

### `refund_requests`
```javascript
{
  restaurantId: ObjectId,
  refundId: String,
  orderId: String,
  customerName: String,
  originalAmount: Number,
  refundAmount: Number,
  type: String, // full | partial
  reason: String,
  status: String, // pending | approved | rejected
  adminNote: String,
  requestedBy: ObjectId,
  createdAt: Date,
  processedAt: Date
}
```

---

## 🔐 Security Implementation

### Encryption
```javascript
// src/lib/cryptoUtils.js
- AES-256-GCM encryption for gateway secrets
- Key derived from PAYMENT_ENCRYPT_KEY env var
- IV (12 bytes) + Auth Tag (16 bytes) + Ciphertext
- Base64 encoding for storage
```

### Masking
```javascript
// API responses mask sensitive data:
- Gateway keys: "••••••••4589"
- Bank account: "XXXXXX4589"
- Secrets never sent to client in plain text
```

### Webhook Verification
```javascript
// Razorpay: HMAC-SHA256(orderId|paymentId, secret)
// Stripe: HMAC-SHA256(timestamp.payload, secret)
```

---

## 🚀 Usage Guide

### For Restaurant Admins

#### 1. Configure Payment Methods
Navigate to **Payment Settings → Payment Methods**
- Toggle payment methods on/off
- Set default payment method
- Changes apply immediately to customer checkout

#### 2. Setup Payment Gateway
Navigate to **Payment Settings → Gateway Settings**
- Choose gateway (Razorpay, Stripe, etc.)
- Enable gateway
- Enter API Key, Secret Key, Merchant ID
- Test connection before saving
- Keys are encrypted automatically

#### 3. Add Bank Account
Navigate to **Payment Settings → Bank Account**
- Enter account holder name, bank name
- Add account number, IFSC code
- Provide UPI ID for instant settlements
- Account number is masked after saving

#### 4. Configure Settlement
Navigate to **Payment Settings → Settlement**
- Choose frequency: Daily, Weekly, Monthly, Manual
- Set minimum withdrawal amount
- Enable auto-settlement (optional)

#### 5. Setup Tax Details
Navigate to **Payment Settings → Tax Settings**
- Enter GST Number
- Set GST Percentage (auto-applied at checkout)
- Add PAN Number
- Customize invoice prefix

#### 6. View Transactions
Navigate to **Payment Settings → Transactions**
- See all payment transactions
- Filter by status, method, date
- View revenue, commission, net earnings

#### 7. Manage Refunds
Navigate to **Payment Settings → Refunds**
- Create refund requests
- Approve/reject refunds
- Track refund status

#### 8. Request Payouts
Navigate to **Payment Settings → Payout Requests**
- Request manual withdrawal
- View payout history
- Track approval status

---

### For Super Admins

#### 1. Monitor All Restaurants
Navigate to **Super Admin → Restaurant Payments**
- View all restaurants with payment overview
- See enabled gateways, revenue, commission
- Monitor pending payouts

#### 2. Set Commission
- Click commission value for any restaurant
- Choose Fixed or Percentage
- Enter commission value
- Commission auto-deducts before payout

#### 3. Freeze/Unfreeze Accounts
- Freeze suspicious accounts
- Prevent new transactions
- Unfreeze when resolved

#### 4. Approve Payouts
- View pending payout requests
- Approve or reject with admin note
- Track payout history

---

## 🔌 API Endpoints

### Restaurant APIs (Tenant-scoped)

#### `GET /api/payment-settings`
Load restaurant payment settings (admin/manager)

#### `PATCH /api/payment-settings`
Save a section of payment settings (admin only)
```json
{
  "section": "gateways",
  "data": { "razorpay": { "enabled": true, ... } }
}
```

#### `POST /api/payment-settings/test-gateway`
Test gateway connection (admin only)
```json
{ "gateway": "razorpay" }
```

#### `GET /api/payment-transactions`
Get paginated transaction history
Query params: `page`, `status`, `method`, `from`, `to`

#### `GET /api/payout-requests`
List payout requests (admin only)

#### `POST /api/payout-requests`
Create payout request (admin only)
```json
{ "amount": 5000, "note": "Monthly settlement" }
```

#### `GET /api/refund-requests`
List refund requests (admin/manager)

#### `POST /api/refund-requests`
Create refund request (admin/manager)
```json
{
  "orderId": "ORD-C-123",
  "refundAmount": 500,
  "type": "partial",
  "reason": "Item not available"
}
```

#### `PATCH /api/refund-requests/[id]`
Approve/reject refund (admin/manager)
```json
{ "action": "approve", "adminNote": "Approved" }
```

---

### Super Admin APIs

#### `GET /api/super-admin/restaurant-payments`
Get all restaurants with payment overview
Query params: `page`

#### `PATCH /api/super-admin/restaurant-payments/[id]`
Perform admin actions
```json
// Freeze account
{ "action": "freeze" }

// Unfreeze account
{ "action": "unfreeze" }

// Set commission
{ "action": "setCommission", "type": "percentage", "value": "5" }

// Approve payout
{ "action": "approvePayout", "payoutId": "...", "adminNote": "Approved" }

// Reject payout
{ "action": "rejectPayout", "payoutId": "...", "adminNote": "Insufficient balance" }
```

---

## 🎨 UI/UX Features

### Design System
- **Dark theme** with zinc color palette
- **Emerald accent** for primary actions
- **Status badges** with color coding
- **Responsive** mobile-first layout
- **Loading states** with skeleton screens
- **Toast notifications** for feedback

### Components
- **SectionCard**: Reusable card with title, description, save button
- **Toggle**: Boolean switch with label and hint
- **Field**: Input wrapper with label and hint
- **Input**: Styled text/number/password input
- **Table**: Responsive transaction/refund/payout tables
- **Modal**: Commission editing modal

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus states
- Screen reader support

---

## 🔄 Customer Checkout Flow

1. Customer adds items to cart
2. Proceeds to checkout
3. **GET /api/customer/checkout-meta** returns:
   - Restaurant-specific payment methods (from `restaurant_payment_settings`)
   - Tax percentage (from `tax.gstPercentage`)
   - Enabled methods only
   - Online methods disabled if no gateway configured
4. Customer selects payment method
5. **POST /api/customer/orders** creates order:
   - If online method → creates gateway session (Razorpay/Stripe)
   - Returns checkout data (clientSecret/orderId)
6. Customer completes payment
7. Webhook confirms payment → order status updated
8. Transaction recorded in `payment_transactions` with commission

---

## 📊 Commission Calculation

```javascript
// Example: 5% commission on ₹1000 order
const orderAmount = 1000;
const commissionPercent = 5;
const commission = (orderAmount * commissionPercent) / 100; // ₹50
const netAmount = orderAmount - commission; // ₹950

// Restaurant receives ₹950 in settlement
```

---

## 🛡️ Fraud Detection (Future)

- Multiple failed payment attempts
- Unusual transaction patterns
- Velocity checks
- IP geolocation
- Device fingerprinting

---

## 📧 Notifications (Future)

### Email Notifications
- Payment success
- Payment failed
- Refund processed
- Settlement completed
- Payout approved/rejected

### SMS Notifications
- OTP for bank account changes
- Payment confirmations
- Payout alerts

### Push Notifications
- Real-time transaction alerts
- Refund status updates

---

## 🧪 Testing

### Test Gateway Connection
1. Go to Payment Settings → Gateway Settings
2. Enable a gateway (e.g., Razorpay)
3. Enter test credentials:
   - Razorpay Test Key: `rzp_test_...`
   - Razorpay Test Secret: `...`
4. Click "Test Connection"
5. Should return success if credentials are valid

### Test Payment Flow
1. Enable payment methods in Payment Settings
2. Configure gateway with test credentials
3. Go to customer checkout
4. Select online payment method
5. Complete test payment
6. Verify transaction appears in Transactions tab

---

## 🚧 Future Enhancements

- [ ] Category-wise commission
- [ ] Split payments (multiple gateways)
- [ ] Recurring payments / subscriptions
- [ ] Payment links
- [ ] QR code generation
- [ ] Invoice PDF generation
- [ ] Export transactions (CSV/Excel)
- [ ] Advanced fraud detection
- [ ] Payment analytics dashboard
- [ ] Multi-currency support
- [ ] Cryptocurrency payments
- [ ] Buy Now Pay Later (BNPL) integration

---

## 📝 Environment Variables

```env
# Payment encryption key (fallback to JWT_SECRET)
PAYMENT_ENCRYPT_KEY=your-32-char-encryption-key

# JWT secret (used as fallback for encryption)
JWT_SECRET=your-jwt-secret

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/rms

# Public restaurant ID (optional, for single-restaurant mode)
NEXT_PUBLIC_RESTAURANT_ID=
```

---

## 🎓 Best Practices

### For Restaurant Owners
1. **Always test gateway connection** before going live
2. **Keep gateway credentials secure** — never share
3. **Verify bank account details** before requesting payout
4. **Monitor transactions regularly** for suspicious activity
5. **Process refunds promptly** to maintain customer trust

### For Developers
1. **Never log sensitive data** (keys, account numbers)
2. **Always encrypt secrets** before storing in DB
3. **Validate webhook signatures** to prevent fraud
4. **Use HTTPS** for all payment-related requests
5. **Implement rate limiting** on payment APIs
6. **Test with sandbox credentials** before production

---

## 📞 Support

For issues or questions:
- Check transaction logs in Payment Settings → Transactions
- Review refund status in Payment Settings → Refunds
- Contact Super Admin for payout approval
- Test gateway connection if payments failing

---

## ✅ Checklist for Going Live

- [ ] Configure payment gateway with live credentials
- [ ] Test gateway connection
- [ ] Add bank account details
- [ ] Verify bank account
- [ ] Set GST and tax details
- [ ] Enable required payment methods
- [ ] Set settlement frequency
- [ ] Test complete payment flow
- [ ] Monitor first few transactions
- [ ] Setup email notifications

---

## 🎉 Summary

This is a **production-ready, enterprise-grade payment management system** for multi-restaurant SaaS platforms. It provides:

✅ **Complete independence** for each restaurant
✅ **Multiple payment gateways** with encrypted credentials
✅ **Comprehensive transaction management**
✅ **Commission and settlement automation**
✅ **Refund and payout workflows**
✅ **Super admin oversight and controls**
✅ **Security-first architecture**
✅ **Modern, responsive UI**

Built with **Next.js 16**, **MongoDB**, **AES-256-GCM encryption**, and follows **SaaS best practices** similar to Swiggy, Zomato, and Shopify.
