import { redirect, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { login, register } from '#/lib/services/auth.service'
import {
  createChannel,
  getAllChannel,
  getChannelByID,
} from '#/lib/services/channel.service'

export function useCreateChannel() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: createChannel,
    onSuccess: (data) => {
      // Save token to cookies
      //   navigate({ to: '/dashboard' })
      toast.success(data.message)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
export function useGetChannels(workspace_id: string | undefined) {
  return useQuery({
    queryKey: ['workspace-channel', workspace_id],
    queryFn: () =>
      getAllChannel({
        data: {
          workspace_id: workspace_id!,
        },
      }),
    enabled: Boolean(workspace_id),
  })
}
export function useGetChannel(
  workspace_id: string | undefined,
  channel_id: string | undefined,
) {
  return useQuery({
    queryKey: ['workspace-channel', workspace_id, channel_id],

    queryFn: () =>
      getChannelByID({
        data: {
          workspace_id: workspace_id!,
          channel_id: channel_id!,
        },
      }),

    enabled: Boolean(workspace_id && channel_id),
  })
}
