import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/workspace/channel/$id/thread/$threadID/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workspace/channel/$id/thread/$threadID/"!</div>
}
