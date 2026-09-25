import type { User } from './auth.type'

export interface GetMeResponse {
  success: boolean
  message: string
  data: User
}
