import AuthPage from '#/components/auth/login'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/')({
  component: AuthPage,
})
