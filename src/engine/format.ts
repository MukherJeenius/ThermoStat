/** en-CA formatting rules for every figure the UI and the brief print (spec 8.1). */

export const NOT_IN_SOURCE = 'Not in source data';
const MINUS = '−';

/** Round to n significant figures (half away from zero on the decimal value). */
export function sig(x: number, n: number): number {
  if (x === 0 || !Number.isFinite(x)) return x;
  return Number(x.toPrecision(n));
}

function group(x: number, maxFraction = 0): string {
  return new Intl.NumberFormat('en-CA', { maximumFractionDigits: maxFraction, minimumFractionDigits: 0 }).format(x);
}

function fractionDigitsFor(v: number, n: number): number {
  if (v === 0) return 0;
  const mag = Math.floor(Math.log10(Math.abs(v)));
  return Math.max(0, n - 1 - mag);
}

/** A quantity at n significant figures with thousands separators. */
export function num(x: number | null | undefined, n = 3): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return NOT_IN_SOURCE;
  const v = sig(x, n);
  return group(v, fractionDigitsFor(v, n));
}

/** Tables, totals, the scale line and captions: ≥ $500,000 → "$2.16M"; smaller → 3 significant figures. */
export function money(x: number | null | undefined): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return NOT_IN_SOURCE;
  const sign = x < 0 ? MINUS : '';
  const a = Math.abs(x);
  if (a >= 500_000) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  return `${sign}$${num(a, 3)}`;
}

/** Prose: 2 significant figures, written after "about" ("about $2.2M", "about $150,000"). */
export function moneyProse(x: number): string {
  const a = Math.abs(x);
  const sign = x < 0 ? MINUS : '';
  if (a >= 500_000) {
    const m = sig(a / 1e6, 2);
    return `${sign}$${group(m, fractionDigitsFor(m, 2))}M`;
  }
  return `${sign}$${num(a, 2)}`;
}

/** Prose quantity: "about 980" (2 significant figures). The caller writes "about" and the unit. */
export function about(x: number): string {
  return num(x, 2);
}

/** Integer percentage with sign: 7.39 → "+7 %", −11.27 → "−11 %". */
export function pct(x: number): string {
  const r = Math.round(x);
  if (r === 0) return '0 %';
  return `${r > 0 ? '+' : MINUS}${Math.abs(r)} %`;
}

/** Integer percentage without sign, for "about 80 % less". */
export function pctAbs(x: number): string {
  return `${Math.abs(Math.round(x))} %`;
}

/** "31 Oct 2026" from an ISO date; null → "Not in source data". */
export function date(iso: string | null | undefined): string {
  if (!iso) return NOT_IN_SOURCE;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

export function orMissing<T>(v: T | null | undefined, f: (x: T) => string): string {
  return v === null || v === undefined ? NOT_IN_SOURCE : f(v);
}

/** Two-digit row numbers: 1 → "01". */
export function two(n: number): string {
  return String(n).padStart(2, '0');
}
