/** Icons: vendored from Lucide (lucide-static 0.469.0, ISC licence; see src/ui/icons.LICENSE). 24 × 24 grid, drawn at
 *  16 px by default with stroke 1.75 and round caps; the accessible name lives on the parent control. */
import type { ReactNode } from 'react';

function Icon({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg className="ts-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const ChevronRight = ({ size }: { size?: number }) => <Icon size={size}><path d="m9 18 6-6-6-6" /></Icon>;
export const ChevronLeft = ({ size }: { size?: number }) => <Icon size={size}><path d="m15 18-6-6 6-6" /></Icon>;
export const External = ({ size }: { size?: number }) => <Icon size={size}><path d="M7 7h10v10" /> <path d="M7 17 17 7" /></Icon>;
export const ArrowRight = ({ size }: { size?: number }) => <Icon size={size}><path d="M5 12h14" /> <path d="m12 5 7 7-7 7" /></Icon>;
export const Plus = ({ size }: { size?: number }) => <Icon size={size}><path d="M5 12h14" /> <path d="M12 5v14" /></Icon>;
export const Minus = ({ size }: { size?: number }) => <Icon size={size}><path d="M5 12h14" /></Icon>;
export const Close = ({ size }: { size?: number }) => <Icon size={size}><path d="M18 6 6 18" /> <path d="m6 6 12 12" /></Icon>;
export const Search = ({ size }: { size?: number }) => <Icon size={size}><circle cx="11" cy="11" r="8" /> <path d="m21 21-4.3-4.3" /></Icon>;
export const Menu = ({ size }: { size?: number }) => <Icon size={size}><line x1="4" x2="20" y1="12" y2="12" /> <line x1="4" x2="20" y1="6" y2="6" /> <line x1="4" x2="20" y1="18" y2="18" /></Icon>;
export const Reset = ({ size }: { size?: number }) => <Icon size={size}><line x1="2" x2="5" y1="12" y2="12" /> <line x1="19" x2="22" y1="12" y2="12" /> <line x1="12" x2="12" y1="2" y2="5" /> <line x1="12" x2="12" y1="19" y2="22" /> <circle cx="12" cy="12" r="7" /> <circle cx="12" cy="12" r="3" /></Icon>;
export const MapIcon = ({ size }: { size?: number }) => <Icon size={size}><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /> <path d="M15 5.764v15" /> <path d="M9 3.236v15" /></Icon>;
export const Flame = ({ size }: { size?: number }) => <Icon size={size}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></Icon>;
export const Building = ({ size }: { size?: number }) => <Icon size={size}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /> <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /> <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /> <path d="M10 6h4" /> <path d="M10 10h4" /> <path d="M10 14h4" /> <path d="M10 18h4" /></Icon>;
export const Factory = ({ size }: { size?: number }) => <Icon size={size}><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /> <path d="M17 18h1" /> <path d="M12 18h1" /> <path d="M7 18h1" /></Icon>;
export const FileText = ({ size }: { size?: number }) => <Icon size={size}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /> <path d="M14 2v4a2 2 0 0 0 2 2h4" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" /></Icon>;
export const ListChecks = ({ size }: { size?: number }) => <Icon size={size}><path d="m3 17 2 2 4-4" /> <path d="m3 7 2 2 4-4" /> <path d="M13 6h8" /> <path d="M13 12h8" /> <path d="M13 18h8" /></Icon>;
export const BookOpen = ({ size }: { size?: number }) => <Icon size={size}><path d="M12 7v14" /> <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></Icon>;
export const Layers = ({ size }: { size?: number }) => <Icon size={size}><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /> <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /> <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" /></Icon>;
export const Bookmark = ({ size }: { size?: number }) => <Icon size={size}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></Icon>;
export const BookmarkCheck = ({ size }: { size?: number }) => <Icon size={size}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" /> <path d="m9 10 2 2 4-4" /></Icon>;
export const Printer = ({ size }: { size?: number }) => <Icon size={size}><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /> <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" /> <rect x="6" y="14" width="12" height="8" rx="1" /></Icon>;
export const NotebookPen = ({ size }: { size?: number }) => <Icon size={size}><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" /> <path d="M2 6h4" /> <path d="M2 10h4" /> <path d="M2 14h4" /> <path d="M2 18h4" /> <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></Icon>;
export const Info = ({ size }: { size?: number }) => <Icon size={size}><circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" /></Icon>;
export const Route = ({ size }: { size?: number }) => <Icon size={size}><circle cx="6" cy="19" r="3" /> <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /> <circle cx="18" cy="5" r="3" /></Icon>;
export const Play = ({ size }: { size?: number }) => <Icon size={size}><polygon points="6 3 20 12 6 21 6 3" /></Icon>;
export const CircleHelp = ({ size }: { size?: number }) => <Icon size={size}><circle cx="12" cy="12" r="10" /> <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /> <path d="M12 17h.01" /></Icon>;
