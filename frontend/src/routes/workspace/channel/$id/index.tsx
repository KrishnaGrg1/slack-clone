import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/channel/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workspace/channel/$id/"!</div>
}
