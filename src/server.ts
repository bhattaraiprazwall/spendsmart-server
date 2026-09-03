// import express from "express";
// import { dbConnection } from "./config/db.js";
// import cors from "cors";
// import { errorHandler } from "./middleware/error.middleware.js";
// import authRoutes from "../src/routes/auth.routes.js";
// import userRoutes from "../src/routes/user.routes.js";
// import categoryRoutes from "../src/routes/category.routes.js";
// import transactionRoutes from "../src/routes/transaction.routes.js";
// import dashboardRoutes from "../src/routes/dashboard.routes.js";
// import budgetRoutes from "../src/routes/budget.routes.js";
// import insightRoutes from "../src/routes/insights.routes.js";
// import categoryPredictionRoutes from "./routes/category-prediction.routes.js";

// // import predictCategory from '../src/algorithms/categoryPrediction.js';

// const app = express();

// const PORT = process.env.PORT || 3000;

// app.use(cors());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.get("/", (req, res) => {
//   res.send("Server started");
// });

// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/categories", categoryRoutes);
// app.use("/api/v1/transactions", transactionRoutes);
// app.use("/api/v1/dashboard", dashboardRoutes);
// app.use("/api/v1/budgets", budgetRoutes);
// app.use("/api/v1/insights", insightRoutes);
// app.use("/api/v1/analytics", categoryPredictionRoutes);

// app.use(errorHandler);

// app.listen(PORT, () => {
//   dbConnection();
//   console.log(`Server is running on PORT ${PORT}`);
// });

import express from "express";
import cors from "cors";

import { dbConnection } from "./config/db.js";
import { errorHandler } from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import insightRoutes from "./routes/insights.routes.js";
import categoryPredictionRoutes from "./routes/category-prediction.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Server started");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/insights", insightRoutes);
app.use("/api/v1/analytics", categoryPredictionRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  dbConnection();

  console.log(`Server is running on PORT ${PORT}`);
});

