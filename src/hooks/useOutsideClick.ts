import { useEffect, useRef, RefObject } from 'react';

export function useOutsideClick(ref: RefObject<HTMLElement | null>, onClose: () => void, active: boolean) {
  // Keeping the latest onClose in a ref (instead of putting it in the
  // effect's dependency array) means this listener only gets attached and
  // removed when `active` actually flips — not on every render where the
  // caller passes a fresh inline arrow function. Re-subscribing the
  // listener on every render created a real window where a click could
  // land between the old listener being removed and the new one being
  // attached, silently swallowing it.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [active, ref]);
}
