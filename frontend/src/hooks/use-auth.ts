import { redirect, useNavigate  } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { login, register } from '#/lib/services/auth.service'

export function useLogin() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Save token to cookies
        navigate({ to: '/dashboard' })
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
    onSuccess: (data) => {
      // Save token to cookies
        navigate({ to: '/dashboard' })
      toast.success('Register successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
