/** Inline SVG icons (spec 9.17): 16 × 16, stroke 1.5, round caps; the accessible name lives on the parent control. */
import type { ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="ts-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const ChevronRight = () => <Icon><path d="M6 3.5 10.5 8 6 12.5" /></Icon>;
export const ChevronLeft = () => <Icon><path d="M10 3.5 5.5 8 10 12.5" /></Icon>;
export const External = () => <Icon><path d="M5.5 3.5h7v7M12.5 3.5l-9 9" /></Icon>;
export const Plus = () => <Icon><path d="M8 3v10M3 8h10" /></Icon>;
export const Minus = () => <Icon><path d="M3 8h10" /></Icon>;
export const Close = () => <Icon><path d="M4 4l8 8M12 4l-8 8" /></Icon>;
export const Search = () => <Icon><circle cx="7" cy="7" r="4.25" /><path d="M10.25 10.25 13.5 13.5" /></Icon>;
export const Menu = () => <Icon><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" /></Icon>;
export const Reset = () => <Icon><circle cx="8" cy="8" r="4.5" /><path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" /></Icon>;
