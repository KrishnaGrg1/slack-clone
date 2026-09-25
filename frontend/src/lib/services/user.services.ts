import { createServerFn } from '@tanstack/react-start'
import axiosInstance from '../axios'
import type { GetMeResponse } from '../types/user.type'
import { getAuthHeader } from './helper'

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const headers = await getAuthHeader()

    const res = await axiosInstance<GetMeResponse>('/user/me', {
      method: 'GET',
      headers,
    })
    return res.data.data
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to fetch user',
    )
  }
})
