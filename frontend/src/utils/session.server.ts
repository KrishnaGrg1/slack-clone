import { useSession } from '@tanstack/react-start/server'

export type SessionData = {
  userId?: string
  email?: string
  token?: string
}

export function useAppSession() {
  return useSession<SessionData>({
    name: 'app-session',
    password:
      process.env.SESSION_SECRET || 'change-me-to-a-long-secret-key-1234567890',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    },
  })
}
