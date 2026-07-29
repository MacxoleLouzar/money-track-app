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

---

## Features

- 🔐 Sign Up / Sign In per user (JWT auth)
- 📦 9 expense categories with full field tracking
- 📎 File uploads: images, slips, invoices (jpeg, png, pdf, docx)
- 📊 Analytics: Daily, Weekly, Monthly, Yearly summaries
- 🗂️ REST API tested via `API.rest`

---

## Categories

| Category | Fields |
|----------|--------|
| Groceries | Item, Quantity, Price, Store, On Sale, Image, Slip |
| Transport | From, Destination, Mode (Uber/Taxi/Train/Flight), Price, Slip |
| Lunch | Food Type, Store, Price |
| Garments | Item, Store, Price, Quantity, Slip |
| Furniture | Item, Store, Price, Quantity, Image, Slip |
| Rent | Date, Price, Invoice |
| Cosmetics | Item, Price, Quantity, Store, Image |
| Takeouts | Item, Store, Price |
| Dates | Restaurant, Food Description, Price, Image, Slip |

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
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.eqcrw1r.mongodb.net/moneytrack?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

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
| DELETE | `/api/expenses/:category/:id` | Delete an expense |

**Categories:** `grocery`, `transport`, `lunch`, `garment`, `furniture`, `rent`, `cosmetic`, `takeout`, `date`

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/summary/daily` | Today's total per category |
| GET | `/api/expenses/summary/weekly` | Last 7 days |
| GET | `/api/expenses/summary/monthly` | Current month |
| GET | `/api/expenses/summary/yearly` | Current year |

---

## File Uploads

Send as `multipart/form-data` with fields:
- `image` — product/receipt image
- `slip` — purchase slip (pdf/docx/image)
- `invoice` — invoice document (rent)

Uploaded files are stored in `Backend/uploads/`.

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
    └── (React Vite app)
```

---

## Security Notes

- Never commit your `.env` file
- `.gitignore` excludes `node_modules/`, `.env`, and `uploads/`
- Passwords are hashed with bcryptjs (salt rounds: 10)
- JWT tokens expire in 7 days
