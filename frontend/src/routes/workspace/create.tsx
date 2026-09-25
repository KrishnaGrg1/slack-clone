import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import CreateWorkspaceForm from '#/components/workspace/createWorkspace'
import { UserData, WorkspaceData } from '#/components/workspace/mock'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/create')({
  loader: async () => {
    const user = UserData
    const workspaces = WorkspaceData

    return {
      user,
      workspaces,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { user, workspaces } = Route.useLoaderData()
  const hasWorkspaces = workspaces.length > 0
  return (
    <div className="min-h-screen w-full bg-[#0A0A0F] text-[#F5F0E8]">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-64 w-[500px] -translate-x-1/2 rounded-full bg-[#E8A838]/06 blur-3xl" />
      </div>

      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-16">
        {/* logo */}
        <div className="mb-6 text-center sm:mb-8">
          <a
            href="/"
            className="inline-block no-underline"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-xl font-semibold tracking-tight text-[#F5F0E8] sm:text-2xl">
              Thread<span className="text-[#E8A838]">Call</span>
            </span>
          </a>
        </div>

        <Card className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#2A2A3A] bg-[#16161F] p-0 shadow-2xl sm:max-w-xl">
          {/* window chrome */}
          <div className="flex items-center gap-2 border-b border-[#2A2A3A] bg-[#111118] px-4 py-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 text-xs text-[#7A7890]">
              ThreadCall — workspaces
            </span>
          </div>

          <CardHeader className="border-b border-[#2A2A3A] px-5 py-5 sm:px-6 sm:py-6">
            <CardTitle
              className="text-lg font-semibold text-[#F5F0E8] sm:text-xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Welcome back, {user.username}
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs text-[#7A7890] sm:text-sm">
              {hasWorkspaces
                ? 'Choose a workspace to jump in, or create a new one.'
                : 'Create your first workspace to start collaborating.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {/* ── create form (inline) ── */}

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#F5F0E8]">
                  New workspace
                </p>
                <Link
                  to="/workspace"
                  className="text-xs text-[#4A4860] transition-colors hover:text-[#7A7890]"
                >
                  Cancel
                </Link>
              </div>
              <CreateWorkspaceForm />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
