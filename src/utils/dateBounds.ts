// Input: "YYYY-MM-DD" from <input type="date"> interpreted as LOCAL date (Africa/Douala côté poste user)
// Output: ISO UTC strings with inclusive day bounds.
export function dayBoundsUtc(dateYYYYMMDD: string) {
  const [y, m, d] = dateYYYYMMDD.split("-").map(Number);
  const startLocal = new Date(y, m - 1, d, 0, 0, 0, 0);
  const endLocal = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { startIso: startLocal.toISOString(), endIso: endLocal.toISOString() };
}

export function dateTimeIsoOrThrow(v: string) {
  const dt = new Date(v);
  if (Number.isNaN(dt.getTime())) throw new Error("Invalid date");
  return dt.toISOString();
}