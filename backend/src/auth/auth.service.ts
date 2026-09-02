import { config } from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";

config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (data: RegisterInput) => {
  // Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "SALES",
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return newUser;
};

export const loginUser = async (data: LoginInput) => {
  // Find user by email
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = existingUser[0];

  // Compare password
  const passwordMatch = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  // Create JWT
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};