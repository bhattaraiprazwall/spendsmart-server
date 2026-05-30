import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import { dbConnection } from "./config/db";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  dbConnection()
  console.log(`Server running on ${PORT}`);
});
