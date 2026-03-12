import mongoose, { Schema, Model, Document } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  { timestamps: true }
);

type UserModel = Model<UserDocument>;

const User =
  (mongoose.models.User as UserModel) ||
  mongoose.model<UserDocument>("User", UserSchema);

export default User;

