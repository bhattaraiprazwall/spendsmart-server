# SpendSmart — Complete Backend Architecture

## Table of Contents
1. [Prisma Schema (Full)](#prisma-schema)
2. [API Modules & Endpoints](#api-modules--endpoints)
3. [Response Shapes](#response-shapes)
4. [Algorithm Endpoints](#algorithm-endpoints)

---

## Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

enum TransactionType {
  EXPENSE
  INCOME
}

enum PaymentMethod {
  CASH
  CARD
  BANK_TRANSFER
  UPI
  OTHER
}

enum RecurringFrequency {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

enum NotificationType {
  BUDGET_EXCEEDED
  BUDGET_WARNING    // e.g. 80% of budget used
  BILL_REMINDER
  WEEKLY_SUMMARY
  SAVINGS_REMINDER
  FORECAST_ALERT
}

// ─────────────────────────────────────────
// USER
// ─────────────────────────────────────────

model User {
  id                   String    @id @default(uuid())
  firebaseUid          String    @unique
  email                String    @unique
  name                 String?
  avatarUrl            String?

  // Settings / Preferences
  currency             String    @default("USD")
  language             String    @default("en")
  theme                String    @default("light")   // "light" | "dark"
  fcmToken             String?                       // Firebase Cloud Messaging device token
  notificationsEnabled Boolean   @default(true)
  budgetAlertThreshold Int       @default(80)        // alert at 80% of budget used

  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // Relations
  transactions         Transaction[]
  budgets              Budget[]
  categories           Category[]           // user's custom categories
  notifications        Notification[]
  recurringTransactions RecurringTransaction[]
  savingsGoals         SavingsGoal[]
}

// ─────────────────────────────────────────
// CATEGORY
// ─────────────────────────────────────────

// Default categories are seeded into the DB (userId = null).
// Users can also create custom categories.

model Category {
  id        String   @id @default(uuid())
  name      String
  icon      String   // e.g. "food", "transport", "shopping" (maps to icon in Flutter)
  color     String   // hex e.g. "#4CAF50"
  isDefault Boolean  @default(false)

  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  // Relations
  transactions     Transaction[]
  budgetCategories BudgetCategory[]
  keywords         CategoryKeyword[]  // for category prediction algorithm
}

// Used by the category-prediction algorithm
model CategoryKeyword {
  id         String   @id @default(uuid())
  keyword    String   // e.g. "uber", "pizza", "netflix"
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([keyword, categoryId])
}

// ─────────────────────────────────────────
// TRANSACTION
// ─────────────────────────────────────────

model Transaction {
  id            String          @id @default(uuid())
  userId        String
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  type          TransactionType
  amount        Decimal         @db.Decimal(12, 2)
  title         String
  note          String?
  paymentMethod PaymentMethod   @default(CASH)
  date          DateTime        // user-chosen date (not necessarily createdAt)

  categoryId    String
  category      Category        @relation(fields: [categoryId], references: [id])

  // If this transaction was generated from a recurring template
  recurringId   String?
  recurring     RecurringTransaction? @relation(fields: [recurringId], references: [id])

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

// ─────────────────────────────────────────
// RECURRING TRANSACTION
// ─────────────────────────────────────────

model RecurringTransaction {
  id          String             @id @default(uuid())
  userId      String
  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  title       String
  amount      Decimal            @db.Decimal(12, 2)
  type        TransactionType
  frequency   RecurringFrequency
  nextDueDate DateTime
  isActive    Boolean            @default(true)

  categoryId  String
  // Note: no direct relation to Category here to keep it simple,
  // store categoryId as string and resolve manually

  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  transactions Transaction[]
}

// ─────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────

// One budget per user per month/year.
// Contains category-level sub-limits via BudgetCategory.

model Budget {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  month       Int      // 1–12
  year        Int
  totalAmount Decimal  @db.Decimal(12, 2)  // overall monthly limit

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  budgetCategories BudgetCategory[]

  @@unique([userId, month, year])  // one budget per month
}

model BudgetCategory {
  id         String   @id @default(uuid())
  budgetId   String
  budget     Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])

  limit      Decimal  @db.Decimal(12, 2)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([budgetId, categoryId])
}

// ─────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────

model Notification {
  id        String           @id @default(uuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  metadata  Json?            // extra data e.g. { categoryId, budgetId, amount }

  createdAt DateTime         @default(now())
}

// ─────────────────────────────────────────
// SAVINGS GOAL
// ─────────────────────────────────────────

model SavingsGoal {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  name         String
  targetAmount Decimal   @db.Decimal(12, 2)
  savedAmount  Decimal   @db.Decimal(12, 2) @default(0)
  deadline     DateTime?
  isCompleted  Boolean   @default(false)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

---

## API Modules & Endpoints

All endpoints are prefixed with `/api/v1`. Every route is protected by Firebase Auth middleware
(verifies the `Authorization: Bearer <idToken>` header and attaches `req.user`).

### Base URL structure

```
/api/v1
  /auth
  /users
  /categories
  /transactions
  /budgets
  /recurring
  /notifications
  /savings
  /dashboard
  /insights
```

---

### 1. Auth Module — `/api/v1/auth`

| Method | Endpoint        | Description                                      |
|--------|-----------------|--------------------------------------------------|
| POST   | `/register`     | Create user in DB after Firebase signup          |
| POST   | `/login`        | Verify Firebase token, return user profile       |
| POST   | `/logout`       | Invalidate FCM token (server-side cleanup)       |
| PUT    | `/fcm-token`    | Update device FCM token for push notifications  |

> You already have register/login. Add `/fcm-token` when you wire up notifications.

---

### 2. User / Profile Module — `/api/v1/users`

| Method | Endpoint           | Description                          |
|--------|--------------------|--------------------------------------|
| GET    | `/me`              | Get current user profile             |
| PUT    | `/me`              | Update name, avatar, currency, theme |
| PUT    | `/me/settings`     | Update notification prefs, threshold |
| DELETE | `/me`              | Delete account + all data            |

---

### 3. Categories Module — `/api/v1/categories`

| Method | Endpoint     | Description                                        |
|--------|--------------|----------------------------------------------------|
| GET    | `/`          | Get all categories (default + user's custom ones)  |
| POST   | `/`          | Create a custom category                           |
| PUT    | `/:id`       | Update a custom category                           |
| DELETE | `/:id`       | Delete a custom category                           |
| GET    | `/predict`   | Predict category from a title string (algorithm 1) |

**Query params for GET `/`:**
- `?type=expense` or `?type=income` — filter by transaction type if you split categories

**Query params for GET `/predict`:**
- `?title=Uber ride` — returns best-matching category

---

### 4. Transactions Module — `/api/v1/transactions`

| Method | Endpoint            | Description                                        |
|--------|---------------------|----------------------------------------------------|
| GET    | `/`                 | Get paginated list of transactions                 |
| POST   | `/`                 | Create a transaction (expense or income)           |
| GET    | `/:id`              | Get a single transaction detail                    |
| PUT    | `/:id`              | Edit a transaction                                 |
| DELETE | `/:id`              | Delete a transaction                               |
| GET    | `/summary/monthly`  | Get income/expense totals for a month              |
| GET    | `/summary/category` | Get spending grouped by category for a period      |

**Query params for GET `/`:**
```
?type=EXPENSE | INCOME
?categoryId=<id>
?paymentMethod=CASH | CARD | ...
?startDate=2025-06-01
?endDate=2025-06-30
?page=1
?limit=20
?sortBy=date | amount
?order=desc | asc
```

**Query params for `/summary/monthly`:**
```
?month=6&year=2025
```

**Query params for `/summary/category`:**
```
?startDate=2025-06-01&endDate=2025-06-30
?type=EXPENSE
```

---

### 5. Budget Module — `/api/v1/budgets`

| Method | Endpoint                    | Description                                   |
|--------|-----------------------------|-----------------------------------------------|
| GET    | `/`                         | Get budget for a given month/year             |
| POST   | `/`                         | Create or update budget for a month           |
| PUT    | `/:id`                      | Update overall budget limit                   |
| DELETE | `/:id`                      | Delete a budget                               |
| POST   | `/:id/categories`           | Set category limit inside a budget            |
| PUT    | `/:id/categories/:catId`    | Update a category limit                       |
| DELETE | `/:id/categories/:catId`    | Remove a category limit                       |
| GET    | `/:id/status`               | Get budget status (spent vs limit per cat.)   |

**Query params for GET `/`:**
```
?month=6&year=2025
```

---

### 6. Recurring Transactions Module — `/api/v1/recurring`

| Method | Endpoint        | Description                                        |
|--------|-----------------|----------------------------------------------------|
| GET    | `/`             | List all recurring transactions for user           |
| POST   | `/`             | Create a recurring transaction template            |
| PUT    | `/:id`          | Edit a recurring transaction                       |
| DELETE | `/:id`          | Delete / deactivate a recurring transaction        |
| POST   | `/:id/generate` | Manually trigger generating a transaction from it  |

---

### 7. Notifications Module — `/api/v1/notifications`

| Method | Endpoint        | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | `/`             | Get all notifications (paginated)        |
| PATCH  | `/:id/read`     | Mark a notification as read              |
| PATCH  | `/read-all`     | Mark all notifications as read           |
| DELETE | `/:id`          | Delete a notification                    |
| DELETE | `/`             | Clear all notifications                  |

**Query params for GET `/`:**
```
?isRead=false
?type=BUDGET_EXCEEDED
?page=1&limit=20
```

---

### 8. Savings Goals Module — `/api/v1/savings`

| Method | Endpoint          | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | `/`               | List all savings goals               |
| POST   | `/`               | Create a savings goal                |
| GET    | `/:id`            | Get a savings goal detail            |
| PUT    | `/:id`            | Update goal name, target, deadline   |
| PATCH  | `/:id/add-funds`  | Add money to saved amount            |
| DELETE | `/:id`            | Delete a goal                        |

---

### 9. Dashboard Module — `/api/v1/dashboard`

| Method | Endpoint    | Description                                                              |
|--------|-------------|--------------------------------------------------------------------------|
| GET    | `/summary`  | One call that returns everything the Home screen needs                   |

**Query params:**
```
?month=6&year=2025
```

This is the most important endpoint for your Flutter home screen. It aggregates:
- Total balance, income, expenses for the month
- Budget remaining
- Top categories with spending
- Recent transactions (last 5)
- Smart alert (overspending detection result)
- Forecast card (will user overspend this month?)

---

### 10. Insights Module — `/api/v1/insights`

| Method | Endpoint              | Description                                           |
|--------|-----------------------|-------------------------------------------------------|
| GET    | `/monthly-trend`      | Month-by-month spending for the last 6 months         |
| GET    | `/weekly-breakdown`   | Day-by-day or week-by-week spending for current month |
| GET    | `/category-ranking`   | Top categories by spending for a period               |
| GET    | `/forecast`           | Budget forecast for remaining days in month           |
| GET    | `/recommendations`    | Algorithm-generated saving tips                       |

**Query params for `/monthly-trend`:**
```
?months=6   (how many past months to return)
```

**Query params for `/weekly-breakdown`:**
```
?month=6&year=2025
```

**Query params for `/forecast`:**
```
?month=6&year=2025
```

---

## Response Shapes

All responses follow this envelope:

```typescript
// Success
{
  success: true,
  data: <payload>,
  message?: string
}

// Error
{
  success: false,
  error: {
    code: string,      // e.g. "NOT_FOUND", "UNAUTHORIZED", "BUDGET_EXISTS"
    message: string    // human-readable
  }
}

// Paginated list
{
  success: true,
  data: {
    items: [...],
    total: number,
    page: number,
    limit: number,
    hasMore: boolean
  }
}
```

---

### Auth Responses

**POST `/auth/register` and `/auth/login`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firebaseUid": "firebase-uid",
      "email": "prajwal@example.com",
      "name": "Prajwal",
      "avatarUrl": null,
      "currency": "USD",
      "language": "en",
      "theme": "light",
      "notificationsEnabled": true,
      "budgetAlertThreshold": 80,
      "createdAt": "2025-06-01T00:00:00.000Z"
    }
  }
}
```

---

### Category Responses

**GET `/categories`:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Food & Dining",
        "icon": "restaurant",
        "color": "#FF6B6B",
        "isDefault": true,
        "userId": null
      },
      {
        "id": "uuid",
        "name": "Transport",
        "icon": "directions_car",
        "color": "#4ECDC4",
        "isDefault": true,
        "userId": null
      },
      {
        "id": "uuid",
        "name": "My Gym",
        "icon": "fitness_center",
        "color": "#A29BFE",
        "isDefault": false,
        "userId": "user-uuid"
      }
    ]
  }
}
```

**GET `/categories/predict?title=Uber ride`:**
```json
{
  "success": true,
  "data": {
    "predictedCategory": {
      "id": "uuid",
      "name": "Transport",
      "icon": "directions_car",
      "color": "#4ECDC4"
    },
    "confidence": 0.92
  }
}
```

---

### Transaction Responses

**POST `/transactions` (request body):**
```json
{
  "type": "EXPENSE",
  "amount": 450.00,
  "title": "Uber ride to college",
  "categoryId": "uuid",
  "paymentMethod": "CASH",
  "date": "2025-06-15T10:30:00.000Z",
  "note": "Shared with Aarav"
}
```

**POST `/transactions` (response):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "type": "EXPENSE",
      "amount": "450.00",
      "title": "Uber ride to college",
      "note": "Shared with Aarav",
      "paymentMethod": "CASH",
      "date": "2025-06-15T10:30:00.000Z",
      "category": {
        "id": "uuid",
        "name": "Transport",
        "icon": "directions_car",
        "color": "#4ECDC4"
      },
      "createdAt": "2025-06-15T10:32:00.000Z"
    },
    // included when this transaction triggers an overspend:
    "alert": {
      "type": "BUDGET_WARNING",
      "message": "You have used 85% of your Transport budget"
    }
  },
  "message": "Transaction added successfully"
}
```

**GET `/transactions` (paginated list):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "EXPENSE",
        "amount": "450.00",
        "title": "Uber ride to college",
        "paymentMethod": "CASH",
        "date": "2025-06-15T10:30:00.000Z",
        "category": {
          "id": "uuid",
          "name": "Transport",
          "icon": "directions_car",
          "color": "#4ECDC4"
        }
      }
    ],
    "total": 47,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

**GET `/transactions/summary/monthly?month=6&year=2025`:**
```json
{
  "success": true,
  "data": {
    "month": 6,
    "year": 2025,
    "totalIncome": "25000.00",
    "totalExpenses": "18400.00",
    "balance": "6600.00",
    "transactionCount": 47
  }
}
```

**GET `/transactions/summary/category?startDate=...&endDate=...&type=EXPENSE`:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": {
          "id": "uuid",
          "name": "Food & Dining",
          "icon": "restaurant",
          "color": "#FF6B6B"
        },
        "total": "6200.00",
        "percentage": 33.7,
        "transactionCount": 18
      },
      {
        "category": {
          "id": "uuid",
          "name": "Transport",
          "icon": "directions_car",
          "color": "#4ECDC4"
        },
        "total": "3800.00",
        "percentage": 20.6,
        "transactionCount": 12
      }
    ]
  }
}
```

---

### Budget Responses

**POST `/budgets` (request body):**
```json
{
  "month": 6,
  "year": 2025,
  "totalAmount": 20000.00,
  "categories": [
    { "categoryId": "uuid", "limit": 6000.00 },
    { "categoryId": "uuid", "limit": 4000.00 }
  ]
}
```

**GET `/budgets/:id/status`:**
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "uuid",
      "month": 6,
      "year": 2025,
      "totalAmount": "20000.00",
      "totalSpent": "18400.00",
      "remaining": "1600.00",
      "usagePercentage": 92,
      "isOverspent": false
    },
    "categories": [
      {
        "category": {
          "id": "uuid",
          "name": "Food & Dining",
          "icon": "restaurant",
          "color": "#FF6B6B"
        },
        "limit": "6000.00",
        "spent": "6200.00",
        "remaining": "-200.00",
        "usagePercentage": 103,
        "isOverspent": true,
        "status": "EXCEEDED"   // "OK" | "WARNING" | "EXCEEDED"
      },
      {
        "category": {
          "id": "uuid",
          "name": "Transport",
          "icon": "directions_car",
          "color": "#4ECDC4"
        },
        "limit": "4000.00",
        "spent": "3800.00",
        "remaining": "200.00",
        "usagePercentage": 95,
        "isOverspent": false,
        "status": "WARNING"
      }
    ]
  }
}
```

---

### Dashboard Response

**GET `/dashboard/summary?month=6&year=2025`:**

This is the biggest response — it drives the entire home screen in one call.

```json
{
  "success": true,
  "data": {
    "period": {
      "month": 6,
      "year": 2025,
      "label": "June 2025"
    },

    "overview": {
      "totalBalance": "6600.00",
      "totalIncome": "25000.00",
      "totalExpenses": "18400.00",
      "currency": "USD"
    },

    "budget": {
      "exists": true,
      "totalAmount": "20000.00",
      "totalSpent": "18400.00",
      "remaining": "1600.00",
      "usagePercentage": 92,
      "status": "WARNING"    // "OK" | "WARNING" | "EXCEEDED"
    },

    "categoryBreakdown": [
      {
        "category": {
          "id": "uuid",
          "name": "Food & Dining",
          "icon": "restaurant",
          "color": "#FF6B6B"
        },
        "amount": "6200.00",
        "percentage": 33.7
      }
    ],

    "recentTransactions": [
      {
        "id": "uuid",
        "type": "EXPENSE",
        "amount": "450.00",
        "title": "Uber ride",
        "date": "2025-06-15T10:30:00.000Z",
        "category": {
          "name": "Transport",
          "icon": "directions_car",
          "color": "#4ECDC4"
        }
      }
    ],

    "smartAlert": {
      "hasAlert": true,
      "type": "BUDGET_WARNING",
      "title": "Almost at your limit",
      "message": "You've used 92% of your June budget. Only $1,600 remaining."
    },

    "forecast": {
      "projectedExpenses": "21200.00",
      "willOverspend": true,
      "projectedOverspendBy": "1200.00",
      "daysRemaining": 15,
      "dailyBudgetRemaining": "106.67",
      "message": "At this rate, you'll exceed your budget by ~$1,200 by June 30"
    },

    "upcomingBills": [
      {
        "id": "uuid",
        "title": "Netflix Subscription",
        "amount": "649.00",
        "dueDate": "2025-06-20T00:00:00.000Z",
        "daysUntilDue": 5
      }
    ]
  }
}
```

---

### Insights Responses

**GET `/insights/monthly-trend?months=6`:**
```json
{
  "success": true,
  "data": {
    "trend": [
      { "month": 1, "year": 2025, "label": "Jan", "income": "25000.00", "expenses": "19200.00" },
      { "month": 2, "year": 2025, "label": "Feb", "income": "25000.00", "expenses": "17800.00" },
      { "month": 3, "year": 2025, "label": "Mar", "income": "25000.00", "expenses": "20100.00" },
      { "month": 4, "year": 2025, "label": "Apr", "income": "25000.00", "expenses": "15600.00" },
      { "month": 5, "year": 2025, "label": "May", "income": "25000.00", "expenses": "16900.00" },
      { "month": 6, "year": 2025, "label": "Jun", "income": "25000.00", "expenses": "18400.00" }
    ]
  }
}
```

**GET `/insights/weekly-breakdown?month=6&year=2025`:**
```json
{
  "success": true,
  "data": {
    "weeks": [
      {
        "label": "Week 1",
        "startDate": "2025-06-01",
        "endDate": "2025-06-07",
        "totalExpenses": "4200.00",
        "totalIncome": "0.00"
      },
      {
        "label": "Week 2",
        "startDate": "2025-06-08",
        "endDate": "2025-06-14",
        "totalExpenses": "5100.00",
        "totalIncome": "25000.00"
      }
    ]
  }
}
```

**GET `/insights/forecast?month=6&year=2025`:**
```json
{
  "success": true,
  "data": {
    "currentSpending": "18400.00",
    "budget": "20000.00",
    "daysElapsed": 15,
    "daysInMonth": 30,
    "daysRemaining": 15,
    "dailyAverageSpending": "1226.67",
    "projectedMonthlySpending": "21200.00",
    "willExceedBudget": true,
    "projectedSurplusOrDeficit": "-1200.00",
    "confidenceScore": 0.78,
    "categoryForecasts": [
      {
        "category": {
          "id": "uuid",
          "name": "Food & Dining",
          "icon": "restaurant",
          "color": "#FF6B6B"
        },
        "limit": "6000.00",
        "currentSpending": "6200.00",
        "projectedSpending": "6800.00",
        "willExceed": true
      }
    ]
  }
}
```

**GET `/insights/recommendations`:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "REDUCE_SPENDING",
        "category": {
          "name": "Food & Dining",
          "icon": "restaurant",
          "color": "#FF6B6B"
        },
        "message": "Reduce food expenses by 12% this week to stay within your monthly budget.",
        "actionableAmount": "744.00",
        "priority": "HIGH"
      },
      {
        "type": "CATEGORY_INSIGHT",
        "category": {
          "name": "Transport",
          "icon": "directions_car",
          "color": "#4ECDC4"
        },
        "message": "Your transport spending is 18% higher than last month.",
        "priority": "MEDIUM"
      },
      {
        "type": "SAVINGS_TIP",
        "message": "You saved $3,100 less than last month. Try setting a savings goal.",
        "priority": "LOW"
      }
    ]
  }
}
```

