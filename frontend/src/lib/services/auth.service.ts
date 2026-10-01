import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { LoginUserSchema, RegisterUserSchema } from '../schema/auth.schema'
import type { LoginResponse } from '../types/auth.type'
import axiosInstance, { getApiErrorMessage } from '../axios'
import { useAppSession } from '#/utils/session.server'

async function persistAuthSession(payload: LoginResponse) {
  const { token, user } = payload.data

  const session = await useAppSession()
  await session.update({
    token,
    userId: user.id,
    email: user.email,
  })
}

export const register = createServerFn({ method: 'POST' })
  .validator((data) => RegisterUserSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<LoginResponse>('/auth/register', {
        data: data,
        method: 'POST',
      })

      await persistAuthSession(res.data)
      return res.data
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to register') || 'Failed to register',
      )
    }
  })

export const login = createServerFn({ method: 'POST' })
  .validator((data) => LoginUserSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<LoginResponse>('/auth/login', {
        data: data,
        method: 'POST',
      })
      await persistAuthSession(res.data)
      return res.data
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to login') || 'Failed to login',
      )
    }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  await session.clear()
  throw redirect({ to: '/' })
})
