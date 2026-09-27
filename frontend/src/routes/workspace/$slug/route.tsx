import Sidebar from '#/components/dashboard/sidebar'
import { WorkspaceNotFound } from '#/components/workspace/WorkspaceNotFound'
import { getWorkspaceBySlug } from '#/lib/services/workspace.service'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { parentRoute } from '../route'
import { useGetChannels } from '#/hooks/use-channel'
import { useState } from 'react'

export const Route = createFileRoute('/workspace/$slug')({
  loader: async ({ params }) => {
    // Throws automatically if backend returns 404, 403, or error string
    const workspace = await getWorkspaceBySlug({
      data: { slug: params.slug },
    })

    return { workspace }
  },

  // Renders when loader throws an Error or custom API error
  errorComponent: ({ reset }) => <WorkspaceNotFound reset={reset} />,

  // Renders when router explicitly triggers a 404
  notFoundComponent: () => <WorkspaceNotFound />,

  component: RouteComponent,
})

function RouteComponent() {
  const { workspace } = Route.useLoaderData()
  const { user } = parentRoute.useLoaderData()
  // normalize workspace shape returned from loader (some responses nest under `data.workspace`)
  const workspaceData = workspace?.data?.workspace ?? workspace
  const workspaceMembers = workspace?.data?.members ?? []

  // members / channels
  const { data: channels } = useGetChannels(workspaceData.id)

  return (
    <div className="h-screen flex bg-[#0A0A0F] overflow-hidden font-mono">
      <Sidebar
        user={user}
        workspaceDetails={{
          workspace: workspaceData,
          members: workspaceMembers,
        }}
        channels={channels?.data ?? []}
      />
      <Outlet />
    </div>
  )
}
