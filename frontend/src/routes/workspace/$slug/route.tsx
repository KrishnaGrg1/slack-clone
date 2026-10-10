import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'

import AppSidebar from '#/components/dashboard/sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { WorkspaceNotFound } from '#/components/workspace/WorkspaceNotFound'
import { useGetChannels } from '#/hooks/use-channel'
import { getWorkspaceBySlug } from '#/lib/services/workspace.service'
import { parentRoute } from '../route'

export const Route = createFileRoute('/workspace/$slug')({
  loader: async ({ params }) => {
    // Throws automatically if backend returns 404, 403, or error string
    const workspace = await getWorkspaceBySlug({
      data: { slug: params.slug },
    })

    return { workspace }
  },

  // Renders when the loader throws OR when any child fails to render.
  // Log the real error so render bugs don't look like "workspace not found".
  errorComponent: ({ error, reset }) => {
    console.error('[workspace route]', error)
    return <WorkspaceNotFound reset={reset} />
  },

  notFoundComponent: () => <WorkspaceNotFound />,

  component: RouteComponent,
})

function RouteComponent() {
  const { workspace } = Route.useLoaderData()
  const { user } = parentRoute.useLoaderData()
  // normalize workspace shape returned from loader (some responses nest under `data.workspace`)
  const workspaceData = workspace?.data?.workspace ?? workspace
  const workspaceMembers = workspace?.data?.members ?? []

  const { data: channels } = useGetChannels(workspaceData.id)

  // The huddle opens in its own window: give it the whole viewport,
  // no sidebar or top bar around it.
  const isHuddle = useRouterState({
    select: (s) => s.location.pathname.endsWith('/huddle'),
  })

  if (isHuddle) {
    return (
      <div className="h-dvh overflow-hidden bg-background font-mono text-foreground">
        <Outlet />
      </div>
    )
  }

  return (
    <SidebarProvider className="h-dvh overflow-hidden bg-background font-mono text-foreground">
      <AppSidebar
        user={user}
        workspaceDetails={{
          workspace: workspaceData,
          members: workspaceMembers,
        }}
        channels={channels?.data ?? []}
      />

      <SidebarInset className="min-w-0 overflow-hidden bg-background">
        {/* Phones only: the sidebar is a slide-over there, so it needs a trigger.
            On desktop it stays open (Cmd/Ctrl+B or the edge rail collapses it),
            which avoids stacking a second bar above each channel's own header. */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
          <SidebarTrigger aria-label="Open sidebar" />
          <span className="font-display text-sm font-semibold tracking-tight">
            Thread<span className="text-primary">Call</span>
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
