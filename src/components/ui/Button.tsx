import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const V: Record<Variant, string> = {
  primary: 'border border-accent bg-accent text-on-accent hover:border-accent-hover hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface2',
  ghost: 'border border-transparent text-ink2 hover:bg-surface2 hover:text-ink',
  danger: 'border border-fail/25 bg-[var(--fail-soft)] text-fail hover:brightness-[0.97]',
  quiet: 'border border-line bg-surface text-ink2 hover:border-accent hover:text-ink',
};
const S: Record<Size, string> = {
  sm: 'h-[30px] px-2.5 text-xs gap-1.5',
  md: 'h-[38px] px-4 text-[13px] gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  ({ variant = 'secondary', size = 'md', className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium outline-none transition-colors focus-visible:shadow-glow disabled:pointer-events-none disabled:opacity-45',
        V[variant],
        S[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
