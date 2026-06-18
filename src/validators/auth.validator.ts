import z, { email } from "zod";
export const registerUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(100, { message: "Name can't be long than 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email" })
    .max(100, { message: "Email must not be more than 100 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(20, { message: "Password can be of max 20 characters" }),
});

export const loginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email({
      message: "Please enter a valid email",
    }),

  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters long",
    }),
});
