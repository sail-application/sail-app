/**
 * components/features/strategies/admin/form-fields.tsx
 *
 * Client Component — small reusable form field helpers for admin forms.
 * Extracted from methodology-form.tsx to keep files under 200 lines.
 */

'use client';

/** Glass-styled select dropdown */
export function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl bg-white/5 border border-[var(--glass-border)] px-3 text-sm text-foreground">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/** Glass-styled textarea */
export function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full rounded-xl bg-white/5 border border-[var(--glass-border)] px-4 py-2 text-sm text-foreground" />
    </div>
  );
}
