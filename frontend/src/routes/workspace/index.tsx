import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

import CreateWorkspaceForm from '#/components/workspace/createWorkspace'
import { UserData, WorkspaceData } from '#/components/workspace/mock'
import { getMe } from '#/lib/services/user.services'
import { GetUserWorkspaces } from '#/lib/services/workspace.service'
import type { Workspace } from '#/lib/types/workspace.type'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ArrowRight, Building2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/workspace/')({
  loader: async () => {
    // let user = null,
    //   workspaces = null

    try {
      // user = await getMe()
      // workspaces = await GetUserWorkspaces()
    } catch (e) {
      throw redirect({ to: '/login' })
    }

    // if (!user || !workspaces) {
    //   throw redirect({ to: '/login' })
    // }

    return {
      // user: user.data.user,
      // workspaces: workspaces.data.workspaces ?? [],
      user: UserData,
      workspaces: WorkspaceData ?? [],
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { user, workspaces } = Route.useLoaderData()

  return (
    <div className="min-h-screen w-full bg-[#0A0A0F] font-mono text-[#EDEBEF]">
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#2A2A3A] bg-[#16161F] p-0 shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#111118] border-b border-[#2A2A3A]">
            <span className="ml-2 text-xs text-[#7A7890]">
              ThreadCall — workspaces
            </span>
          </div>
          <CardHeader className="border-b border-[#2A2A3A] px-5 py-5">
            <CardTitle className="text-xl text-[#F5F0E8]">
              Welcome back, {user.username}
            </CardTitle>

            <CardDescription className="mt-1 text-sm text-[#7A7890]">
              Choose a workspace to get started.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5">
            {workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[#E8A838]/20 bg-[#E8A838]/10">
                  <Building2 className="h-5 w-5 text-[#E8A838]" />
                </div>

                <h3 className="text-sm font-medium text-[#F5F0E8]">
                  No workspaces yet
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-[#9A98A6]">
                  You haven't joined any workspace yet. Create one to get
                  started.
                </p>

                <div className="mt-6 w-full max-w-sm">
                  <CreateWorkspaceForm />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mb-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#9A98A6]">
                    Your workspaces
                  </p>
                </div>

                {workspaces.map((workspace: Workspace) => (
                  <div
                    key={workspace.id}
                    className="group flex items-center justify-between gap-4 rounded-lg border border-[#2A2A3A] bg-[#111118] px-4 py-3.5 transition-colors hover:border-[#E8A838]/30 hover:bg-[#0B0B0D]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#F5F0E8]">
                        {workspace.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-[#6F6D78]">
                        {workspace.slug}
                      </p>
                    </div>

                    <Link
                      to="/workspace/$id"
                      params={{ id: workspace.id }}
                      className="shrink-0"
                    >
                      <Button
                        size="sm"
                        className={cn(
                          'inline-flex items-center gap-2',
                          'bg-[#E8A838] text-[#0A0A0F]',
                          'hover:bg-[#F0B848]',
                          'transition-all duration-500',
                          'hover:-translate-y-0.5',
                          'hover:shadow-[0_6px_20px_rgba(232,168,56,0.28)]',
                          'active:scale-[0.98] active:translate-y-0',
                          'focus-visible:ring-2 focus-visible:ring-[#E8A838]',
                        )}
                      >
                        Launch <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
