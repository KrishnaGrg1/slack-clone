import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$slug/dm/$userId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workspace/dm/$userId"!</div>
}
