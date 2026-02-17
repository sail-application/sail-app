'use client';

import type { Invoice } from '@/types/database';

interface InvoiceListProps {
  invoices: Invoice[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-semibold text-white mb-4">
        Invoice History
      </h2>
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0">
            <div>
              <p className="text-white font-medium">
                ${(invoice.amount_paid / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm capitalize ${invoice.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                {invoice.status}
              </span>
              {invoice.invoice_pdf && (
                <a
                  href={invoice.invoice_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
