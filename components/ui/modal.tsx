/**
 * Modal — Accessible dialog component for SAIL.
 *
 * Built on the native HTML <dialog> element for built-in accessibility:
 * focus trapping, ESC-to-close, and proper ARIA semantics come for free.
 * Styled with the SAIL glassmorphism design language for the panel,
 * and a semi-transparent backdrop overlay.
 *
 * Features:
 *   - Native <dialog> with showModal()/close() for proper modal behavior
 *   - Click-outside-to-close via backdrop click detection
 *   - ESC key closes automatically (native dialog behavior)
 *   - Optional title rendered as an h2 heading
 *   - Glass-styled panel with backdrop blur
 *
 * @example
 *   const [open, setOpen] = useState(false);
 *
 *   <Modal open={open} onClose={() => setOpen(false)} title="Confirm Action">
 *     <p>Are you sure you want to proceed?</p>
 *     <Button onClick={() => setOpen(false)}>Cancel</Button>
 *   </Modal>
 */
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/** Props accepted by the Modal component */
export interface ModalProps {
  /** Controls whether the dialog is open or closed */
  open: boolean;
  /** Callback fired when the modal should close (ESC, backdrop click, etc.) */
  onClose: () => void;
  /** Optional title displayed at the top of the modal */
  title?: string;
  /** Content rendered inside the modal panel */
  children: ReactNode;
  /** Additional CSS classes applied to the dialog panel */
  className?: string;
}

/**
 * Modal component — an accessible glassmorphism dialog.
 * Uses the native <dialog> element and controls it imperatively
 * via useEffect to keep it in sync with the `open` prop.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  /** Ref to the native <dialog> element for imperative control */
  const dialogRef = useRef<HTMLDialogElement>(null);

  /**
   * Sync the dialog's open/close state with the `open` prop.
   * showModal() is used instead of show() to get the modal overlay
   * behavior (backdrop, focus trap, inert background).
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  /**
   * Handle the native dialog "close" event.
   * This fires when ESC is pressed or dialog.close() is called,
   * ensuring the parent's state stays in sync.
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);

    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  /**
   * Handle click-outside-to-close.
   * When the user clicks the backdrop (the <dialog> element itself,
   * not its children), we close the modal. The check works because
   * the dialog's padding area is the backdrop in top-layer rendering.
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cn(
        /* Reset default dialog styles */
        'p-0 m-auto',
        'bg-transparent border-none',
        'max-w-lg w-full',
        /* Backdrop styling — semi-transparent dark overlay */
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        /* Open state animation */
        'open:animate-in open:fade-in-0 open:zoom-in-95',
      )}
    >
      {/* Glass-styled content panel */}
      <div
        className={cn(
          'rounded-2xl p-6',
          'bg-[var(--glass-bg)] backdrop-blur-md',
          'border border-[var(--glass-border)]',
          'shadow-[var(--glass-shadow)]',
          'text-foreground',
          className
        )}
      >
        {/* Title — rendered as h2 when provided */}
        {title && (
          <h2 className="mb-4 text-lg font-semibold leading-tight">
            {title}
          </h2>
        )}

        {/* Modal body content */}
        {children}
      </div>
    </dialog>
  );
}
