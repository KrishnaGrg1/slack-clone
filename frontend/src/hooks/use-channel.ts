import { redirect, useNavigate  } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { login, register } from '#/lib/services/auth.service'
import { createChannel } from '#/lib/services/channel.service'



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
