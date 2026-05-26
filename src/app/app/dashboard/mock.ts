// Mock dashboard data for the demo. Replaced by real Supabase queries in DD-85+.

export type DashboardMock = {
  totalSatang: number;
  bills: number;
  avgBillSatang: number;
  paymentSplit: { cash: number; promptpay: number; transfer: number; card: number; other: number };
  topSellers: Array<{ sku: string; name: string; qty: number; revenueSatang: number }>;
  inventoryRemaining: Array<{ sku: string; name: string; current: number; starting: number }>;
  hourly: Array<{ hour: number; today: number; prev: number }>;
  goal: { targetSatang: number; achievedSatang: number };
};

export const mockToday: DashboardMock = {
  totalSatang: 1_245_000,
  bills: 17,
  avgBillSatang: 73_235,
  paymentSplit: {
    cash: 620_000,
    promptpay: 380_000,
    transfer: 70_000,
    card: 175_000,
    other: 0,
  },
  topSellers: [
    { sku: "DEMO-001", name: "Canvas Tote", qty: 14, revenueSatang: 1_246_000 },
    { sku: "DEMO-002", name: "Soy Candle Set", qty: 28, revenueSatang: 532_000 },
    { sku: "DEMO-006", name: "Mini Snack Box", qty: 12, revenueSatang: 468_000 },
    { sku: "DEMO-003", name: "Sticker Pack Brown", qty: 35, revenueSatang: 315_000 },
  ],
  inventoryRemaining: [
    { sku: "DEMO-001", name: "Canvas Tote", current: 16, starting: 30 },
    { sku: "DEMO-002", name: "Soy Candle Set", current: 72, starting: 100 },
    { sku: "DEMO-003", name: "Sticker Pack Brown", current: 165, starting: 200 },
    { sku: "DEMO-004", name: "Ceramic Cup", current: 4, starting: 50 },
    { sku: "DEMO-005", name: "Linen Pouch Beige", current: 0, starting: 10 },
    { sku: "DEMO-008", name: "Travel Soap Bar", current: 9, starting: 12 },
  ],
  hourly: [
    { hour: 9, today: 50_000, prev: 30_000 },
    { hour: 10, today: 120_000, prev: 90_000 },
    { hour: 11, today: 185_000, prev: 110_000 },
    { hour: 12, today: 95_000, prev: 75_000 },
    { hour: 13, today: 110_000, prev: 80_000 },
    { hour: 14, today: 140_000, prev: 100_000 },
    { hour: 15, today: 220_000, prev: 150_000 },
    { hour: 16, today: 175_000, prev: 130_000 },
    { hour: 17, today: 90_000, prev: 70_000 },
    { hour: 18, today: 60_000, prev: 40_000 },
  ],
  goal: { targetSatang: 1_800_000, achievedSatang: 1_245_000 },
};
