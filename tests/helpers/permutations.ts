/** Heap's algorithm: calls `visit` with every permutation of 0..n-1 (the array is reused). */
export function forEachPermutation(n: number, visit: (p: readonly number[]) => void): void {
  const a = Array.from({ length: n }, (_, i) => i);
  const c = new Array<number>(n).fill(0);
  visit(a);
  let i = 1;
  while (i < n) {
    if (c[i]! < i) {
      const j = i % 2 === 0 ? 0 : c[i]!;
      [a[j], a[i]] = [a[i]!, a[j]!];
      visit(a);
      c[i]!++;
      i = 1;
    } else {
      c[i] = 0;
      i++;
    }
  }
}
