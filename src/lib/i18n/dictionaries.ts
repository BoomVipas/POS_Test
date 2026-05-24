import type { Lang } from "./types";

// One source of truth for every UI string. Keys are stable; values are
// per-language. Add new keys here and TS will require both languages to fill
// them in. Translations into Thai aim for booth-seller register: warm,
// concrete, low formality.

export type Dict = {
  common: {
    cancel: string;
    save: string;
    back: string;
    home: string;
    next: string;
    confirm: string;
    delete: string;
    edit: string;
    add: string;
    remove: string;
    close: string;
    search: string;
    all: string;
    loading: string;
    demoMode: string;
    print: string;
    export: string;
    tryAgain: string;
    workspaceErrorTitle: string;
    workspaceErrorBody: string;
  };
  chrome: {
    pos: string;
    products: string;
    dashboard: string;
    sendLater: string;
    corrections: string;
    auditLog: string;
    settings: string;
    appHome: string;
  };
  landing: {
    kicker: string;
    title1: string;
    title2: string;
    body: string;
    ctaApply: string;
    ctaStatus: string;
    feature1Title: string;
    feature1Body: string;
    feature2Title: string;
    feature2Body: string;
    feature3Title: string;
    feature3Body: string;
    feature4Title: string;
    feature4Body: string;
    footer: string;
  };
  apply: {
    kicker: string;
    title: string;
    body: string;
    fieldName: string;
    fieldPhone: string;
    fieldEmail: string;
    fieldBrand: string;
    fieldCategory: string;
    fieldSocial: string;
    fieldNumSkus: string;
    fieldEventsPerYear: string;
    fieldMessage: string;
    submit: string;
    submitting: string;
    waitNote: string;
    successTitle: string;
    successBody: string;
    statusTitle: string;
    statusBody: string;
  };
  appHome: {
    title: string;
    subtitle: string;
    tilePosTitle: string;
    tilePosBody: string;
    tileProductsTitle: string;
    tileProductsBody: string;
    tileDashboardTitle: string;
    tileDashboardBody: string;
    tileSendLaterTitle: string;
    tileSendLaterBody: string;
    tileCorrectionsTitle: string;
    tileCorrectionsBody: string;
    tileAuditLogTitle: string;
    tileAuditLogBody: string;
    tileSettingsTitle: string;
    tileSettingsBody: string;
  };
  pos: {
    cart: string;
    emptyCart: string;
    subtotal: string;
    shippingSendLater: string;
    discount: string;
    total: string;
    ctaAddProduct: string;
    ctaPickPayment: string;
    ctaFillSendLater: string;
    ctaReview: string;
    clear: string;
    methodCash: string;
    methodPromptPay: string;
    methodTransfer: string;
    methodCard: string;
    methodOther: string;
    takeNow: string;
    sendLater: string;
    customerHeading: string;
    customerHint: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    customerMissing: string;
    searchPlaceholder: string;
    noMatch: string;
    soldOut: string;
    reviewSale: string;
    reviewConfirm: string;
    reviewSaved: string;
    receiptScanWith: string;
    receiptScanAgain: string;
    paymentMethodLabel: string;
    returningCustomer: string;
    ordersCount: (n: number) => string;
    lastSeen: string;
    autofillCustomer: string;
    amountTendered: string;
    exact: string;
    changeDue: string;
    addNote: string;
    notePlaceholder: string;
    splitPayment: string;
    singlePayment: string;
    addSplit: string;
    splitRemaining: string;
    splitOver: string;
    splitNegative: string;
    splitsCount: (n: number) => string;
    loyaltyPointsAvailable: (n: number) => string;
    loyaltyPointsLifetime: (n: number) => string;
    loyaltyEarnsPoints: (n: number) => string;
    customerNotesHeader: string;
    customerTags: string;
    addCustomTag: string;
    customerNotePlaceholder: string;
    upsellHeader: string;
    upsellAdd: string;
    activityFeedHeader: string;
    forecastSold: (qty: number, days: number) => string;
    forecastSuggestRestock: (qty: number) => string;
  };
  preOrders: {
    title: string;
    body: string;
    demoNote: string;
    formTitle: string;
    formBody: (productName: string) => string;
    fQty: string;
    fName: string;
    fPhone: string;
    fEmail: string;
    fNote: string;
    fNotePlaceholder: string;
    save: string;
    captured: string;
    statusPending: string;
    statusNotified: string;
    statusFulfilled: string;
    statusCancelled: string;
    markNotified: string;
    markFulfilled: string;
    markCancelled: string;
    soldOutCta: string;
    chromeLink: string;
  };
  qrMenu: {
    title: string;
    body: string;
    cartEmpty: string;
    addSomething: string;
    nameRequired: string;
    nameRequiredHint: string;
    submitOrder: string;
    submitTitle: string;
    submitBody: string;
    fName: string;
    fNamePlaceholder: string;
    generateCode: string;
    claimReady: string;
    showAtBooth: (name: string) => string;
    startOver: string;
    noCatalogTitle: string;
    noCatalogBody: string;
    importHeader: string;
    importBody: string;
    importCta: string;
    codeFormat: string;
    codeNotFound: string;
    replaceCart: string;
    imported: (name: string) => string;
    importedBody: (n: number) => string;
    openClaims: (n: number) => string;
  };
  setupProducts: {
    title: string;
    body: string;
    demoNote: string;
    emptyTitle: string;
    emptyBody: string;
    addProduct: string;
    loadSample: string;
    tryDemo: string;
    openPos: string;
    countSummary: string;
    activeSuffix: string;
    formAdd: string;
    formEdit: string;
    fSku: string;
    fSkuLocked: string;
    fName: string;
    fCategory: string;
    fPrice: string;
    fShippingFee: string;
    fStartingQty: string;
    fSendLater: string;
    fSendLaterHint: string;
    fImage: string;
    fImageNoFile: string;
    fImageRemove: string;
    fImageHint: string;
    saveChanges: string;
    pin: string;
    unpin: string;
    pinned: string;
  };
  dashboard: {
    title: string;
    liveDemoToday: string;
    illustrative: string;
    liveBlurb: (n: number) => string;
    illustrativeBlurb: string;
    dayGoal: string;
    achievedSuffix: string;
    toGoal: string;
    goalHit: string;
    totalToday: string;
    bills: string;
    avgBill: string;
    paymentSplit: string;
    topSellersToday: string;
    inventoryRemaining: string;
    byHour: string;
    today: string;
    previousDay: string;
    exportToday: string;
  };
  settings: {
    title: string;
    body: string;
    demoNote: string;
    fBrand: string;
    fBrandHint: string;
    fPhone: string;
    fPhoneHint: string;
    fPhoneError: string;
    saved: string;
    savedBody: string;
    reset: string;
    dangerTitle: string;
    dangerBody: (p: number, s: number, a: number) => string;
    dangerConfirm: string;
    dangerToastTitle: string;
    dangerToastBody: string;
  };
};

