export function isOdd(n: number): boolean {
  return !isEven(n);
}

export function isEven(n: number): boolean {
  return n % 2 === 0;
}
