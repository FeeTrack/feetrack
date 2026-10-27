'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="primary-btn px-4 py-2">
      <span className="flex items-center gap-2">
        <Printer className="w-4 h-4" /> Print
      </span>
    </button>
  );
}
