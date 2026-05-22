import { mockProducts } from "../pos/mock-data";
import { EventSetupClient } from "./EventSetupClient";

export default function EventsPage() {
  // Demo-mode MVP. Real `events` + `event_inventory` persistence (and the full
  // wizard: schedule, gift rules, staff) arrive with Supabase / a later wave.
  return <EventSetupClient fallbackProducts={mockProducts} />;
}
