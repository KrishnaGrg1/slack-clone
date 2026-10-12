import { acceptInviteLink } from '#/lib/services/workspace.service'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { cn } from '#/lib/utils'
import {
  createFileRoute,
  Link,
  redirect,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export const Route = createFileRoute('/workspace/invite/$invite_code')({
  pendingMs: 0,
  pendingMinMs: 400,
  pendingComponent: JoiningWorkspace,
  errorComponent: JoinWorkspaceError,
  loader: async ({ params }) => {
    const { invite_code } = params
    const result = await acceptInviteLink({ data: { invite_code } })
    const slug = result.data.workspace.slug

    throw redirect({
      to: '/workspace/$slug',
      params: { slug },
    })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <JoiningWorkspace />
}

function JoiningWorkspace() {
  return (
    <InviteShell>
      <div className="flex flex-col items-center px-5 py-12 text-center sm:px-8 sm:py-16">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-[#E8A838]/20 bg-[#E8A838]/10">
          <Loader2 className="h-6 w-6 animate-spin text-[#E8A838]" />
        </div>
        <h3 className="text-base font-semibold text-[#F5F0E8] sm:text-lg">
          Joining workspace
        </h3>
        <p className="mt-2 max-w-sm text-xs leading-6 text-[#8A87A0] sm:text-sm">
          Hang tight while we add you to this workspace.
        </p>
      </div>
    </InviteShell>
  )
}

function JoinWorkspaceError({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message
      : 'Failed to join workspace. Please try again.'

  return (
    <InviteShell>
      <div className="flex flex-col items-center px-5 py-12 text-center sm:px-8 sm:py-16">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-[#F5F0E8] sm:text-lg">
          Failed to join workspace
        </h3>
        <p className="mt-2 max-w-sm text-xs leading-6 text-[#8A87A0] sm:text-sm">
          {message}
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={reset}
            className={cn(
              'h-10 rounded-lg px-4 text-sm font-semibold',
              'bg-[#E8A838] text-[#0A0A0F] hover:bg-[#F0B848]',
            )}
          >
            Try again
          </Button>
          <Link
            to="/workspace"
            className={cn(
              'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#2A2A3A] bg-[#111118] px-4 text-sm font-semibold text-[#F5F0E8] hover:bg-[#16161F]',
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workspaces
          </Link>
        </div>
      </div>
    </InviteShell>
  )
}

function InviteShell({ children }: { children: ReactNode }) {
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
          <div className="flex items-center gap-2 border-b border-border bg-popover px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 text-xs text-muted-foreground">
              ThreadCall — join workspace
            </span>
          </div>

          <CardHeader className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
            <CardTitle className="text-lg font-semibold text-foreground sm:text-xl">
              Workspace invite
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
              Accepting your invite and opening the workspace.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">{children}</CardContent>
        </Card>
      </main>
    </div>
  )
}
