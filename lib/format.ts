export function formatMoney(cents: number | null | undefined, currency = "USD") {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatPercent(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

export function formatRelativeDate(iso: string | null | undefined) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function parseDims(dims: Record<string, unknown> | null | undefined) {
  if (!dims) return null;
  const l = dims.length ?? dims.l;
  const w = dims.width ?? dims.w;
  const h = dims.height ?? dims.h;
  const unit = (dims.unit as string) ?? "cm";
  if (l == null && w == null && h == null) return null;
  return [l, w, h].filter((v) => v != null && v !== "").join(" × ") + ` ${unit}`;
}
