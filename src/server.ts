import express from "express";
import { dbConnection } from "./config/db.js";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "../src/routes/auth.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import categoryRoutes from "../src/routes/category.routes.js";
import transactionRoutes from "../src/routes/transaction.routes.js";

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

app.use(errorHandler);

app.listen(PORT, () => {
  dbConnection();
  console.log(`Server is running on PORT ${PORT}`);
});
