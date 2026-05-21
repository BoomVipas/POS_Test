import "server-only";
import type { Database } from "@/lib/database.types";

type Application = Database["public"]["Tables"]["applications"]["Row"];

export function renderNewApplicationEmail(app: Application) {
  const subject = `New pilot application — ${app.brand_name}`;
  const html = `
    <div style="font-family:Aptos,'Segoe UI',sans-serif;background:#f7f5fb;padding:24px;color:#1c1838">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5dff0;border-radius:20px;padding:24px">
        <h1 style="font-family:Georgia,serif;font-size:22px;color:#2a2557;margin:0 0 16px">
          New pilot application
        </h1>
        <p style="margin:0 0 12px"><strong>Brand:</strong> ${escape(app.brand_name)}</p>
        <p style="margin:0 0 12px"><strong>Owner:</strong> ${escape(app.owner_name)}</p>
        <p style="margin:0 0 12px"><strong>Email:</strong> ${escape(app.email)}</p>
        <p style="margin:0 0 12px"><strong>Phone:</strong> ${escape(app.phone)}</p>
        <p style="margin:0 0 12px"><strong>Category:</strong> ${escape(app.product_category)}</p>
        ${app.social_link ? `<p style="margin:0 0 12px"><strong>Social:</strong> ${escape(app.social_link)}</p>` : ""}
        ${app.num_skus != null ? `<p style="margin:0 0 12px"><strong># SKUs:</strong> ${app.num_skus}</p>` : ""}
        ${app.events_per_year != null ? `<p style="margin:0 0 12px"><strong>Events/year:</strong> ${app.events_per_year}</p>` : ""}
        ${app.message ? `<p style="margin:0 0 12px"><strong>Message:</strong><br>${escape(app.message)}</p>` : ""}
        <hr style="border:none;border-top:1px solid #e5dff0;margin:18px 0">
        <p style="font-size:12px;color:#6b6489;margin:0">
          Review at /admin/applications.
        </p>
      </div>
    </div>
  `;
  return { subject, html };
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
