import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

import type { Workspace } from '#/lib/types/workspace.type'
import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  Globe,
  Loader2,
  Lock,
  Plus,
  Search,
  X,
} from 'lucide-react'

import { Separator } from '#/components/ui/separator'
import { cn } from '#/lib/utils'
import {
  useDebouncedValue,
  useSearchWorkspaces,
} from '#/components/workspace/workspace.search'
import { Button } from '#/components/ui/button'
import { useJoinWorkspace } from '#/hooks/use-workspace'

const parentRoute = getRouteApi('/workspace')
const PAGE_SIZE = 10

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

function WorkspaceRow({
  workspace,
  isMember,
  isJoining,
  onJoin,
}: {
  workspace: Workspace
  isMember: boolean
  isJoining?: boolean
  onJoin?: (id: string) => void
}) {
  // ── not joined: not clickable, shows a Join button ──
  if (!isMember) {
    const isPrivate = workspace.is_private

    return (
      <div
        className={cn(
          'flex min-h-[72px] items-center gap-3 px-5 py-4 sm:px-6',
          'bg-[#0C0C12]/50',
        )}
      >
        <div className="relative shrink-0">
          <WorkspaceAvatar name={workspace.name} />
          <span
            className={cn(
              'absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#16161F]',
              isPrivate
                ? 'bg-[#2A2A3A] text-[#8A87A0]'
                : 'bg-[#E8A838] text-[#0A0A0F]',
            )}
            aria-hidden
          >
            {isPrivate ? (
              <Lock className="h-2.5 w-2.5" />
            ) : (
              <Globe className="h-2.5 w-2.5" />
            )}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-medium text-[#F5F0E8]">
              {workspace.name}
            </p>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                isPrivate
                  ? 'border-[#2A2A3A] bg-[#111118] text-[#8A87A0]'
                  : 'border-[#E8A838]/25 bg-[#E8A838]/10 text-[#E8A838]',
              )}
            >
              {isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-[#4A4860]">
            threadcall.dev/{workspace.slug}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[#6E6B84]">
            {isPrivate
              ? 'Invite only. Ask a member to send you an invite.'
              : 'Open workspace. Join to start collaborating.'}
          </p>
        </div>

        {isPrivate ? (
          <Button
            type="button"
            disabled
            aria-label={`${workspace.name} is invite only`}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold',
              'border border-[#2A2A3A] bg-[#111118] text-[#8A87A0]',
              'disabled:cursor-not-allowed disabled:opacity-80',
            )}
          >
            <Lock className="h-3.5 w-3.5" />
            Invite only
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isJoining}
            onClick={() => onJoin?.(workspace.id)}
            aria-label={`Join workspace ${workspace.name}`}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold',
              'bg-[#E8A838] text-[#0A0A0F] hover:bg-[#F0B848]',
              'transition-all duration-300 active:scale-[0.98]',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16161F]',
            )}
          >
            {isJoining ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {isJoining ? 'Joining…' : 'Join'}
          </Button>
        )}
      </div>
    )
  }

  // ── joined: your existing row, unchanged ──
  return (
    <Link
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
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F5F0E8]">
          {workspace.name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[#4A4860]">
          threadcall.dev/{workspace.slug}
        </p>
      </div>
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
  )
}

function RouteComponent() {
  const { user, workspaces } = parentRoute.useLoaderData()
  const myWorkspaces: Workspace[] = workspaces?.workspaces ?? []
  const hasWorkspaces = myWorkspaces.length > 0

  // ── search state ──
  const [input, setInput] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebouncedValue(input.trim(), 300)
  const isSearching = debounced.length > 0

  const {
    data: searchData,
    isFetching,
    isError,
    error,
  } = useSearchWorkspaces(
    { search: debounced, page, limit: PAGE_SIZE },
    isSearching,
  )

  const results = searchData?.data.workspaces ?? []
  const hasNextPage = results.length === PAGE_SIZE
  // Show the user's own list when not searching, API results otherwise.
  const listToShow = isSearching ? results : myWorkspaces
  const showSearchBar = hasWorkspaces || isSearching || input.length > 0

  const handleChange = (value: string) => {
    setInput(value)
    setPage(1) // reset pagination whenever the query changes
  }

  const {
    mutate: joinWorkspace,
    isPending: isJoining,
    variables: joiningWorkspaceId,
  } = useJoinWorkspace()

  const clear = () => handleChange('')

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
                ? 'Choose a workspace to jump in, or search for one.'
                : 'Create your first workspace to start collaborating.'}
            </CardDescription>

            {/* ── search bar ── */}
            {showSearchBar && (
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Search workspaces…"
                  aria-label="Search workspaces"
                  className={cn(
                    'h-10 w-full rounded-lg border border-border bg-popover pl-9 pr-9 text-sm text-foreground',
                    'placeholder:text-muted-foreground',
                    'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E8A838]',
                  )}
                />
                {isSearching && isFetching ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : input ? (
                  <button
                    type="button"
                    onClick={clear}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {/* ── search error ── */}
            {isSearching && isError && (
              <div className="px-5 py-8 text-center text-sm text-red-400 sm:px-8">
                {error instanceof Error
                  ? error.message
                  : 'Something went wrong while searching.'}
              </div>
            )}

            {/* ── search: first load ── */}
            {isSearching && !searchData && !isError && (
              <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {/* ── search: no matches ── */}
            {isSearching && searchData && results.length === 0 && (
              <div className="px-5 py-10 text-center sm:px-8">
                <p className="text-sm font-medium text-foreground">
                  No workspaces found
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nothing matches “{debounced}”. Try a different name.
                </p>
              </div>
            )}

            {/* ── workspace list (mine or search results) ── */}
            {listToShow.length > 0 && !(isSearching && isError) && (
              <div
                className={cn(
                  'divide-y divide-[#1E1E2A] transition-opacity',
                  isSearching && isFetching && 'opacity-60',
                )}
              >
                {listToShow.map((workspace: Workspace) => (
                  <WorkspaceRow
                    key={workspace.id}
                    workspace={workspace}
                    isMember={myWorkspaces.some((w) => w.id === workspace.id)}
                    isJoining={isJoining && joiningWorkspaceId === workspace.id}
                    onJoin={(id) => joinWorkspace(id)}
                  />
                ))}
              </div>
            )}

            {/* ── pagination (search only) ── */}
            {isSearching && searchData && (page > 1 || hasNextPage) && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6">
                <button
                  type="button"
                  disabled={page === 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {page}
                </span>
                <button
                  type="button"
                  disabled={!hasNextPage || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}

            {/* ── empty state (no workspaces, not searching) ── */}
            {!hasWorkspaces && !isSearching && (
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
