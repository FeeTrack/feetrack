import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Shared building blocks for the full-page student and staff forms

export const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-100 read-only:bg-gray-50 read-only:text-gray-500';

export function Field({ label, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-3">
        <CardTitle className="text-base font-bold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">{children}</CardContent>
    </Card>
  );
}
