import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createWorkspace, inviteWorkspace, joinWorkspace } from '#/lib/services/workspace.service'

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

export function useInviteWorkspace() {
  return useMutation({
    mutationFn: inviteWorkspace,
    onSuccess: (data) => {
      toast.success('Workspace invited successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

export function useJoinWorkspace() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (id: string) => joinWorkspace({ data: { id } }),
    onSuccess: (data) => {
      toast.success(data.message)
      navigate({ to: `/workspace/$slug`, params: { slug: data.data.workspace.slug } })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}