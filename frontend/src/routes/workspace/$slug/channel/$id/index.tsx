import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import {
  Hash,
  MessageSquareText,
  MoreHorizontal,
  Phone,
  Search,
  Video,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import { ScrollArea } from '#/components/ui/scroll-area'
import { Textarea } from '#/components/ui/textarea'
import { useGetChannel, useGetChannels } from '#/hooks/use-channel'
import { useChannelMessages } from '#/hooks/use-message'
import { useChannelSocket } from '#/hooks/use-socket'
import { parentRoute } from '#/routes/workspace/route'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/workspace/$slug/channel/$id/')({
  component: RouteComponent,
})

const routeApi = getRouteApi('/workspace/$slug')

function RouteComponent() {
  const { id } = Route.useParams()
  const { workspace } = routeApi.useLoaderData()
  const { user } = parentRoute.useLoaderData()
  const { data: channels } = useGetChannels(workspace.data.workspace.id)
  const { data: channel } = useGetChannel(workspace.data.workspace.id, id)

  //channel Message
  const { data: channelMessages, isLoading } = useChannelMessages(
    id,
    workspace.data.workspace.id,
  )
  const messages = channelMessages?.data?.messages ?? []

  // const { send } = useChannelSocket(id)
  const currentChannel =
    channel?.data.channel ?? channels?.data.find((item) => item.id === id)

  return (
    <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#0A0A0F] text-[#F5F0E8]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#2A2A3A] px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E8A838]/10 text-[#E8A838]">
            <Hash className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-[#F5F0E8]">
              {currentChannel?.name ?? 'Channel'}
            </h1>

            <p className="text-[10px] text-[#4A4860]">
              {workspace.data.workspace.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">{/* buttons */}</div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="px-4 py-5">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <p className="text-sm text-[#4A4860]">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8A838]/10">
                    <MessageSquareText className="h-5 w-5 text-[#E8A838]" />
                  </div>

                  <h3 className="mb-1 text-sm font-semibold text-[#F5F0E8]">
                    No messages yet
                  </h3>

                  <p className="text-xs text-[#4A4860]">
                    Be the first to send a message.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === user.id

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'mb-4 flex w-full',
                      isOwnMessage ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'flex max-w-[75%] gap-2.5',
                        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isOwnMessage
                            ? 'bg-[#E8A838] text-[#0A0A0F]'
                            : 'bg-[#292936] text-[#F5F0E8]',
                        )}
                      >
                        {message.sender_username?.charAt(0).toUpperCase()}
                      </div>

                      {/* Message */}
                      <div
                        className={cn(
                          'flex min-w-0 flex-col',
                          isOwnMessage ? 'items-end' : 'items-start',
                        )}
                      >
                        <div
                          className={cn(
                            'mb-1 flex items-center gap-2',
                            isOwnMessage ? 'flex-row-reverse' : 'flex-row',
                          )}
                        >
                          <span className="text-xs font-semibold text-[#F5F0E8]">
                            {isOwnMessage ? 'You' : message.sender_username}
                          </span>

                          <span className="text-[10px] text-[#4A4860]">
                            {new Date(message.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </span>
                        </div>

                        <div
                          className={cn(
                            'rounded-2xl px-3.5 py-2.5 text-sm leading-6',
                            isOwnMessage
                              ? 'rounded-tr-md bg-[#E8A838] text-[#0A0A0F]'
                              : 'rounded-tl-md bg-[#16161F] text-[#C8C4BE]',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#2A2A3A] bg-[#111118] p-3">
        <div className="rounded-xl border border-[#2A2A3A] bg-[#16161F]">
          <Textarea
            placeholder={`Message #${currentChannel?.name ?? 'channel'}`}
            className="min-h-[44px] max-h-[160px] resize-none border-0 bg-transparent px-3 pt-3 text-sm text-[#F5F0E8] placeholder:text-[#4A4860] focus-visible:ring-0"
          />

          <div className="flex justify-end px-2 pb-2">
            <Button className="h-8 rounded-lg bg-[#E8A838] px-4 text-xs font-semibold text-[#0A0A0F] hover:bg-[#F0B848]">
              Send
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