---

### Notification Responses

**GET `/notifications`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "BUDGET_EXCEEDED",
        "title": "Budget Exceeded!",
        "message": "You've exceeded your Food & Dining budget by $200 this month.",
        "isRead": false,
        "metadata": {
          "categoryId": "uuid",
          "categoryName": "Food & Dining",
          "overspentBy": "200.00"
        },
        "createdAt": "2025-06-15T11:00:00.000Z"
      },
      {
        "id": "uuid",
        "type": "BILL_REMINDER",
        "title": "Bill Due Soon",
        "message": "Netflix Subscription ($649) is due in 5 days.",
        "isRead": true,
        "metadata": {
          "recurringId": "uuid",
          "amount": "649.00",
          "dueDate": "2025-06-20"
        },
        "createdAt": "2025-06-15T09:00:00.000Z"
      }
    ],
    "total": 8,
    "unreadCount": 3,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

---

### Savings Goal Responses

**GET `/savings`:**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "uuid",
        "name": "New Laptop",
        "targetAmount": "80000.00",
        "savedAmount": "32000.00",
        "progressPercentage": 40,
        "deadline": "2025-12-01T00:00:00.000Z",
        "daysRemaining": 168,
        "isCompleted": false,
        "requiredMonthlySaving": "2857.14"
      }
    ]
  }
}
```

---

## Algorithm Endpoints — How to Implement

### Algorithm 1 — Category Prediction (`GET /categories/predict?title=...`)

```typescript
// In your service layer
async predictCategory(title: string, userId: string) {
  const titleLower = title.toLowerCase();

  // 1. Get all categories + their keywords
  const categories = await prisma.category.findMany({
    where: { OR: [{ isDefault: true }, { userId }] },
    include: { keywords: true }
  });

  // 2. Score each category by keyword matches
  let bestMatch = null;
  let bestScore = 0;

  for (const cat of categories) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (titleLower.includes(kw.keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  return {
    predictedCategory: bestMatch,
    confidence: bestScore > 0 ? Math.min(bestScore * 0.3, 1.0) : 0
  };
}
```

**Seed keywords** for this to work (add to a seed file):
```typescript
const keywords = {
  "Food & Dining":   ["uber eats", "pizza", "restaurant", "cafe", "coffee", "lunch", "dinner", "breakfast", "kfc", "mcdonalds", "zomato", "swiggy"],
  "Transport":       ["uber", "ola", "petrol", "fuel", "bus", "taxi", "metro", "parking", "train"],
  "Shopping":        ["amazon", "flipkart", "mall", "clothes", "shoes", "market"],
  "Entertainment":   ["netflix", "spotify", "movie", "cinema", "game"],
  "Utilities":       ["electricity", "internet", "phone", "bill", "water"],
  "Health":          ["pharmacy", "doctor", "hospital", "medicine", "gym"],
  "Education":       ["college", "books", "course", "tuition", "stationery"],
};
```

---

### Algorithm 2 — Overspending Detection (runs on transaction create)

```typescript
// In your transaction service, call this AFTER creating a transaction
async checkOverspending(userId: string, categoryId: string, month: number, year: number) {
  const budget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId, month, year } },
    include: { budgetCategories: true }
  });

  if (!budget) return null;

  const categoryBudget = budget.budgetCategories.find(
    bc => bc.categoryId === categoryId
  );

  if (!categoryBudget) return null;

  // Sum all expenses in this category for the month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth   = new Date(year, month, 0, 23, 59, 59);

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: { gte: startOfMonth, lte: endOfMonth }
    },
    _sum: { amount: true }
  });

  const spent = Number(result._sum.amount ?? 0);
  const limit = Number(categoryBudget.limit);
  const usagePercent = (spent / limit) * 100;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const threshold = user?.budgetAlertThreshold ?? 80;

  if (usagePercent >= 100) {
    return { type: "BUDGET_EXCEEDED", spent, limit, usagePercent };
  } else if (usagePercent >= threshold) {
    return { type: "BUDGET_WARNING", spent, limit, usagePercent };
  }

  return null;
}
```

---

### Algorithm 3 — Monthly Budget Forecasting (`GET /insights/forecast`)

```typescript
async getForecast(userId: string, month: number, year: number) {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysElapsed = now.getDate();            // current day of month
  const daysRemaining = daysInMonth - daysElapsed;

  const startOfMonth = new Date(year, month - 1, 1);
  const today        = new Date();

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: startOfMonth, lte: today }
    },
    _sum: { amount: true }
  });

  const currentSpending = Number(result._sum.amount ?? 0);

  // Simple linear projection (moving average approach)
  const dailyAverage = daysElapsed > 0 ? currentSpending / daysElapsed : 0;
  const projectedSpending = currentSpending + (dailyAverage * daysRemaining);

  const budget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId, month, year } }
  });

  const budgetAmount = budget ? Number(budget.totalAmount) : null;
  const willExceed   = budgetAmount ? projectedSpending > budgetAmount : null;
  const surplus      = budgetAmount ? budgetAmount - projectedSpending : null;

  return {
    currentSpending,
    daysElapsed,
    daysInMonth,
    daysRemaining,
    dailyAverageSpending: dailyAverage,
    projectedMonthlySpending: projectedSpending,
    budget: budgetAmount,
    willExceedBudget: willExceed,
    projectedSurplusOrDeficit: surplus
  };
}
```

---

## Development Order (Recommended)

Build in this sequence — each phase is independently testable in Flutter:

```
Phase 1 (Core data)
  └── Categories (seed defaults) → Transactions CRUD → Transaction summaries

Phase 2 (Budget)
  └── Budget create/update → Budget status endpoint → Dashboard summary

Phase 3 (Intelligence)
  └── Category prediction → Overspend detection (on transaction create) → Forecast

Phase 4 (Insights UI)
  └── Monthly trend → Weekly breakdown → Recommendations

Phase 5 (Notifications)
  └── FCM token storage → In-app notifications → Push notification triggers

Phase 6 (Polish)
  └── Recurring transactions → Savings goals → Profile settings
```
