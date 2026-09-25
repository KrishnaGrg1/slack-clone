export function Footer() {
  return (
    <footer className="border-t border-[#2A2A3A] px-6 py-10 max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
      <span className="font-display text-base font-semibold text-[#7A7890] tracking-tight">
        Thread<span className="text-[#E8A838]">Call</span>
      </span>
      <nav className="flex gap-6" aria-label="Footer">
        {[
          { label: 'Privacy policy', href: '#' },
          { label: 'Terms of use', href: '#' },
          {
            label: 'GitHub',
            href: 'https://github.com/KrishnaGrg1/slack-clone',
          },
        ].map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="text-xs text-[#7A7890] hover:text-[#F5F0E8] transition-colors duration-400 no-underline"
          >
            {l.label}
          </a>
        ))}
      </nav>
      <span className="text-xs text-[#4A4860]">
        © 2026 Krishna Bahadur Gurung
      </span>
    </footer>
  )
}
