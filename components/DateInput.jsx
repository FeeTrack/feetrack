'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

const isoToDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// Rejects impossible dates like 31/02/2026
const isValidIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

// Drop-in replacement for <input type="date"> that always shows dd/mm/yyyy.
// A native date input formats dates by the browser's language (often mm/dd/yyyy) and
// pages can't change that. Here the visible field is text in dd/mm/yyyy; a hidden native
// input carries the yyyy-mm-dd value for forms and provides the calendar picker.
// onChange receives { target: { name, value } } with value in yyyy-mm-dd, like a native input.
export default function DateInput({ name, value, onChange, min, max, required, className = '', id, disabled }) {
  const nativeRef = useRef(null);
  const [text, setText] = useState(isoToDisplay(value));

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const emit = (iso) => onChange?.({ target: { name, value: iso } });

  const handleTextChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.slice(0, 2)
      + (digits.length > 2 ? '/' + digits.slice(2, 4) : '')
      + (digits.length > 4 ? '/' + digits.slice(4) : '');
    setText(formatted);

    if (digits.length === 0) {
      emit('');
    } else if (digits.length === 8) {
      const iso = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
      if (isValidIso(iso)) emit(iso);
    }
  };

  const openPicker = () => {
    try {
      nativeRef.current?.showPicker();
    } catch {
      nativeRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={text}
        onChange={handleTextChange}
        onBlur={() => setText(isoToDisplay(value))}
        required={required}
        disabled={disabled}
        pattern="\d{2}/\d{2}/\d{4}"
        title="Date in dd/mm/yyyy format"
        className={`${className} pr-9`}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        tabIndex={-1}
        aria-label="Open calendar"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary disabled:opacity-50"
      >
        <Calendar className="w-4 h-4" />
      </button>
      <input
        ref={nativeRef}
        type="date"
        name={name}
        value={value || ''}
        min={min}
        max={max}
        onChange={(e) => emit(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-0 w-full opacity-0 pointer-events-none"
      />
    </div>
  );
}