const en: Dict = {
  common: {
    cancel: "Cancel",
    save: "Save",
    back: "Back",
    home: "Home",
    next: "Next",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    remove: "Remove",
    close: "Close",
    search: "Search",
    all: "all",
    loading: "Loading…",
    demoMode: "Demo mode",
    print: "Print",
    export: "Export",
    tryAgain: "Try again",
    workspaceErrorTitle: "Couldn't load your workspace",
    workspaceErrorBody:
      "We hit a problem reaching the database. Your account is fine — this is on our side. Please try again in a moment.",
  },
  chrome: {
    pos: "POS",
    products: "Products",
    dashboard: "Dashboard",
    sendLater: "Send-later",
    corrections: "Corrections",
    auditLog: "Audit log",
    settings: "Settings",
    appHome: "App home",
  },
  landing: {
    kicker: "Pilot · invitation only · Thailand",
    title1: "A POS built for",
    title2: "cat-product booths.",
    body: "Sell faster at events. Track stock per event. Take cash, PromptPay, transfer or card. Send-later orders included. Close each day in five minutes.",
    ctaApply: "Apply to join the pilot",
    ctaStatus: "Check application status",
    feature1Title: "Made for booths",
    feature1Body: "Built from a year of selling at pet expos. Same workflow as our event booth, just multi-tenant.",
    feature2Title: "Real database",
    feature2Body: "Every sale is in Supabase. Backups, audit trail, cross-device — no localStorage gambles.",
    feature3Title: "Send-later included",
    feature3Body: "Out-of-stock at the booth? Take payment, ship later. Status flow built in.",
    feature4Title: "Pilot first, free",
    feature4Body: "Five brands in the cat niche. Hand-picked. Free during pilot.",
    footer: "Cat Booth POS · pilot",
  },
  apply: {
    kicker: "Pilot · cat-product booths",
    title: "Apply to join the pilot",
    body: "Tell us a bit about your brand. We hand-pick five pilots in the cat niche. We'll reply within three working days.",
    fieldName: "Your name",
    fieldPhone: "Phone number",
    fieldEmail: "Email",
    fieldBrand: "Brand name",
    fieldCategory: "Product category",
    fieldSocial: "Instagram / Facebook / website (optional)",
    fieldNumSkus: "# of active SKUs",
    fieldEventsPerYear: "# of events per year",
    fieldMessage: "Why us? (optional)",
    submit: "Submit application",
    submitting: "Submitting…",
    waitNote: "We review applications manually. Expect a reply within 3 working days.",
    successTitle: "Got it. Thanks.",
    successBody: "We'll review your application and reply within three working days. If approved, you'll get an invite code by email.",
    statusTitle: "Check application status",
    statusBody: "Status check is opening soon. In the meantime, watch your inbox — we reply within three working days.",
  },
  appHome: {
    title: "Open booth",
    subtitle: "Pick your next move.",
    tilePosTitle: "POS",
    tilePosBody: "Sell at the booth right now.",
    tileProductsTitle: "Products",
    tileProductsBody: "Set up SKUs, prices, images.",
    tileDashboardTitle: "Dashboard",
    tileDashboardBody: "Today’s sales and inventory.",
    tileSendLaterTitle: "Send-later",
    tileSendLaterBody: "Fulfil pending shipments.",
    tileCorrectionsTitle: "Corrections",
    tileCorrectionsBody: "Void a sale, restore inventory.",
    tileAuditLogTitle: "Audit log",
    tileAuditLogBody: "Settings, catalog, sales, voids — append-only.",
    tileSettingsTitle: "Settings",
    tileSettingsBody: "Brand name, PromptPay phone, defaults.",
  },
  pos: {
    cart: "Cart",
    emptyCart: "Tap a product to add it.",
    subtotal: "Subtotal",
    shippingSendLater: "Shipping (send-later)",
    discount: "Discount",
    total: "Total",
    ctaAddProduct: "Add a product",
    ctaPickPayment: "Pick a payment method",
    ctaFillSendLater: "Fill send-later details",
    ctaReview: "Review & confirm",
    clear: "Clear",
    methodCash: "Cash",
    methodPromptPay: "PromptPay",
    methodTransfer: "Transfer",
    methodCard: "Card",
    methodOther: "Other",
    takeNow: "Take now",
    sendLater: "Send later",
    customerHeading: "Send-later customer",
    customerHint: "Required for shipping. Saved to the order on confirm.",
    customerName: "Customer name",
    customerPhone: "Phone (08x-xxx-xxxx)",
    customerEmail: "Email (optional)",
    customerAddress: "Shipping address",
    customerMissing: "Name, phone, and address are required to confirm.",
    searchPlaceholder: "Search SKU, name, category…",
    noMatch: "No products match your search.",
    soldOut: "sold out",
    reviewSale: "Review sale",
    reviewConfirm: "Confirm sale",
    reviewSaved: "Saved",
    receiptScanWith: "Scan with any Thai banking app to pay.",
    receiptScanAgain: "Scan to re-pay or share the QR with the customer.",
    paymentMethodLabel: "Payment method",
    returningCustomer: "Returning customer",
    ordersCount: (n) => `${n} order${n === 1 ? "" : "s"}`,
    lastSeen: "last seen",
    autofillCustomer: "Autofill name + address",
    amountTendered: "Cash tendered",
    exact: "Exact",
    changeDue: "Change due",
    addNote: "Add note",
    notePlaceholder: "Note (e.g. no scarf, gift wrap)",
    splitPayment: "Split payment",
    singlePayment: "Single payment",
    addSplit: "+ Add split",
    splitRemaining: "Remaining",
    splitOver: "Over by",
    splitNegative: "Negative amount",
    splitsCount: (n) => `${n} method${n === 1 ? "" : "s"}`,
    loyaltyPointsAvailable: (n) => `★ ${n} point${n === 1 ? "" : "s"} available`,
    loyaltyPointsLifetime: (n) => `${n} lifetime`,
    loyaltyEarnsPoints: (n) => `Earns ${n} point${n === 1 ? "" : "s"}`,
    customerNotesHeader: "Customer notes",
    customerTags: "Tags",
    addCustomTag: "+ Add",
    customerNotePlaceholder: "Notes (e.g. allergic to fish, owns 3 cats)",
    upsellHeader: "Customers also added",
    upsellAdd: "+ Add",
    activityFeedHeader: "Live activity",
    forecastSold: (qty, days) => `Sold ${qty} in last ${days} day${days === 1 ? "" : "s"}`,
    forecastSuggestRestock: (qty) => `Consider +${qty} for next event`,
  },
  preOrders: {
    title: "Pre-orders",
    body: "Customers who asked for items that were sold out at the booth.",
    demoNote: "Demo mode: saved to your browser.",
    formTitle: "Pre-order",
    formBody: (productName) =>
      `${productName} is sold out. Take the customer's info; you'll fulfil them when stock returns.`,
    fQty: "Qty",
    fName: "Customer name",
    fPhone: "Phone",
    fEmail: "Email (optional)",
    fNote: "Note (optional)",
    fNotePlaceholder: "e.g. wants brown variant if available",
    save: "Capture pre-order",
    captured: "Pre-order captured",
    statusPending: "pending",
    statusNotified: "notified",
    statusFulfilled: "fulfilled",
    statusCancelled: "cancelled",
    markNotified: "Mark notified",
    markFulfilled: "Mark fulfilled",
    markCancelled: "Cancel",
    soldOutCta: "Pre-order",
    chromeLink: "Pre-orders",
  },
  qrMenu: {
    title: "Browse the booth",
    body: "Tap to add. When you're done, get a code and show it at the till.",
    cartEmpty: "Cart is empty",
    addSomething: "Add at least one item.",
    nameRequired: "Name needed",
    nameRequiredHint: "So the booth staff can recognize you.",
    submitOrder: "Get my code",
    submitTitle: "Generate claim code",
    submitBody: "We'll show a 4-character code to walk up to the till with.",
    fName: "Your name",
    fNamePlaceholder: "First name is fine",
    generateCode: "Generate",
    claimReady: "Show this at the till",
    showAtBooth: (name) =>
      `Hi ${name} — walk up to the till and the staff will type this in.`,
    startOver: "New order",
    noCatalogTitle: "Booth not ready yet",
    noCatalogBody: "The booth has no products listed for QR ordering yet.",
    importHeader: "Import claim",
    importBody: "Type the 4-character code from the customer's phone.",
    importCta: "Import",
    codeFormat: "4-character code, letters and digits.",
    codeNotFound: "No matching open claim. Code may have been redeemed or expired.",
    replaceCart: "Cart isn't empty. Replace it with the imported claim?",
    imported: (name) => `Cart imported · ${name}`,
    importedBody: (n) => `${n} line${n === 1 ? "" : "s"} added to the cart.`,
    openClaims: (n) => `Open claims (${n})`,
  },
  setupProducts: {
    title: "Products",
    body: "Set up SKUs, prices, and images.",
    demoNote: "Demo mode: catalog saves to your browser.",
    emptyTitle: "No products yet.",
    emptyBody: "Add your first product card, or load the sample catalog to skip ahead and see the POS in action.",
    addProduct: "+ Add product",
    loadSample: "Load sample catalog",
    tryDemo: "Try the POS with bundled demo products →",
    openPos: "Open POS →",
    countSummary: "products",
    activeSuffix: "active",
    formAdd: "Add product",
    formEdit: "Edit product",
    fSku: "SKU",
    fSkuLocked: "SKU cannot be changed after creation",
    fName: "Name",
    fCategory: "Category",
    fPrice: "Price (THB)",
    fShippingFee: "Shipping fee (THB, send-later)",
    fStartingQty: "Starting qty",
    fSendLater: "Send-later enabled",
    fSendLaterHint: "Customer can buy this even when out of stock at the booth.",
    fImage: "Product image",
    fImageNoFile: "no image",
    fImageRemove: "Remove image",
    fImageHint: "Auto-resized to ≤1024px and converted to WebP. Saved as a data URL in this browser only.",
    saveChanges: "Save changes",
    pin: "Pin",
    unpin: "Unpin",
    pinned: "pinned",
  },
  dashboard: {
    title: "Dashboard",
    liveDemoToday: "Live demo · today",
    illustrative: "Demo · illustrative",
    liveBlurb: (n) =>
      `${n} order${n === 1 ? "" : "s"} recorded today in this browser.`,
    illustrativeBlurb:
      "Numbers are illustrative. Record a sale at /app/pos to see your own data here.",
    dayGoal: "Day goal",
    achievedSuffix: "% achieved",
    toGoal: "to goal",
    goalHit: "Goal hit",
    totalToday: "Total today",
    bills: "Bills",
    avgBill: "Avg bill",
    paymentSplit: "Payment split",
    topSellersToday: "Top sellers today",
    inventoryRemaining: "Inventory remaining",
    byHour: "By hour",
    today: "today",
    previousDay: "previous day",
    exportToday: "Export today as CSV",
  },
  settings: {
    title: "Settings",
    body: "Workspace-level configuration that the POS reads at runtime.",
    demoNote: "Demo mode: changes save to your browser only.",
    fBrand: "Brand display name",
    fBrandHint: "Shown in the top bar.",
    fPhone: "PromptPay phone",
    fPhoneHint: "The QR generated at checkout uses this number.",
    fPhoneError: "Doesn't look like a valid Thai phone",
    saved: "Saved",
    savedBody: "Settings updated. POS will use these on the next sale.",
    reset: "Reset",
    dangerTitle: "Danger zone",
    dangerBody: (p, s, a) =>
      `Wipe everything stored in this browser: ${p} product${p === 1 ? "" : "s"}, ${s} recorded sale${s === 1 ? "" : "s"}, ${a} audit entr${a === 1 ? "y" : "ies"}, and your settings. Real Supabase data is unaffected (and not stored in this browser anyway).`,
    dangerConfirm: "Reset all demo data",
    dangerToastTitle: "Demo data reset",
    dangerToastBody:
      "Catalog, sales, audit log, and settings cleared. Refresh to see the changes everywhere.",
  },
};

