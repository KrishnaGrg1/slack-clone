import { Menu } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '#/components/ui/sidebar'

export default function SidebarToggle() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      className="h-8 w-8 text-[#7A7890] hover:bg-[#16161F] hover:text-[#F5F0E8]"
    >
      <Menu className="h-4 w-4" />
    </Button>
  )
}
