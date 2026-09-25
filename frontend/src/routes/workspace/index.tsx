import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

import type { Workspace } from '#/lib/types/workspace.type'
import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router'
import { ArrowRight, Building2, Plus } from 'lucide-react'

import { Separator } from '#/components/ui/separator'
import { cn } from '#/lib/utils'

const parentRoute = getRouteApi('/workspace')

export const Route = createFileRoute('/workspace/')({
  component: RouteComponent,
})

function WorkspaceAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2A2A3A] bg-[#111118] text-sm font-semibold text-[#E8A838]">
      {initials}
    </div>
  )
}

function RouteComponent() {
  const { user, workspaces } = parentRoute.useLoaderData()
  console.log('data', user)
  console.log('workspace', workspaces)
  const hasWorkspaces = workspaces.workspaces.length > 0

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-64 w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="mb-6 text-center sm:mb-8">
          <a href="/" className="inline-block no-underline font-display">
            <span className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Thread<span className="text-primary">Call</span>
            </span>
          </a>
        </div>

        <Card className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl sm:max-w-xl">
          {/* window chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-popover px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 text-xs text-muted-foreground">
              ThreadCall — workspaces
            </span>
          </div>

          <CardHeader className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
            <CardTitle className="text-lg font-semibold text-foreground sm:text-xl">
              Welcome back, {user.username}
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
              {hasWorkspaces
                ? 'Choose a workspace to jump in, or create a new one.'
                : 'Create your first workspace to start collaborating.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {/* ── workspace list ── */}
            {hasWorkspaces && (
              <div className="divide-y divide-[#1E1E2A]">
                {workspaces.workspaces.map((workspace: Workspace) => (
                  <Link
                    key={workspace.id}
                    to="/workspace/$slug"
                    params={{ slug: workspace.slug }}
                    className={cn(
                      'group flex min-h-[64px] items-center gap-3 px-5 py-3.5 sm:px-6',
                      'transition-colors duration-200',
                      'hover:bg-[#111118]',
                      'focus:outline-none focus-visible:bg-[#111118]',
                      'focus-visible:ring-inset focus-visible:ring-1 focus-visible:ring-[#E8A838]',
                    )}
                    aria-label={`Open workspace ${workspace.name}`}
                  >
                    <WorkspaceAvatar name={workspace.name} />

                    {/* text — truncates on small screens */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#F5F0E8]">
                        {workspace.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#4A4860]">
                        threadcall.dev/{workspace.slug}
                      </p>
                    </div>

                    {/* arrow — always visible, no text on mobile */}
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        'bg-[#E8A838]/10 text-[#E8A838]',
                        'transition-all duration-300',
                        'group-hover:bg-[#E8A838] group-hover:text-[#0A0A0F]',
                        'group-hover:shadow-[0_4px_12px_rgba(232,168,56,0.3)]',
                      )}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── empty state ── */}
            {!hasWorkspaces && (
              <div className="flex flex-col items-center px-5 py-12 text-center sm:px-8 sm:py-16">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground sm:text-lg">
                  No workspaces yet
                </h3>
                <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground sm:text-sm">
                  Create your first workspace to invite teammates and start
                  having calls inside threads.
                </p>
                <Link
                  to="/workspace/create"
                  className={cn(
                    'mt-6 h-10 w-full max-w-xs gap-2 rounded-lg text-sm font-semibold sm:w-auto sm:px-8 flex justify-center items-center',
                    'bg-[#E8A838] text-[#0A0A0F] hover:bg-[#F0B848]',
                    'transition-all duration-300 hover:-translate-y-0.5',
                    'hover:shadow-[0_6px_20px_rgba(232,168,56,0.28)]',
                    'active:scale-[0.98] active:translate-y-0',
                    'focus-visible:ring-2 focus-visible:ring-[#E8A838] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16161F]',
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Create workspace
                </Link>
              </div>
            )}

            {/* ── footer row ── */}
            {hasWorkspaces && (
              <>
                <Separator className="bg-border" />
                <div className="px-5 py-4 sm:px-6">
                  <Link
                    to="/workspace/create"
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5',
                      'text-sm text-muted-foreground hover:text-foreground',
                      'hover:bg-popover transition-colors duration-200',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium">
                      Create or join a workspace
                    </span>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
