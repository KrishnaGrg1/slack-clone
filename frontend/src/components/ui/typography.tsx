import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Variant union ────────────────────────────────────────────────────────────

type TypographyVariant =
  // Display / headings  (DM Sans)
  | 'display' // 48px  300  −0.04em  lh 1.05  — hero only
  | 'h1' // 32px  400  −0.03em  lh 1.1   — page headings
  | 'h2' // 22px  400  −0.02em  lh 1.2   — section headings
  | 'h3' // 16px  500  −0.01em  lh 1.3   — card titles
  | 'h4' // 13px  500   0       lh 1.4   — inline / empty-state titles
  // Body  (Inter)
  | 'body-lg' // 15px  400   0       lh 1.7   — hero sub, landing desc
  | 'body' // 13px  400   0       lh 1.65  — general body
  | 'body-sm' // 11px  400   0       lh 1.6   — footer, legal
  // UI labels  (Inter)
  | 'label' // 11px  500  +0.01em  lh 1.4   — form labels
  | 'caption' // 10px  400   0       lh 1.5   — slugs, timestamps
  // Mono  (DM Mono)
  | 'overline' // 10px  500  +0.10em  uppercase — eyebrows, badges
  | 'code' // 12px  400   0       lh 1.55  — inline code

// ─── Props ───────────────────────────────────────────────────────────────────

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant
  /** Override the rendered HTML element while keeping the variant styles. */
  as?: React.ElementType
  children?: React.ReactNode
}

// ─── Element defaults ────────────────────────────────────────────────────────

function defaultElement(variant: TypographyVariant): React.ElementType {
  switch (variant) {
    case 'display':
      return 'h1'
    case 'h1':
      return 'h1'
    case 'h2':
      return 'h2'
    case 'h3':
      return 'h3'
    case 'h4':
      return 'h4'
    case 'overline':
    case 'label':
    case 'caption':
      return 'span'
    case 'code':
      return 'code'
    default:
      return 'p'
  }
}

// ─── Variant → Tailwind classes ──────────────────────────────────────────────
//
//  font-display  = DM Sans   (set in tailwind.config → theme.fontFamily.display)
//  font-sans     = Inter     (tailwind default)
//  font-mono     = DM Mono   (tailwind default or configured)
//
//  Color is intentionally NOT applied here — callers pass text-* classes.
//  The only exception is `overline` which is always amber by design.

function variantClasses(variant: TypographyVariant): string {
  switch (variant) {
    // ── Display / headings ────────────────────────────────────────────────
    case 'display':
      return 'font-display text-[48px] font-light leading-[1.05] tracking-[-0.04em]'

    case 'h1':
      return 'font-display text-[32px] font-normal leading-[1.1] tracking-[-0.03em]'

    case 'h2':
      return 'font-display text-[22px] font-normal leading-[1.2] tracking-[-0.02em]'

    case 'h3':
      return 'font-display text-[16px] font-medium leading-[1.3] tracking-[-0.01em]'

    case 'h4':
      return 'font-sans text-[13px] font-medium leading-[1.4] tracking-normal'

    // ── Body ──────────────────────────────────────────────────────────────
    case 'body-lg':
      return 'font-sans text-[15px] font-normal leading-[1.7] tracking-normal'

    case 'body':
      return 'font-sans text-[13px] font-normal leading-[1.65] tracking-normal'

    case 'body-sm':
      return 'font-sans text-[11px] font-normal leading-[1.6] tracking-normal'

    // ── UI labels ─────────────────────────────────────────────────────────
    case 'label':
      return 'font-sans text-[11px] font-medium leading-[1.4] tracking-[0.01em]'

    case 'caption':
      return 'font-sans text-[10px] font-normal leading-[1.5] tracking-normal'

    // ── Mono ──────────────────────────────────────────────────────────────
    case 'overline':
      return [
        'font-mono text-[10px] font-medium leading-none',
        'tracking-[0.1em] uppercase',
        'text-[#E8A838]', // amber is the only hard-coded color — it's a brand rule
      ].join(' ')

    case 'code':
      return [
        'font-mono text-[12px] font-normal leading-[1.55] tracking-normal',
        'rounded-md bg-[#111118] px-[0.3rem] py-[0.15rem]',
        'text-[#F5F0E8]',
      ].join(' ')

    default:
      return 'font-sans text-[13px] font-normal leading-[1.65] tracking-normal'
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body', as, children, ...props }, ref) => {
    const Tag = as ?? defaultElement(variant)
    return (
      <Tag
        ref={ref}
        className={cn(variantClasses(variant), className)}
        {...props}
      >
        {children}
      </Tag>
    )
  },
)

Typography.displayName = 'Typography'

export { Typography }
export type { TypographyProps, TypographyVariant }
