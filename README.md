# Money Track App

A full-stack personal expense tracker to monitor daily spending across multiple categories.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcryptjs |
| File Uploads | Multer |
| Frontend | React + Vite |
| Scanning | html5-qrcode |

---

## Features

- 🔐 Sign Up / Sign In per user (JWT auth)
- 📦 10 expense categories with full field tracking
- 📎 File uploads: images, slips, invoices (jpeg, png, pdf, docx)
- 📊 Analytics: Daily, Weekly, Monthly, Yearly summaries with custom date picker
- 📱 Mobile-first layout: floating hamburger, bottom nav bar (Home + Menu), scrollable sidebar
- 📄 Pagination (10 records per page) with horizontal + vertical table scroll
- 🔍 Barcode & QR code scanning in all categories — via camera or image upload
- 🗂️ REST API tested via `API.rest`

---

## Categories

| Category | Fields |
|----------|--------|
| Groceries | Item, Barcode, Quantity, Size (KG/Grams/Liters/ML/Units/Pieces/Pack), Size Amount, Price, Store, On Sale, Image, Slip |
| Transport | From, Destination, Mode (Uber/Taxi/Train/Flight), Price, Barcode, Slip |
| Lunch | Food Type, Store, Price, Buying For, Barcode, Image, Slip |
| Garments | Item, Store, Price, Quantity, Barcode, Image, Slip |
| Furniture | Item, Store, Price, Quantity, Barcode, Image, Slip |
| Rent | Date, Price, Barcode, Image, Slip, Invoice |
| Cosmetics | Item, Store, Price, Quantity, Barcode, Image, Slip |
| Takeouts | Item, Store, Price, Buying For, Barcode, Image, Slip |
| Dates | Restaurant, Description, Price, Qty, Barcode, Image, Slip |
| Other | Item, Store, Price, Description, Barcode, Image, Slip |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` folder:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.eqcrw1r.mongodb.net/moneytrack?retryWrites=true&w=majority&tls=true
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

> ⚠️ If your password contains special characters (e.g. `!`), URL-encode them (`!` → `%21`)

Start the server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/signin` | Login, returns JWT token |

### Expenses (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses/:category` | Add expense |
| GET | `/api/expenses/:category` | Get all expenses in category |
| PUT | `/api/expenses/:category/:id` | Update an expense |
| DELETE | `/api/expenses/:category/:id` | Delete an expense |

**Categories:** `grocery`, `transport`, `lunch`, `garment`, `furniture`, `rent`, `cosmetic`, `takeout`, `date`, `other`

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/summary/daily?date=YYYY-MM-DD` | Specific day total per category |
| GET | `/api/expenses/summary/weekly?date=YYYY-MM-DD` | 7 days ending on date |
| GET | `/api/expenses/summary/monthly?date=YYYY-MM-01` | Specific month |
| GET | `/api/expenses/summary/yearly?date=YYYY-01-01` | Specific year |

---

## Barcode / QR Scanning

Every category has a **Scan** button that opens a scanner modal with two modes:

- **Use Camera** — activates the rear camera and auto-detects barcodes/QR codes in real time
- **Scan from Image** — pick a photo from your gallery or files (e.g. a product photo or slip)

On a successful scan the add form opens pre-filled with the scanned value in the barcode field and the first relevant text field of that category.

**Supported formats:** EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, QR Code, Data Matrix and more.

---

## File Uploads

Send as `multipart/form-data` with fields:
- `image` — product/receipt image
- `slip` — purchase slip (pdf/docx/image)
- `invoice` — invoice document (rent)

Uploaded files are stored in `Backend/uploads/`.

---

## Mobile Layout

- No topbar — only a floating hamburger button fixed at top-right
- Bottom navigation bar with **Home** and **Menu** buttons
- Sidebar slides in on Menu click, closes on nav item or Home click
- Sidebar nav scrolls vertically if items overflow the screen
- Category summary cards scroll horizontally on small screens
- Tables scroll both horizontally and vertically with sticky headers

---

## Testing the API

Open `Backend/API.rest` in VS Code with the **REST Client** extension installed.

1. Send **Sign In** request
2. Copy the `token` from the response
3. Paste it into `@token = <your_token>` at the top of the file
4. Send any request

---

## Project Structure

```
Bugdet_App/
├── Backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── expenseController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   └── Expense.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── expenses.js
│   ├── uploads/
│   ├── server.js
│   ├── API.rest
│   └── .env
└── Frontend/
    └── src/
        ├── components/
        │   ├── BarcodeScanner.jsx
        │   ├── ExpensePage.jsx
        │   ├── FileField.jsx
        │   ├── Layout.jsx
        │   └── Modal.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── css/
        │   ├── auth.css
        │   ├── dashboard.css
        │   └── layout.css
        └── pages/
            ├── Dashboard.jsx
            ├── Grocery.jsx
            ├── Transport.jsx
            ├── Lunch.jsx
            ├── Garment.jsx
            ├── Furniture.jsx
            ├── Rent.jsx
            ├── Cosmetic.jsx
            ├── Takeout.jsx
            ├── DatePage.jsx
            ├── Other.jsx
            ├── SignIn.jsx
            └── SignUp.jsx
```

---

## Security Notes

- Never commit your `.env` file
- `.gitignore` excludes `node_modules/`, `.env`, and `uploads/`
- Passwords are hashed with bcryptjs (salt rounds: 10)
- JWT tokens expire in 7 days
