import { useAppSession } from '#/utils/session.server'

// Helper function to keep authorization headers DRY
export async function getAuthHeader() {
  const session = await useAppSession()
  const token = session.data?.token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}
