import { User } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}
