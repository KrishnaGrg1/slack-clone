import { createServerFn } from '@tanstack/react-start'
import { LoginUserSchema, RegisterUserSchema } from '../schema/auth.schema'
import type {
  LoginResponse,
  UserLoginInput,
  UserRegisterInput,
} from '../types/auth.type'
import axiosInstance from '../axios'

export const register = createServerFn({ method: 'POST' })
  .inputValidator((data) => RegisterUserSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<UserRegisterInput, LoginResponse>(
        '/auth/register',
        {
          data: data,
          method: 'POST',
        },
      )
      return res.data
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to register')
    }
  })

export const login = createServerFn({ method: 'POST' })
  .inputValidator((data) => LoginUserSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<UserLoginInput, LoginResponse>(
        '/auth/login',
        {
          data: data,
          method: 'POST',
        },
      )
      return res.data
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to login')
    }
  })
