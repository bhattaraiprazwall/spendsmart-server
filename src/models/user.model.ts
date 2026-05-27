import mongoose from "mongoose";

export interface IUser extends Document {
  firebaseUID: string;
  name?: string;
  email: string;
  role: "user";
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },

    email: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
