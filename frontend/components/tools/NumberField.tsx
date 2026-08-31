'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A numeric input you can type into.
 *
 * The previous version bound `value={someNumber.toFixed(1)}`, which rewrote the
 * field on every keystroke. Clearing it and typing "8" immediately became "8.0"
 * with the caret after the zero, so the next digit produced "8.08". The only way
 * to reach a value was the spinner arrows.
 *
 * The fix is to keep what the visitor typed in local state while the field has
 * focus, push a parsed number upward only when it parses, and reformat on blur.
 * External changes (switching kg to lb) resync the text, but only while the
 * field is not being edited, so unit conversion still works without fighting
 * the caret.
 */
export default function NumberField({
  value,
  onCommit,
  decimals = 1,
  id,
  className = 'field',
  ...rest
}: {
  /** Display value, already converted to the unit being shown. */
  value: number;
  /** Receives the parsed display value; the caller converts back if needed. */
  onCommit: (next: number) => void;
  decimals?: number;
  id?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onCommit'>) {
  const format = (n: number) => (Number.isFinite(n) ? n.toFixed(decimals) : '');
  const [text, setText] = useState(() => format(value));
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setText(format(value));
    // format is derived from `decimals`, which is included below.
  }, [value, decimals]);

  return (
    <input
      {...rest}
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={className}
      value={text}
      onFocus={() => { editing.current = true; }}
      onChange={(e) => {
        // Allow anything that is on the way to a number, including "", "8" and
        // "88." mid-typing. Rejecting those is what made the field unusable.
        const next = e.target.value.replace(',', '.');
        if (next !== '' && !/^\d*\.?\d*$/.test(next)) return;
        setText(next);
        const parsed = Number.parseFloat(next);
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
      onBlur={() => {
        editing.current = false;
        const parsed = Number.parseFloat(text);
        if (Number.isFinite(parsed)) {
          onCommit(parsed);
          setText(format(parsed));
        } else {
          setText(format(value));
        }
      }}
    />
  );
}
