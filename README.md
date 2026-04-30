# Restaurant Management System (RMS)

## 📌 Description
Restaurant Management System (RMS) is a modern web app for managing restaurant operations in one place.  
It helps reduce manual work by organizing orders, menu, tables, inventory, staff, and customer workflows.  
It is useful for restaurants, cafes, cloud kitchens, and multi-outlet food businesses.

## 🌐 Live Demo
- Demo Link: `https://your-demo-link-here.com`

## ✨ Features
- Dashboard
- POS (Dine-in, Takeaway, Delivery)
- Role-based authentication (Super Admin, Admin, Manager, Waiter, Chef)
- Email verification flow for new accounts
- Menu Management
  - Menu Items
  - Categories
  - Recipes
- Table Management
- Reservations
- Inventory Management
- Staff Management
- Customer Management
- Settings

## 🛠 Tech Stack
- Next.js
- React
- Tailwind CSS
- MongoDB

## ⚙️ Installation
1. Clone the repository
   ```bash
   git clone <your-repo-url>
   ```
2. Go to project folder
   ```bash
   cd my-project
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Run development server
   ```bash
   npm run dev
   ```
5. Open in browser:
   - `http://localhost:3000`

## 🔐 Environment Variables
Create a `.env` file before running:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - secret key for auth token signing
- `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` - optional token lifetimes (default `15m` and `30d`)
- `NEXT_PUBLIC_APP_URL` - app base URL (for email verification links)
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` - SMTP credentials for verification emails
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - optional distributed rate limiting
- `LOG_WEBHOOK_URL` - optional external observability webhook for structured logs

## 📁 Project Structure
- `components/` → reusable UI components
- `pages/` → app pages/routes
- `layouts/` → layout and shell files
- `hooks/` → custom React hooks
- `utils/` → helper and utility functions

> Note: In Next.js App Router projects, some routing files may be inside `app/`.

## 🚀 How to Use
- Open the app in browser
- Use sidebar navigation to move between modules
- Manage menu, orders, tables, inventory, staff, and customers
- Use settings to configure app behavior

## 📱 Responsiveness
- Fully usable on Desktop
- Tablet-friendly layout
- Mobile-friendly interface

## 📚 Module Overview
- **POS** → Take and manage dine-in, takeaway, and delivery orders
- **Menu** → Manage menu items, categories, and recipes
- **Inventory** → Track stock levels and alerts
- **Staff** → Manage employee records and operational roles
- **Reservations** → Handle booking flow and table planning
- **Customers** → Store and manage customer information

## ✅ Quality Gates
- CI workflow runs on push/PR (`.github/workflows/ci.yml`)
- Required checks: `npm run lint` and `npm run build`
- Local tests: `npm run test`

## 🧪 Dev Troubleshooting
- **Hydration mismatch with `bis_skin_checked` attribute**
  - If you see React/Next hydration warnings mentioning `bis_skin_checked`, this is usually caused by a browser extension injecting attributes into the DOM before React hydrates.
  - This is not an RMS application bug.
  - Verify by opening the app in Incognito mode (extensions disabled) or disabling extensions for `localhost`.
  - Keep problematic extensions off while local development/testing to avoid noisy hydration warnings.

## 🤝 Contributing
Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## 📄 License
- License: `Your License Here` (e.g., MIT)

## 👨‍💻 Author
- Your Name
