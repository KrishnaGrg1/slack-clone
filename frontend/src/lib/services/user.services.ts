import { createServerFn } from '@tanstack/react-start'
import axiosInstance from '../axios'
import type { GetMeResponse } from '../types/user.type'

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const res = await axiosInstance<GetMeResponse>('/user/me', {
      method: 'GET',
    })
    return res.data
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to fetch user',
    )
  }
})
