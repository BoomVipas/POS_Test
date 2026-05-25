// Convert a Thailand-timezone day range (YYYY-MM-DD, inclusive) into UTC-aware
// ISO bounds for querying the timestamptz `orders.created_at`. +07:00 =
// Asia/Bangkok, so a "TH day" maps to the correct instant window regardless of
// where the row was stored. Pure → unit-tested without a DB.
export function rangeToWindow(range: {
  startDate: string;
  endDate: string;
}): { startISO: string; endISO: string } {
  return {
    startISO: `${range.startDate}T00:00:00.000+07:00`,
    endISO: `${range.endDate}T23:59:59.999+07:00`,
  };
}
