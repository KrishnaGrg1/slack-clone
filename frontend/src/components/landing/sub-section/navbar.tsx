import { Button } from '#/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '#/components/ui/navigation-menu'
import { cn } from '#/lib/utils'
import { useEffect, useState } from 'react'

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 px-6 py-3 rounded-full border transition-all duration-700',
        'backdrop-blur-xl bg-[#0A0A0F]/80 border-[#2A2A3A]',
        scrolled && 'shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <a
        href="/"
        className="font-display text-lg font-semibold text-[#F5F0E8] tracking-tight no-underline"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Thread<span className="text-[#E8A838]">Call</span>
      </a>

      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList className="gap-1">
          {['Problem', 'How it works', 'Tech', 'FAQ'].map((item) => (
            <NavigationMenuItem key={item}>
              <NavigationMenuLink
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-3 py-1.5 text-sm text-[#7A7890] hover:text-[#F5F0E8] transition-colors duration-500 rounded-md no-underline"
              >
                {item}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <Button
        size="sm"
        className="rounded-full bg-[#E8A838] hover:bg-[#F0B848] text-[#0A0A0F] font-semibold text-sm px-4 py-2 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(232,168,56,0.3)] active:scale-[0.98]"
      >
        <a href="#cta">Get early access</a>
      </Button>
    </nav>
  )
}
