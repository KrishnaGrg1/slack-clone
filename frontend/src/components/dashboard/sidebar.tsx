import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  Bell,
  ChevronDown,
  Hash,
  LogOut,
  Plus,
  Search,
  Settings,
} from 'lucide-react'

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

export default function AppSidebar({
  channels,
  workspaceDetails,
  user,
}: {
  channels: Channel[]
  workspaceDetails: {
    workspace: Workspace
    members: WorkspaceMember[]
  }
  user: User
}) {
  const { workspace, members } = workspaceDetails
  const { mutate: logOut } = useLogOut()
  const matchRoute = useMatchRoute()

  return (
    <Sidebar collapsible="icon">
      {/* Workspace switcher */}
      <SidebarHeader className="h-12 justify-center border-b border-sidebar-border px-2 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="h-9 font-semibold data-popup-open:bg-sidebar-accent" />
                }
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  T
                </span>
                <span className="truncate font-display text-sm tracking-tight text-sidebar-accent-foreground">
                  Thread<span className="text-primary">Call</span>
                </span>
                <ChevronDown className="ml-auto size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" side="bottom" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">Workspace</p>
                  <p className="truncate text-sm font-medium">
                    {workspace.slug}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  render={<Link to="/workspace" />}
                >
                  Switch workspace
                </DropdownMenuItem>
                <DropdownMenuItem disabled>Invite people</DropdownMenuItem>
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
              placeholder="Search"
              aria-label="Search"
              className="h-8 border-sidebar-border bg-secondary pl-8 text-[13px] placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-0"
            />
          </div>
        </SidebarGroup>

        {/* Channels */}
        <SidebarGroup>
          <SidebarGroupLabel className={groupLabel}>Channels</SidebarGroupLabel>
          <SidebarGroupAction
            title="Add channel"
            aria-label="Add channel"
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="size-3.5" />
          </SidebarGroupAction>

          <SidebarGroupContent>
            <SidebarMenu>
              {channels.map((ch) => {
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

        <SidebarSeparator />

        {/* Members */}
        <SidebarGroup>
          <SidebarGroupLabel className={groupLabel}>
            Members
            <span className="ml-1.5 tabular-nums text-muted-foreground/70">
              {members.length}
            </span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {members.map((m) => (
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
                    <span className="truncate">{m.username}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                    className="h-10 text-[13px] data-popup-open:bg-sidebar-accent"
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
                <span className="flex-1 truncate font-medium text-sidebar-accent-foreground">
                  {user.username}
                </span>
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
