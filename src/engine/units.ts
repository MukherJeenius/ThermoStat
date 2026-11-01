/** Financial and table helpers shared by the cost engine (spec 8.1). */

/** Capital recovery factor: r / (1 − (1 + r)^−years). */
export function crf(r: number, years: number): number {
  if (r === 0) return 1 / years;
  return r / (1 - Math.pow(1 + r, -years));
}

/** AF = Σ_{t=1..years} 1 / (1 + r)^t. */
export function annuityFactor(r: number, years = 20): number {
  let sum = 0;
  for (let t = 1; t <= years; t++) sum += 1 / Math.pow(1 + r, t);
  return sum;
}

/** Linear between table years, held flat outside them. */
export function interpolateByYear(table: Record<string, number>, year: number): number {
  const years = Object.keys(table)
    .map(Number)
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => a - b);
  if (years.length === 0) throw new Error('empty year table');
  if (year <= years[0]) return table[String(years[0])];
  const last = years[years.length - 1];
  if (year >= last) return table[String(last)];
  for (let i = 0; i < years.length - 1; i++) {
    const a = years[i];
    const b = years[i + 1];
    if (year >= a && year <= b) {
      const va = table[String(a)];
      const vb = table[String(b)];
      return va + ((vb - va) * (year - a)) / (b - a);
    }
  }
  return table[String(last)];
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
