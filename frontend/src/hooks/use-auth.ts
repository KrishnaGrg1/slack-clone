import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { login, logoutFn, register } from '#/lib/services/auth.service'

export function useLogin() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: '/workspace' })
      toast.success('Login successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate({ to: '/workspace' })
      toast.success('Register successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}


export function useLogOut() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: logoutFn,

    onSuccess: async () => {
      toast.success('Logged out successfully')
      await navigate({ to: '/' })
    },

    onError: (err: Error) => {
      toast.error(err.message || 'Failed to log out')
    },
  })
}