import { createContext, useContext, ReactNode } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invoice } from '../lib/mockData';

interface InvoiceContextType {
  createInvoice: (data: { bookingId: string; parentId: string; coachId: string }) => Promise<Invoice>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider');
  return ctx;
}

const COUNTER_REF_PATH = ['settings', 'invoiceCounter'] as const;

export function InvoiceProvider({ children }: { children: ReactNode }) {
  // Atomically reads the last invoice number, increments it, and writes the
  // new invoice — all inside one Firestore transaction, so two payments
  // confirmed at the same moment can never end up with the same invoice
  // number (a real risk with a plain read-then-write).
  const createInvoice = async (data: { bookingId: string; parentId: string; coachId: string }): Promise<Invoice> => {
    const counterRef = doc(db, ...COUNTER_REF_PATH);
    const invoiceId = `invoice_${Date.now()}`;
    const invoiceRef = doc(db, 'invoices', invoiceId);

    const invoiceNumber = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      const lastNumber = counterSnap.exists() ? (counterSnap.data().lastNumber as number) || 0 : 0;
      const nextNumber = lastNumber + 1;
      const formatted = `INV-${String(nextNumber).padStart(4, '0')}`;

      transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });
      transaction.set(invoiceRef, {
        id: invoiceId,
        invoiceNumber: formatted,
        bookingId: data.bookingId,
        parentId: data.parentId,
        coachId: data.coachId,
        createdAt: new Date().toISOString(),
      });

      return formatted;
    });

    return {
      id: invoiceId,
      invoiceNumber,
      bookingId: data.bookingId,
      parentId: data.parentId,
      coachId: data.coachId,
      createdAt: new Date().toISOString(),
    };
  };

  return (
    <InvoiceContext.Provider value={{ createInvoice }}>
      {children}
    </InvoiceContext.Provider>
  );
}