const th: Dict = {
  common: {
    cancel: "ยกเลิก",
    save: "บันทึก",
    back: "กลับ",
    home: "หน้าหลัก",
    next: "ถัดไป",
    confirm: "ยืนยัน",
    delete: "ลบ",
    edit: "แก้ไข",
    add: "เพิ่ม",
    remove: "ลบออก",
    close: "ปิด",
    search: "ค้นหา",
    all: "ทั้งหมด",
    loading: "กำลังโหลด…",
    demoMode: "โหมดทดลอง",
    print: "พิมพ์",
    export: "ส่งออก",
    tryAgain: "ลองอีกครั้ง",
    workspaceErrorTitle: "โหลดเวิร์กสเปซไม่สำเร็จ",
    workspaceErrorBody:
      "เกิดปัญหาในการเชื่อมต่อฐานข้อมูล บัญชีของคุณไม่มีปัญหา กรุณาลองอีกครั้งในอีกสักครู่",
  },
  chrome: {
    pos: "POS",
    products: "สินค้า",
    dashboard: "แดชบอร์ด",
    sendLater: "จัดส่งทีหลัง",
    corrections: "แก้ไขรายการ",
    auditLog: "บันทึกการเปลี่ยนแปลง",
    settings: "ตั้งค่า",
    appHome: "หน้าแอป",
  },
  landing: {
    kicker: "โครงการนำร่อง · เฉพาะผู้ได้รับเชิญ · ประเทศไทย",
    title1: "ระบบ POS",
    title2: "สำหรับร้านขายของแมวออกบูธ",
    body: "ขายเร็วขึ้นในงานอีเวนต์ ติดตามสต็อกแยกแต่ละงาน รับเงินสด พร้อมเพย์ โอน หรือบัตร พร้อมระบบจัดส่งทีหลัง ปิดยอดประจำวันได้ใน 5 นาที",
    ctaApply: "สมัครเข้าร่วมโครงการ",
    ctaStatus: "ตรวจสอบสถานะการสมัคร",
    feature1Title: "ออกแบบมาเพื่อบูธ",
    feature1Body: "สร้างจากประสบการณ์ขายในงาน Pet Expo มาทั้งปี เวิร์กโฟลว์เดียวกับบูธของเราจริง ๆ แค่รองรับหลายร้าน",
    feature2Title: "ฐานข้อมูลจริง",
    feature2Body: "ทุกออเดอร์อยู่ใน Supabase สำรองข้อมูลได้ ตรวจสอบย้อนหลังได้ ใช้งานข้ามอุปกรณ์ ไม่ต้องเสี่ยงกับ localStorage",
    feature3Title: "มีระบบจัดส่งทีหลัง",
    feature3Body: "สินค้าหมดที่บูธ? รับเงินไปก่อน ส่งทีหลังได้ พร้อมระบบติดตามสถานะ",
    feature4Title: "นำร่องก่อน ฟรี",
    feature4Body: "5 แบรนด์ในกลุ่มสินค้าแมว คัดด้วยมือ ใช้ฟรีตลอดช่วงนำร่อง",
    footer: "Cat Booth POS · นำร่อง",
  },
  apply: {
    kicker: "โครงการนำร่อง · บูธสินค้าแมว",
    title: "สมัครเข้าร่วมโครงการนำร่อง",
    body: "บอกเราเกี่ยวกับแบรนด์ของคุณสักเล็กน้อย เราคัดร้านค้านำร่อง 5 แบรนด์ในกลุ่มสินค้าแมว เราจะตอบกลับภายใน 3 วันทำการ",
    fieldName: "ชื่อของคุณ",
    fieldPhone: "เบอร์โทรศัพท์",
    fieldEmail: "อีเมล",
    fieldBrand: "ชื่อแบรนด์",
    fieldCategory: "หมวดหมู่สินค้า",
    fieldSocial: "Instagram / Facebook / เว็บไซต์ (ไม่บังคับ)",
    fieldNumSkus: "จำนวน SKU ที่ใช้งาน",
    fieldEventsPerYear: "จำนวนงานต่อปี",
    fieldMessage: "ทำไมต้องเรา (ไม่บังคับ)",
    submit: "ส่งใบสมัคร",
    submitting: "กำลังส่ง…",
    waitNote: "เราพิจารณาใบสมัครด้วยตนเอง ตอบกลับภายใน 3 วันทำการ",
    successTitle: "ได้รับใบสมัครแล้ว ขอบคุณครับ",
    successBody:
      "เราจะพิจารณาใบสมัครของคุณและตอบกลับภายใน 3 วันทำการ หากผ่านการพิจารณา คุณจะได้รับรหัสเชิญทางอีเมล",
    statusTitle: "ตรวจสอบสถานะการสมัคร",
    statusBody:
      "ระบบตรวจสอบสถานะกำลังจะเปิดให้ใช้งานเร็ว ๆ นี้ ระหว่างนี้รอดูในกล่องอีเมล — เราตอบกลับภายใน 3 วันทำการ",
  },
  appHome: {
    title: "เปิดร้าน",
    subtitle: "เลือกขั้นตอนต่อไป",
    tilePosTitle: "POS",
    tilePosBody: "ขายของที่บูธทันที",
    tileProductsTitle: "สินค้า",
    tileProductsBody: "ตั้งค่า SKU ราคา รูปภาพ",
    tileDashboardTitle: "แดชบอร์ด",
    tileDashboardBody: "ยอดขายและสต็อกของวันนี้",
    tileSendLaterTitle: "จัดส่งทีหลัง",
    tileSendLaterBody: "จัดส่งออเดอร์ที่ค้างอยู่",
    tileCorrectionsTitle: "แก้ไขรายการ",
    tileCorrectionsBody: "ยกเลิกออเดอร์ คืนสต็อก",
    tileAuditLogTitle: "บันทึกการเปลี่ยนแปลง",
    tileAuditLogBody: "ตั้งค่า สินค้า ยอดขาย การยกเลิก — เก็บไว้อ่านอย่างเดียว",
    tileSettingsTitle: "ตั้งค่า",
    tileSettingsBody: "ชื่อแบรนด์ เบอร์พร้อมเพย์ ค่าเริ่มต้น",
  },
  pos: {
    cart: "ตะกร้า",
    emptyCart: "แตะที่สินค้าเพื่อเพิ่มลงตะกร้า",
    subtotal: "ยอดรวม",
    shippingSendLater: "ค่าจัดส่ง (จัดส่งทีหลัง)",
    discount: "ส่วนลด",
    total: "ยอดสุทธิ",
    ctaAddProduct: "เพิ่มสินค้าก่อน",
    ctaPickPayment: "เลือกวิธีชำระเงิน",
    ctaFillSendLater: "กรอกข้อมูลจัดส่งทีหลัง",
    ctaReview: "ตรวจสอบและยืนยัน",
    clear: "ล้าง",
    methodCash: "เงินสด",
    methodPromptPay: "พร้อมเพย์",
    methodTransfer: "โอน",
    methodCard: "บัตร",
    methodOther: "อื่น ๆ",
    takeNow: "รับของเลย",
    sendLater: "จัดส่งทีหลัง",
    customerHeading: "ข้อมูลลูกค้า (จัดส่งทีหลัง)",
    customerHint: "จำเป็นสำหรับการจัดส่ง บันทึกพร้อมออเดอร์ตอนยืนยัน",
    customerName: "ชื่อลูกค้า",
    customerPhone: "เบอร์โทร (08x-xxx-xxxx)",
    customerEmail: "อีเมล (ไม่บังคับ)",
    customerAddress: "ที่อยู่จัดส่ง",
    customerMissing: "ต้องกรอกชื่อ เบอร์ และที่อยู่ก่อนยืนยัน",
    searchPlaceholder: "ค้นหา SKU ชื่อ หมวดหมู่…",
    noMatch: "ไม่พบสินค้าที่ตรงกับคำค้น",
    soldOut: "หมด",
    reviewSale: "ตรวจสอบออเดอร์",
    reviewConfirm: "ยืนยันการขาย",
    reviewSaved: "บันทึกแล้ว",
    receiptScanWith: "สแกน QR ด้วยแอปธนาคารใดก็ได้เพื่อชำระเงิน",
    receiptScanAgain: "สแกนเพื่อชำระอีกครั้งหรือส่งให้คนอื่น",
    paymentMethodLabel: "วิธีชำระเงิน",
    returningCustomer: "ลูกค้าประจำ",
    ordersCount: (n) => `${n} ออเดอร์`,
    lastSeen: "ล่าสุดเมื่อ",
    autofillCustomer: "เติมชื่อและที่อยู่อัตโนมัติ",
    amountTendered: "เงินที่รับ",
    exact: "พอดี",
    changeDue: "เงินทอน",
    addNote: "เพิ่มหมายเหตุ",
    notePlaceholder: "หมายเหตุ (เช่น ไม่เอาผ้าพันคอ ห่อของขวัญ)",
    splitPayment: "แบ่งจ่าย",
    singlePayment: "จ่ายช่องทางเดียว",
    addSplit: "+ เพิ่มช่องทาง",
    splitRemaining: "เหลืออีก",
    splitOver: "เกินไป",
    splitNegative: "จำนวนติดลบ",
    splitsCount: (n) => `${n} ช่องทาง`,
    loyaltyPointsAvailable: (n) => `★ มี ${n} แต้ม`,
    loyaltyPointsLifetime: (n) => `สะสม ${n} แต้ม`,
    loyaltyEarnsPoints: (n) => `จะได้ ${n} แต้ม`,
    customerNotesHeader: "บันทึกลูกค้า",
    customerTags: "แท็ก",
    addCustomTag: "+ เพิ่ม",
    customerNotePlaceholder: "บันทึก (เช่น แพ้ปลา เลี้ยงแมว 3 ตัว)",
    upsellHeader: "ลูกค้าซื้อคู่กันบ่อย",
    upsellAdd: "+ เพิ่ม",
    activityFeedHeader: "ความเคลื่อนไหวสด",
    forecastSold: (qty, days) => `ขายแล้ว ${qty} ใน ${days} วันล่าสุด`,
    forecastSuggestRestock: (qty) => `แนะนำเตรียมเพิ่ม ${qty} ชิ้นสำหรับงานถัดไป`,
  },
  preOrders: {
    title: "พรีออเดอร์",
    body: "ลูกค้าที่ถามหาสินค้าที่บูธหมดสต็อก",
    demoNote: "โหมดทดลอง: บันทึกในเบราว์เซอร์ของคุณ",
    formTitle: "พรีออเดอร์",
    formBody: (productName) =>
      `${productName} หมดสต็อกแล้ว เก็บข้อมูลลูกค้าไว้ จะติดต่อกลับเมื่อมีของ`,
    fQty: "จำนวน",
    fName: "ชื่อลูกค้า",
    fPhone: "เบอร์โทร",
    fEmail: "อีเมล (ไม่บังคับ)",
    fNote: "หมายเหตุ (ไม่บังคับ)",
    fNotePlaceholder: "เช่น ขอแบบสีน้ำตาลถ้ามี",
    save: "บันทึกพรีออเดอร์",
    captured: "บันทึกพรีออเดอร์แล้ว",
    statusPending: "รอ",
    statusNotified: "แจ้งแล้ว",
    statusFulfilled: "ส่งมอบแล้ว",
    statusCancelled: "ยกเลิก",
    markNotified: "แจ้งลูกค้าแล้ว",
    markFulfilled: "ส่งมอบแล้ว",
    markCancelled: "ยกเลิก",
    soldOutCta: "พรีออเดอร์",
    chromeLink: "พรีออเดอร์",
  },
  qrMenu: {
    title: "เลือกสินค้าจากบูธ",
    body: "แตะเพื่อเพิ่มลงตะกร้า เมื่อเสร็จ รับรหัสและไปแสดงที่จุดชำระเงิน",
    cartEmpty: "ตะกร้าว่าง",
    addSomething: "เพิ่มสินค้าอย่างน้อย 1 รายการ",
    nameRequired: "ต้องใส่ชื่อ",
    nameRequiredHint: "เพื่อให้ทางร้านรู้ว่าใคร",
    submitOrder: "รับรหัสของฉัน",
    submitTitle: "สร้างรหัสรับสินค้า",
    submitBody: "เราจะแสดงรหัส 4 ตัวเพื่อไปแสดงที่จุดชำระเงิน",
    fName: "ชื่อของคุณ",
    fNamePlaceholder: "ชื่อเล่นก็ได้",
    generateCode: "สร้าง",
    claimReady: "แสดงรหัสนี้ที่จุดชำระเงิน",
    showAtBooth: (name) => `สวัสดีคุณ ${name} ไปที่จุดชำระเงินและให้พนักงานพิมพ์รหัสนี้`,
    startOver: "สั่งใหม่",
    noCatalogTitle: "บูธยังไม่พร้อม",
    noCatalogBody: "บูธยังไม่ได้เปิดให้สั่งผ่าน QR",
    importHeader: "นำเข้ารหัส",
    importBody: "พิมพ์รหัส 4 ตัวจากโทรศัพท์ลูกค้า",
    importCta: "นำเข้า",
    codeFormat: "รหัส 4 ตัวอักษร ตัวเลขหรือตัวอักษร",
    codeNotFound: "ไม่พบรหัสที่ใช้งานได้ อาจถูกใช้ไปแล้วหรือหมดอายุ",
    replaceCart: "ตะกร้าไม่ว่าง จะแทนที่ด้วยรหัสที่นำเข้าหรือไม่?",
    imported: (name) => `นำเข้าตะกร้าแล้ว · ${name}`,
    importedBody: (n) => `เพิ่ม ${n} รายการในตะกร้า`,
    openClaims: (n) => `รหัสที่รออยู่ (${n})`,
  },
  setupProducts: {
    title: "สินค้า",
    body: "ตั้งค่า SKU ราคา และรูปภาพ",
    demoNote: "โหมดทดลอง: รายการสินค้าจะบันทึกในเบราว์เซอร์ของคุณเท่านั้น",
    emptyTitle: "ยังไม่มีสินค้า",
    emptyBody:
      "เพิ่มสินค้าแรกของคุณ หรือโหลดสินค้าตัวอย่างเพื่อทดลองใช้ POS ทันที",
    addProduct: "+ เพิ่มสินค้า",
    loadSample: "โหลดสินค้าตัวอย่าง",
    tryDemo: "ลองใช้ POS กับสินค้าตัวอย่าง →",
    openPos: "เปิด POS →",
    countSummary: "สินค้า",
    activeSuffix: "ใช้งานอยู่",
    formAdd: "เพิ่มสินค้า",
    formEdit: "แก้ไขสินค้า",
    fSku: "SKU",
    fSkuLocked: "ไม่สามารถเปลี่ยน SKU หลังสร้างแล้ว",
    fName: "ชื่อ",
    fCategory: "หมวดหมู่",
    fPrice: "ราคา (บาท)",
    fShippingFee: "ค่าจัดส่ง (บาท, เฉพาะจัดส่งทีหลัง)",
    fStartingQty: "จำนวนเริ่มต้น",
    fSendLater: "เปิดให้จัดส่งทีหลัง",
    fSendLaterHint: "ลูกค้าสั่งได้แม้สต็อกที่บูธหมด",
    fImage: "รูปภาพสินค้า",
    fImageNoFile: "ยังไม่มีรูป",
    fImageRemove: "ลบรูป",
    fImageHint:
      "ปรับขนาดอัตโนมัติให้ไม่เกิน 1024px และแปลงเป็น WebP บันทึกเฉพาะในเบราว์เซอร์นี้",
    saveChanges: "บันทึกการเปลี่ยนแปลง",
    pin: "ปักหมุด",
    unpin: "เอาหมุดออก",
    pinned: "ปักหมุดแล้ว",
  },
  dashboard: {
    title: "แดชบอร์ด",
    liveDemoToday: "ข้อมูลจริงในเบราว์เซอร์ · วันนี้",
    illustrative: "ตัวอย่าง · ภาพรวม",
    liveBlurb: (n) => `บันทึกออเดอร์แล้ว ${n} รายการในเบราว์เซอร์นี้วันนี้`,
    illustrativeBlurb:
      "ตัวเลขเป็นตัวอย่าง บันทึกการขายที่ /app/pos เพื่อดูข้อมูลจริงของคุณ",
    dayGoal: "เป้าหมายของวัน",
    achievedSuffix: "% ของเป้า",
    toGoal: "ห่างเป้าอีก",
    goalHit: "ถึงเป้าแล้ว",
    totalToday: "ยอดวันนี้",
    bills: "บิล",
    avgBill: "ยอดเฉลี่ยต่อบิล",
    paymentSplit: "สัดส่วนวิธีชำระ",
    topSellersToday: "ขายดีวันนี้",
    inventoryRemaining: "สต็อกคงเหลือ",
    byHour: "ตามช่วงเวลา",
    today: "วันนี้",
    previousDay: "วันก่อน",
    exportToday: "ส่งออก CSV ของวันนี้",
  },
  settings: {
    title: "ตั้งค่า",
    body: "การตั้งค่าระดับร้านที่ POS อ่านตอนใช้งาน",
    demoNote: "โหมดทดลอง: การเปลี่ยนแปลงบันทึกในเบราว์เซอร์ของคุณเท่านั้น",
    fBrand: "ชื่อแบรนด์ที่แสดง",
    fBrandHint: "แสดงในแถบบนสุด",
    fPhone: "เบอร์พร้อมเพย์",
    fPhoneHint: "QR ที่สร้างตอนชำระเงินจะใช้เบอร์นี้",
    fPhoneError: "ดูเหมือนไม่ใช่เบอร์ไทยที่ใช้ได้",
    saved: "บันทึกแล้ว",
    savedBody: "อัปเดตการตั้งค่าแล้ว POS จะใช้ค่านี้ในการขายครั้งถัดไป",
    reset: "รีเซ็ต",
    dangerTitle: "พื้นที่อันตราย",
    dangerBody: (p, s, a) =>
      `ลบทุกอย่างที่เก็บในเบราว์เซอร์นี้: สินค้า ${p} รายการ, ออเดอร์ ${s} รายการ, บันทึก ${a} รายการ และการตั้งค่า ข้อมูลจริงใน Supabase ไม่ได้รับผลกระทบ (และไม่ได้เก็บในเบราว์เซอร์นี้อยู่แล้ว)`,
    dangerConfirm: "รีเซ็ตข้อมูลทดลองทั้งหมด",
    dangerToastTitle: "รีเซ็ตข้อมูลทดลองแล้ว",
    dangerToastBody:
      "ลบสินค้า ออเดอร์ บันทึก และการตั้งค่าแล้ว รีเฟรชหน้าเว็บเพื่อให้เห็นการเปลี่ยนแปลงทั่วทั้งแอป",
  },
};

export const dictionaries: Record<Lang, Dict> = { en, th };
