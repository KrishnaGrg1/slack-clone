import {
  createFileRoute,
  getRouteApi,
  useLocation,
  useRouter,
} from '@tanstack/react-router'
import {
  Copy,
  Check,
  Hash,
  Phone,
  Users,
  MessageSquare,
  Link2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { useGetChannels } from '#/hooks/use-channel'
import { cn } from '#/lib/utils'
import { useInviteWorkspace } from '#/hooks/use-workspace'
import { Button } from '#/components/ui/button'

const slugRoute = getRouteApi('/workspace/$slug')
const workspaceRoute = getRouteApi('/workspace')

export const Route = createFileRoute('/workspace/$slug/')({
  component: RouteComponent,
})

/* ───────────────────────── helpers ───────────────────────── */

function initialsOf(name: string) {
  return (
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

function appBaseUrl() {
  const base =
    (import.meta.env.VITE_FRONTEND_URL as string | undefined) ??
    (typeof window !== 'undefined' ? window.location.origin : '')
  return base.replace(/\/+$/, '')
}

function formatRemaining(expiresAt: Date) {
  const ms = expiresAt.getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const mins = Math.floor(ms / 60_000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins % 60}m`
  return `${Math.max(mins, 1)}m`
}

/** Re-renders the component the moment `expiresAt` passes. */
function useExpiryTick(expiresAt: Date | null) {
  const [, force] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const ms = expiresAt.getTime() - Date.now()
    if (ms <= 0) return
    // setTimeout max is ~24.8 days; clamp so long expiries don't fire early.
    const t = setTimeout(
      () => force((n) => n + 1),
      Math.min(ms + 250, 2 ** 31 - 1),
    )
    return () => clearTimeout(t)
  }, [expiresAt])
}

/* ───────────────────────── small UI ───────────────────────── */

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border border-border bg-popover font-semibold text-primary',
        className,
      )}
    >
      {initialsOf(name)}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-semibold leading-none text-foreground">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/* ───────────────────────── invite card (admin only) ───────────────────────── */

function InviteCard({
  workspaceId,
  code,
  expiresAt,
  onCreated,
}: {
  workspaceId: string
  code?: string | null
  expiresAt?: string | null
  onCreated: (next: { code: string; expiresAt: string }) => void
}) {
  const router = useRouter()
  const { mutate: invite, isPending, isError, error } = useInviteWorkspace()
  const [copied, setCopied] = useState(false)

  const expiry = expiresAt ? new Date(expiresAt) : null
  useExpiryTick(expiry)

  const isActive = !!code && !!expiry && expiry.getTime() > Date.now()
  const inviteUrl = code ? `${appBaseUrl()}/workspace/invite/${code}` : ''

  const create = () =>
    invite({ data: { id: workspaceId } } as any, {
      onSuccess: (res: any) => {
        // Show the new code immediately from the response (shape-tolerant)…
        const payload = res?.data?.workspace ?? res?.data ?? res
        if (payload?.invite_code && payload?.invite_expires_at) {
          onCreated({
            code: payload.invite_code,
            expiresAt: payload.invite_expires_at,
          })
        }
        // …and refresh the loader so the rest of the app agrees.
        router.invalidate()
      },
    })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Invite people
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Only admins can create invite codes.
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Link2 className="h-3.5 w-3.5" />
        </div>
      </div>

      {isActive && expiry ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-popover p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Invite code
              </p>
              <p className="truncate font-mono text-sm text-foreground">
                {code}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={copy}
              className="gap-2 sm:w-auto"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy invite link'}
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Expires in {formatRemaining(expiry)}</span>
            <button
              type="button"
              onClick={create}
              disabled={isPending}
              className="flex items-center gap-1.5 hover:text-foreground disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Generate new code
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-4">
          <p className="text-xs text-muted-foreground">
            {code
              ? 'The last invite code has expired. Create a new one to invite teammates.'
              : 'No active invite code yet. Create one to invite teammates.'}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={create}
            disabled={isPending}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? 'Creating…' : 'Create invitation code'}
          </Button>
        </div>
      )}

      {isError && (
        <p className="mt-3 text-xs text-red-400">
          {error instanceof Error
            ? error.message
            : 'Could not create an invite code.'}
        </p>
      )}
    </section>
  )
}

/* ───────────────────────── route ───────────────────────── */

function RouteComponent() {
  const { workspace } = slugRoute.useLoaderData()
  const { user } = workspaceRoute.useLoaderData()

  // Same normalisation the layout route uses.
  const ws = workspace?.data?.workspace ?? workspace
  const members: any[] = workspace?.data?.members ?? []

  const { data: channels } = useGetChannels(ws.id)
  const channelCount = channels?.data?.length ?? 0

  const location = useLocation()
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${appBaseUrl()}${location.pathname}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const memberName = (m: any): string =>
    m?.user?.username ?? m?.username ?? m?.name ?? 'Member'
  const memberRole = (m: any): string | undefined => m?.role

  // ── admin check: workspace creator OR a member whose role is admin/owner ──
  const me = members.find((m) => (m?.user_id ?? m?.user?.id) === user.id)
  const myRole = String(me?.role ?? '').toLowerCase()
  const isAdmin =
    user.id === ws.created_by || myRole === 'admin' || myRole === 'owner'

  // Fresh code from a just-completed create, so the UI flips instantly
  // without waiting for the loader to refetch.
  const [fresh, setFresh] = useState<{
    code: string
    expiresAt: string
  } | null>(null)

  const inviteCode = fresh?.code ?? ws.invite_code
  const inviteExpiresAt = fresh?.expiresAt ?? ws.invite_expires_at

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-56 w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        {/* ── header ── */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={ws.name} className="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              Welcome back, {user.username}
            </p>
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-foreground">
              {ws.name}
            </h1>
            <p className="mt-0.5 truncate text-xs text-[#4A4860]">
              {location.pathname}
            </p>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className={cn(
              'flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-medium',
              'text-muted-foreground transition-colors hover:bg-popover hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
            )}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </header>

        {/* ── stats ── */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard icon={Hash} label="Channels" value={channelCount} />
          <StatCard icon={Users} label="Members" value={members.length} />
        </section>

        {/* ── invite (admins only) ── */}
        {isAdmin && (
          <InviteCard
            workspaceId={ws.id}
            code={inviteCode}
            expiresAt={inviteExpiresAt}
            onCreated={setFresh}
          />
        )}

        {/* ── members ── */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Members</h2>
            <span className="text-xs text-muted-foreground">
              {members.length}
            </span>
          </div>

          {members.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">
              No members to show yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#1E1E2A]">
              {members.map((m, i) => {
                const name = memberName(m)
                const role = memberRole(m)
                return (
                  <li
                    key={m?.id ?? m?.user_id ?? i}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <Avatar name={name} className="h-9 w-9 text-xs" />
                    <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {name}
                    </p>
                    {role && (
                      <span className="rounded-full border border-border bg-popover px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                        {role}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* ── getting started ── */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Get started</h2>
          <ul className="mt-3 space-y-3">
            {[
              {
                icon: Hash,
                title: 'Pick a channel',
                body: 'Choose one from the sidebar to see its threads.',
              },
              {
                icon: MessageSquare,
                title: 'Start a thread',
                body: 'Keep conversations focused and easy to follow.',
              },
              {
                icon: Phone,
                title: 'Hop on a call',
                body: 'Calls attach to the thread, so context is never lost.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
