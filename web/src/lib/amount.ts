const MAX_U64 = 18446744073709551615n;

export function parseUint64Input(s: string): bigint | null {
  const t = s.trim();
  if (!/^\d+$/.test(t)) return null;
  const v = BigInt(t);
  if (v < 0n || v > MAX_U64) return null;
  return v;
}
