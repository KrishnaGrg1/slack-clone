import { createServerFn } from '@tanstack/react-start'

// The session cookie is httpOnly, so browser code cannot read the JWT itself.
// The WebSocket handshake needs the token, so it is fetched through this
// server function instead of being hardcoded in the client bundle.
export const getWsToken = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { useAppSession } = await import('#/utils/session.server')
    const session = await useAppSession()
    return session.data?.token ?? null
  },
)
