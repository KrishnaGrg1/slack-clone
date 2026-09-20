import { z } from 'zod'

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3),
})

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
