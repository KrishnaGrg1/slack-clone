import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  Bell,
  ChevronDown,
  ChevronsUpDown,
  Hash,
  Home,
  LogOut,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '#/components/ui/sidebar'
import { useLogOut } from '#/hooks/use-auth'

import { cn } from '#/lib/utils'
import type { User } from '#/lib/types/auth.type'
import type { Channel } from '#/lib/types/channel.type'
import type { Workspace, WorkspaceMember } from '#/lib/types/workspace.type'
import { getInitials } from '#/lib/initials'

// Every colour below is a theme token (see theme.css). No raw hex values.

const groupLabel =
  'h-7 px-2 text-xs font-medium tracking-normal text-muted-foreground'

const MEMBER_PREVIEW = 8

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
      {children}
    </p>
  )
}

export default function AppSidebar({
  channels,
  workspaceDetails,
  user,
  onAddChannel,
}: {
  channels: Channel[]
  workspaceDetails: {
    workspace: Workspace
    members: WorkspaceMember[]
  }
  user: User
  /** Wire this to your "create channel" dialog. */
  onAddChannel?: () => void
}) {
  const { workspace, members } = workspaceDetails
  const { mutate: logOut } = useLogOut()
  const matchRoute = useMatchRoute()

  const [query, setQuery] = useState('')
  const [showAllMembers, setShowAllMembers] = useState(false)
  const q = query.trim().toLowerCase()
  const isFiltering = q.length > 0

  const isHome = !!matchRoute({
    to: '/workspace/$slug',
    params: { slug: workspace.slug },
    fuzzy: false,
  })

  const filteredChannels = useMemo(
    () =>
      q ? channels.filter((c) => c.name.toLowerCase().includes(q)) : channels,
    [channels, q],
  )

  // Current user first, then alphabetical.
  const sortedMembers = useMemo(() => {
    const list = [...members].sort((a, b) => {
      if (a.username === user.username) return -1
      if (b.username === user.username) return 1
      return a.username.localeCompare(b.username)
    })
    return q ? list.filter((m) => m.username.toLowerCase().includes(q)) : list
  }, [members, q, user.username])

  const visibleMembers =
    isFiltering || showAllMembers
      ? sortedMembers
      : sortedMembers.slice(0, MEMBER_PREVIEW)
  const hiddenCount = sortedMembers.length - visibleMembers.length

  const noResults =
    isFiltering && filteredChannels.length === 0 && sortedMembers.length === 0

  return (
    <Sidebar collapsible="icon">
      {/* Workspace switcher */}
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-2 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="h-10 data-popup-open:bg-sidebar-accent"
                  />
                }
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  {getInitials(workspace.name)}
                </span>
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">
                    {workspace.name}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {workspace.slug}
                  </span>
                </span>
                <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" side="bottom" className="w-60">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">
                    Thread<span className="text-primary">Call</span> workspace
                  </p>
                  <p className="truncate text-sm font-medium">
                    {workspace.name}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  render={<Link to="/workspace" />}
                >
                  <ChevronDown className="mr-2 size-4 -rotate-90" />
                  Switch workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Search (hidden when collapsed to icons) */}
        <SidebarGroup className="pb-0 group-data-[collapsible=icon]:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <SidebarInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
              placeholder="Search channels & people"
              aria-label="Search channels and people"
              className="h-8 border-sidebar-border bg-secondary pl-8 pr-8 text-[13px] placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </SidebarGroup>

        {/* Home */}
        {!isFiltering && (
          <SidebarGroup className="pb-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isHome}
                    tooltip="Home"
                    className={cn(
                      'text-[13px]',
                      isHome &&
                        'bg-primary/15 font-medium text-sidebar-accent-foreground hover:bg-primary/20',
                    )}
                    render={
                      <Link
                        to="/workspace/$slug"
                        params={{ slug: workspace.slug }}
                      />
                    }
                  >
                    <Home
                      className={cn(
                        'size-4 shrink-0',
                        isHome && 'text-primary',
                      )}
                    />
                    <span className="truncate">Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {noResults && <EmptyHint>No matches for “{query}”.</EmptyHint>}

        {/* Channels */}
        {(!isFiltering || filteredChannels.length > 0) && (
          <SidebarGroup>
            <SidebarGroupLabel className={groupLabel}>
              Channels
              <span className="ml-1.5 tabular-nums text-muted-foreground/70">
                {channels.length}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupAction
              title="Add channel"
              aria-label="Add channel"
              onClick={onAddChannel}
              className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Plus className="size-3.5" />
            </SidebarGroupAction>

            <SidebarGroupContent>
              <SidebarMenu>
                {filteredChannels.length === 0 && (
                  <EmptyHint>
                    No channels yet. Use + to create the first one.
                  </EmptyHint>
                )}

                {filteredChannels.map((ch) => {
                  const isActive = !!matchRoute({
                    to: '/workspace/$slug/channel/$id',
                    params: { slug: workspace.slug, id: ch.id },
                  })

                  return (
                    <SidebarMenuItem key={ch.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={ch.name}
                        className={cn(
                          'text-[13px]',
                          isActive &&
                            'bg-primary/15 font-medium text-sidebar-accent-foreground hover:bg-primary/20',
                        )}
                        render={
                          <Link
                            to="/workspace/$slug/channel/$id"
                            params={{ slug: workspace.slug, id: ch.id }}
                          />
                        }
                      >
                        <Hash
                          className={cn(
                            'size-4 shrink-0',
                            isActive && 'text-primary',
                          )}
                        />
                        <span className="truncate">{ch.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(!isFiltering || sortedMembers.length > 0) && <SidebarSeparator />}

        {/* Members */}
        {(!isFiltering || sortedMembers.length > 0) && (
          <SidebarGroup>
            <SidebarGroupLabel className={groupLabel}>
              Members
              <span className="ml-1.5 tabular-nums text-muted-foreground/70">
                {members.length}
              </span>
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMembers.map((m) => {
                  const isMe = m.username === user.username
                  const role = (m as { role?: string }).role
                  const showRole =
                    role && ['admin', 'owner'].includes(role.toLowerCase())

                  return (
                    <SidebarMenuItem key={m.id}>
                      <SidebarMenuButton
                        tooltip={m.username}
                        className="text-[13px]"
                      >
                        <Avatar className="size-5 shrink-0 rounded-md">
                          <AvatarImage
                            src={m.avatar_url ?? undefined}
                            alt=""
                            className="rounded-md"
                          />
                          <AvatarFallback className="rounded-md bg-secondary text-[9px] font-semibold text-secondary-foreground">
                            {getInitials(m.username)}
                          </AvatarFallback>
                          {/* TODO: switch to bg-success when presence data exists */}
                          <AvatarBadge className="size-2 border border-sidebar bg-muted-foreground" />
                        </Avatar>
                        <span className="truncate">
                          {m.username}
                          {isMe && (
                            <span className="ml-1 text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </span>
                        {showRole && (
                          <span className="ml-auto rounded-full border border-sidebar-border px-1.5 py-px text-[9px] font-medium capitalize text-muted-foreground group-data-[collapsible=icon]:hidden">
                            {role}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}

                {hiddenCount > 0 && (
                  <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                    <SidebarMenuButton
                      onClick={() => setShowAllMembers(true)}
                      className="text-xs text-muted-foreground"
                    >
                      <ChevronDown className="size-3.5" />
                      Show {hiddenCount} more
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {showAllMembers &&
                  !isFiltering &&
                  sortedMembers.length > MEMBER_PREVIEW && (
                    <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                      <SidebarMenuButton
                        onClick={() => setShowAllMembers(false)}
                        className="text-xs text-muted-foreground"
                      >
                        <ChevronDown className="size-3.5 rotate-180" />
                        Show less
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Current user */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="h-11 text-[13px] data-popup-open:bg-sidebar-accent"
                  />
                }
              >
                <Avatar className="size-7 shrink-0 rounded-md">
                  <AvatarImage
                    src={user.avatar_url ?? undefined}
                    alt=""
                    className="rounded-md"
                  />
                  <AvatarFallback className="rounded-md bg-primary text-xs font-bold text-primary-foreground">
                    {getInitials(user.username)}
                  </AvatarFallback>
                  <AvatarBadge className="size-2 border border-sidebar bg-success" />
                </Avatar>
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate font-medium text-sidebar-accent-foreground">
                    {user.username}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {(user as { email?: string }).email ?? 'Online'}
                  </span>
                </span>
                <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" side="top" className="w-52">
                <DropdownMenuItem className="cursor-pointer">
                  <Bell className="mr-2 size-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => logOut()}
                >
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
