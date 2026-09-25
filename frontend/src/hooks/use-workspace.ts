import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createWorkspace } from '#/lib/services/workspace.service'

export function useCreateWorkspace() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: (data) => {
      // Save token to cookies
      navigate({ to: `/workspace/${data.id}` })
      toast.success('Workspace created successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
