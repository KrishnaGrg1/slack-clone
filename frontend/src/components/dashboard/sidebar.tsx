import {
  Bell,
  Hash,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
} from 'lucide-react'

import { Avatar, AvatarBadge, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { cn } from '@/lib/utils'
import { CHANNELS, ONLINE_MEMBERS } from './mock'

export default function Sidebar({
  activeChannel,
  onChannelSelect,
}: {
  activeChannel: string
  onChannelSelect: (id: string) => void
}) {
  return (
    <TooltipProvider delay={200}>
      <aside className="w-60 shrink-0 flex flex-col min-h-0  bg-[#111118] border-r border-[#2A2A3A]">
        {/* Workspace header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-[#2A2A3A] shrink-0">
          <span
            className="text-sm font-semibold text-[#F5F0E8] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Thread<span className="text-[#E8A838]">Call</span>
          </span>

          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#16161F]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>

            <TooltipContent>Workspace menu</TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-2 py-3">
          {/* Search */}
          <div className="relative mb-3 px-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4A4860]" />

            <Input
              placeholder="Search..."
              className="h-8 w-full bg-[#16161F] border-[#2A2A3A] rounded-md pl-8 pr-3 text-xs text-[#F5F0E8] placeholder:text-[#4A4860] focus-visible:border-[#E8A838]/50 focus-visible:ring-0"
            />
          </div>

          {/* Channels */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-semibold text-[#4A4860] uppercase tracking-wider">
                Channels
              </span>

              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-transparent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>

                <TooltipContent>Add channel</TooltipContent>
              </Tooltip>
            </div>

            <div className="space-y-0.5">
              {CHANNELS.map((ch) => (
                <Button
                  key={ch.id}
                  variant="ghost"
                  onClick={() => onChannelSelect(ch.id)}
                  className={cn(
                    'w-full justify-start gap-2 px-2 py-1.5 h-8 rounded-md text-left font-normal',
                    'hover:text-[#F5F0E8] hover:bg-[#16161F]',
                    activeChannel === ch.id
                      ? 'bg-[#E8A838]/10 text-[#F5F0E8] hover:bg-[#E8A838]/10'
                      : 'text-[#7A7890]',
                  )}
                >
                  <Hash className="h-3.5 w-3.5 shrink-0" />

                  <span className="text-xs flex-1 truncate">{ch.name}</span>

                  {ch.unread > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 min-w-4 px-1 bg-[#E8A838] text-[#0A0A0F] text-[9px] font-bold rounded-full hover:bg-[#E8A838]"
                    >
                      {ch.unread}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-[#2A2A3A] mb-4" />

          {/* Members */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-semibold text-[#4A4860] uppercase tracking-wider">
                Members
              </span>
            </div>

            <div className="space-y-0.5">
              {ONLINE_MEMBERS.map((m) => (
                <Button
                  key={m.id}
                  variant="ghost"
                  className="w-full cursor-pointer justify-start gap-2 px-2 py-1.5 h-9 rounded-md font-normal text-[#7A7890] hover:text-[#F5F0E8] hover:bg-[#16161F]"
                >
                  <Avatar className="h-6 w-6 rounded-md shrink-0">
                    <AvatarFallback
                      className={cn(
                        'rounded-full text-[10px] font-bold',
                        m.id === '1'
                          ? 'bg-[#E8A838] text-[#0A0A0F]'
                          : 'bg-[#1D9E75] text-[#0A0A0F]',
                      )}
                    >
                      {m.avatar}
                    </AvatarFallback>
                    <AvatarBadge
                      className={cn(
                        'h-2 w-2 border border-[#111118]',
                        m.online ? 'bg-[#1D9E75]' : 'bg-[#4A4860]',
                      )}
                    />
                  </Avatar>

                  <span className="text-xs truncate">{m.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* User footer */}
        <div className="h-12 flex items-center gap-2 px-3 border-t border-[#2A2A3A] shrink-0">
          <Avatar className="h-7 w-7 rounded-md shrink-0">
            <AvatarFallback className="rounded-md bg-[#E8A838] text-[#0A0A0F] text-xs font-bold">
              K
            </AvatarFallback>
            <AvatarBadge className="h-2 w-2 bg-[#1D9E75] border border-[#111118]" />
          </Avatar>

          <span className="text-xs font-medium text-[#F5F0E8] flex-1 truncate">
            krishna
          </span>

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#16161F]"
                >
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>

              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#16161F]"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>

              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
