export const daysBetween = (a, b) =>
  Math.round((new Date(b) - new Date(a)) / 86400000);

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });

export const todayStr = () => new Date().toISOString().split("T")[0];

export const initials = (name) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
