import { getChannelMessage } from '#/lib/services/channel.service'
import { useQuery } from '@tanstack/react-query'


export const channelMessagesKey = (
  workspaceId: string,
  channelId: string,
) => ['channel-messages', workspaceId, channelId] as const


export function useChannelMessages(channel_id: string,workspace_id:string) {
  return useQuery({
   queryKey: channelMessagesKey(workspace_id, channel_id),
    queryFn: () => getChannelMessage({
        data:{
            workspace_id:workspace_id!,
            channel_id:channel_id!,
        }
    }),
    enabled: Boolean(workspace_id && channel_id),
  })
}