export const daysBetween = (a: string, b: string): number =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const addDays = (date: string, days: number): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export const fmt = (d: string): string =>
  new Date(d + "T00:00:00").toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });

export const todayStr = (): string => new Date().toISOString().split("T")[0];

export const initials = (name: string): string =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

export const nowISO = (): string => new Date().toISOString();

export const timeAgo = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)         return "just now";
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2)  return "yesterday";
  if (diff < 86400 * 7)  return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}w ago`;
  return fmt(iso.split("T")[0]);
};

export const isRecent = (iso: string | undefined, hours = 24): boolean =>
  Boolean(iso && (Date.now() - new Date(iso).getTime()) < hours * 3600 * 1000);
