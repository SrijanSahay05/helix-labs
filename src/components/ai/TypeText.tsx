import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { useUI } from '@/store/ui';
import { prefersReducedMotion } from '@/lib/motion';

/** Remembers which texts have already typed so revisits render instantly. */
const typedOnce = new Set<string>();

export function renderInline(text: string, onCite?: (n: number) => void, boldClass = 'font-semibold text-ink', onBold?: (t: string) => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[\d+\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('**')) {
      const inner = tok.slice(2, -2);
      out.push(
        onBold ? (
          <button key={k++} type="button" onClick={() => onBold(inner)} className={`${boldClass} rounded px-0.5 underline decoration-accent/40 decoration-dotted underline-offset-4 hover:bg-accent-soft`}>
            {inner}
          </button>
        ) : (
          <strong key={k++} className={boldClass}>
            {inner}
          </strong>
        ),
      );
    }
    else {
      const n = Number(tok.slice(1, -1));
      out.push(
        <button
          key={k++}
          type="button"
          onClick={() => onCite?.(n)}
          className="mx-[1px] -translate-y-1 rounded px-0.5 align-baseline font-mono text-[10px] font-semibold text-accent hover:bg-accent-soft"
        >
          [{n}]
        </button>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last).replace(/\*\*?$/, '')}</Fragment>);
  return out;
}

export function Markdown({ text, onCite, onBold, caret, className }: { text: string; onCite?: (n: number) => void; onBold?: (t: string) => void; caret?: boolean; className?: string }) {
  // close an unterminated bold so partial text still renders cleanly
  const stars = (text.match(/\*\*/g) ?? []).length;
  const safe = stars % 2 ? `${text}**` : text;
  const lines = safe.split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: number) => {
    if (list.length) {
      blocks.push(
        <ul key={`l${key}`} className="my-1 list-disc space-y-0.5 pl-5">
          {list.map((li, i) => (
            <li key={i}>{renderInline(li, onCite, undefined, onBold)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  lines.forEach((l, i) => {
    if (/^\s*[-•]\s+/.test(l)) list.push(l.replace(/^\s*[-•]\s+/, ''));
    else {
      flush(i);
      if (l.trim()) blocks.push(<p key={i} className="my-0.5">{renderInline(l, onCite, undefined, onBold)}</p>);
    }
  });
  flush(lines.length);
  return (
    <div className={className}>
      {blocks}
      {caret && <span className="caret">▍</span>}
    </div>
  );
}

export function TypeText({
  text,
  speed = 1,
  instant,
  onDone,
  onCite,
  className,
  id,
  inline,
}: {
  text: string;
  speed?: number;
  instant?: boolean;
  onDone?: () => void;
  onCite?: (n: number) => void;
  className?: string;
  /** stable key — if this text already typed once, show it instantly */
  id?: string;
  inline?: boolean;
}) {
  const demo = useUI((s) => s.speed);
  const key = id ?? text;
  const skip = instant || demo === 'instant' || prefersReducedMotion() || typedOnce.has(key);
  const [n, setN] = useState(skip ? text.length : 0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (skip) {
      setN(text.length);
      typedOnce.add(key);
      doneRef.current?.();
      return;
    }
    setN(0);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const factor = (typeof demo === 'number' ? demo : 1) * speed;
    const tick = () => {
      // type in small chunks so long briefs finish quickly
      i = Math.min(text.length, i + (text.length > 240 ? 3 : 1));
      setN(i);
      if (i >= text.length) {
        typedOnce.add(key);
        doneRef.current?.();
        return;
      }
      timer = setTimeout(tick, (18 + Math.random() * 10 - 4) / factor);
    };
    timer = setTimeout(tick, 60);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, skip]);

  const shown = text.slice(0, n);
  const typing = n < text.length;
  if (inline)
    return (
      <span className={className}>
        {renderInline(shown, onCite)}
        {typing && <span className="caret">▍</span>}
      </span>
    );
  return <Markdown text={shown} onCite={onCite} caret={typing} className={className} />;
}

/** Number that counts up instead of typing (400 ms). */
export function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return setV(value);
    const start = performance.now();
    const from = 0;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 400);
      setV(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{v.toFixed(decimals)}</span>;
}
