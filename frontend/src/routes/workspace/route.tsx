import {
  createFileRoute,
  Outlet,
  redirect,
  getRouteApi,
} from '@tanstack/react-router'
import { getMe } from '#/lib/services/user.services'
import { GetUserWorkspaces } from '#/lib/services/workspace.service'

export const Route = createFileRoute('/workspace')({
  loader: async () => {
    try {
      const user = await getMe()
      const workspaces = await GetUserWorkspaces()

      return {
        user,
        workspaces,
      }
    } catch {
      throw redirect({ to: '/login' })
    }
  },
  component: RouteComponent,
})

export const parentRoute = getRouteApi('/workspace')
function RouteComponent() {
  return <Outlet />
}
