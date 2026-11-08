"use client";
import { useEffect, useRef } from "react";

// A lightweight dialog hook for modals: moves initial focus into the dialog,
// traps Tab/Shift+Tab within it, closes on Escape, and restores focus to the
// element that opened the dialog when it closes.
//
// We deliberately do not use the native <dialog> element because it conflicts
// with Tailwind styling for backdrop/overlay layouts already used in this
// app. This hook implements the same behavior on an ordinary <div>.
export function useDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  // Callers pass an inline onClose; keep the latest in a ref so a re-render
  // while the dialog is open doesn't re-run the effect (which would bounce
  // focus out to the trigger and back to the first field).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    if (dialog) {
      // Focus the first focusable element so keyboard users land inside.
      const first = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (first ?? dialog).focus();
    }

    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.closest("[inert]") && el.getClientRects().length > 0);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement;

      // Focus is on the container or has escaped (e.g. a click on the
      // backdrop): bring it back to the first or last control.
      if (active === dialog || !dialog.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevBodyOverflow;
      // Return focus to wherever the user was before opening the dialog.
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  return dialogRef;
}
