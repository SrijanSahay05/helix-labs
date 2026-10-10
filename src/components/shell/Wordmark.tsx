import { BRAND } from '@/data/copy';

export function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <img src="/helix-logo.svg" alt={BRAND.name} className="h-7 w-auto" />
    </div>
  );
}
