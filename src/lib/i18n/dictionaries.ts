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
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    errorInvalid: string;
    errorConfig: string;
    forgotPassword: string;
    invitedPrefix: string;
    registerCta: string;
    newHerePrefix: string;
    applyCta: string;
    backHome: string;
    googleCta: string;
    orDivider: string;
    errorNeedsInvite: string;
    errorGoogleGeneric: string;
  };
  register: {
    title: string;
    subtitle: string;
    codeLabel: string;
    codePlaceholder: string;
    codeCta: string;
    accountTitle: string;
    accountSubtitle: string;
    brandLabel: string;
    emailLabel: string;
    emailHint: string;
    slugLabel: string;
    slugHint: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmLabel: string;
    confirmPlaceholder: string;
    submit: string;
    submitting: string;
    useDifferentCode: string;
    haveAccount: string;
    signInCta: string;
    backHome: string;
    googleCta: string;
    orDivider: string;
    googleHint: string;
    errorEmailMismatch: string;
    errorSlugTaken: string;
    errorSlugInvalid: string;
    errorGoogleGeneric: string;
  };
  passwordReset: {
    forgotTitle: string;
    forgotSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    sendCta: string;
    sending: string;
    sentTitle: string;
    sentBody: string;
    resetTitle: string;
    resetSubtitle: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmLabel: string;
    confirmPlaceholder: string;
    updateCta: string;
    updating: string;
    expiredTitle: string;
    expiredBody: string;
    requestNewCta: string;
    backToLogin: string;
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
    signOut: string;
  };
  landing: {
    kicker: string;
    title1: string;
    title2: string;
    body: string;
    ctaApply: string;
    ctaStatus: string;
    ctaRegister: string;
    ctaOpenApp: string;
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
    fieldMessagePlaceholder: string;
    submit: string;
    submitting: string;
    waitNote: string;
    successTitle: string;
    successBody: string;
    statusTitle: string;
    statusBody: string;
    navFeatures: string;
    navHowItWorks: string;
    navFaq: string;
    navSignIn: string;
    backToHome: string;
    heroHeadline: string;
    heroSubheadline: string;
    heroBody: string;
    heroCtaPrimary: string;
    heroCtaSecondary: string;
    heroTrustNote: string;
    audiencesHeading: string;
    audiencesBody: string;
    audiences: string[];
    featuresHeading: string;
    featuresBody: string;
    benefits: { title: string; body: string }[];
    howItWorksHeading: string;
    steps: { title: string; body: string }[];
    contactHeading: string;
    contactBody: string;
    dataHeading: string;
    dataBody: string;
    dataFootnote: string;
    faqHeading: string;
    faqs: { q: string; a: string }[];
    applyHeading: string;
    applyBody: string;
    applyBoxHeading: string;
    applyBoxBody: string;
    applyAsideHeading: string;
    applyAsideBody: string;
    heroPreviewKicker: string;
    heroPreviewTitle: string;
    heroPreviewStatus: string;
    heroPreviewToday: string;
    heroPreviewFooter: string;
    alreadyApproved: string;
    redeemInvite: string;
  };
  appHome: {
    title: string;
    subtitle: string;
    tilePosTitle: string;
    tilePosBody: string;
    tileProductsTitle: string;
    tileProductsBody: string;
    tileEventsTitle: string;
    tileEventsBody: string;
    tileDashboardTitle: string;
    tileDashboardBody: string;
    tileSendLaterTitle: string;
    tileSendLaterBody: string;
    tileCorrectionsTitle: string;
    tileCorrectionsBody: string;
    tileAuditLogTitle: string;
    tileAuditLogBody: string;
    tileCloseDayTitle: string;
    tileCloseDayBody: string;
    tileStockCountTitle: string;
    tileStockCountBody: string;
    tileSampleBucketTitle: string;
    tileSampleBucketBody: string;
    tileCustomersTitle: string;
    tileCustomersBody: string;
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
  login: {
    title: "Sign in",
    subtitle: "For pilot sellers and platform admins.",
    emailLabel: "Email",
    emailPlaceholder: "you@brand.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Your password",
    submit: "Sign in",
    submitting: "Signing in…",
    errorInvalid: "Email or password is incorrect.",
    errorConfig: "Sign-in isn't available in demo mode yet.",
    forgotPassword: "Forgot password?",
    invitedPrefix: "Got an invite?",
    registerCta: "Redeem your code →",
    newHerePrefix: "New here?",
    applyCta: "Apply to join",
    backHome: "← Home",
    googleCta: "Continue with Google",
    orDivider: "or",
    errorNeedsInvite:
      "That Google account isn't set up yet. Redeem your invite code first.",
    errorGoogleGeneric: "Google sign-in didn't complete. Please try again.",
  },
  register: {
    title: "Redeem your invite",
    subtitle: "Enter the invite code from your email to set up your workspace.",
    codeLabel: "Invite code",
    codePlaceholder: "CATBOOTH-XXXX-YYYY",
    codeCta: "Continue",
    accountTitle: "Create your account",
    accountSubtitle: "Set a password and choose your workspace address.",
    brandLabel: "Brand",
    emailLabel: "Email",
    emailHint: "This is your sign-in email (from your invite).",
    slugLabel: "Workspace address",
    slugHint: "Lowercase letters, numbers and hyphens. You can't change it later.",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirmLabel: "Confirm password",
    confirmPlaceholder: "Re-enter your password",
    submit: "Create account & workspace",
    submitting: "Setting up…",
    useDifferentCode: "← Use a different code",
    haveAccount: "Already have an account?",
    signInCta: "Sign in",
    backHome: "← Home",
    googleCta: "Continue with Google",
    orDivider: "or",
    googleHint: "Sign in with the Google account for the email above.",
    errorEmailMismatch:
      "That Google account doesn't match your invite email. Use the invited email, or set a password instead.",
    errorSlugTaken:
      "That workspace address is already taken. Go back, choose a different one, and try again.",
    errorSlugInvalid:
      "Your workspace address is invalid. Use lowercase letters, numbers, and hyphens only.",
    errorGoogleGeneric: "Couldn't continue with Google. Please try again.",
  },
  passwordReset: {
    forgotTitle: "Reset your password",
    forgotSubtitle: "Enter your email and we'll send you a reset link.",
    emailLabel: "Email",
    emailPlaceholder: "you@brand.com",
    sendCta: "Send reset link",
    sending: "Sending…",
    sentTitle: "Check your email",
    sentBody:
      "If an account exists for that email, we've sent a link to reset your password. The link expires soon.",
    resetTitle: "Set a new password",
    resetSubtitle: "Choose a new password for your account.",
    newPasswordLabel: "New password",
    newPasswordPlaceholder: "At least 8 characters",
    confirmLabel: "Confirm password",
    confirmPlaceholder: "Re-enter your new password",
    updateCta: "Update password",
    updating: "Updating…",
    expiredTitle: "Link expired",
    expiredBody:
      "This password-reset link is invalid or has expired. Request a fresh one.",
    requestNewCta: "Request a new link",
    backToLogin: "← Back to sign in",
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
    signOut: "Sign out",
  },
  landing: {
    kicker: "Pilot · invitation only · Thailand",
    title1: "A POS built for",
    title2: "event booths.",
    body: "Sell faster at events. Track stock per event. Take cash, PromptPay, transfer or card. Send-later orders included. Close each day in five minutes.",
    ctaApply: "Apply to join the pilot",
    ctaStatus: "Check application status",
    ctaRegister: "Redeem invite code",
    ctaOpenApp: "Open app",
    feature1Title: "Made for booths",
    feature1Body: "Built from real booth selling. Same workflow as an event booth, just multi-tenant.",
    feature2Title: "Real database",
    feature2Body: "Every sale is in Supabase. Backups, audit trail, cross-device — no localStorage gambles.",
    feature3Title: "Send-later included",
    feature3Body: "Out-of-stock at the booth? Take payment, ship later. Status flow built in.",
    feature4Title: "Pilot first, free",
    feature4Body: "Five booth sellers. Hand-picked. Free during pilot.",
    footer: "Booth POS · pilot",
  },
  apply: {
    kicker: "Pilot · event booths",
    title: "Apply to join the pilot",
    body: "Tell us a bit about your booth or brand. We hand-pick five pilot sellers. We'll reply within three working days.",
    fieldName: "Your name",
    fieldPhone: "Phone number",
    fieldEmail: "Email",
    fieldBrand: "Brand name",
    fieldCategory: "Product category",
    fieldSocial: "Instagram / Facebook / website (optional)",
    fieldNumSkus: "# of active SKUs",
    fieldEventsPerYear: "# of events per year",
    fieldMessage: "Upcoming event or setup notes (optional)",
    fieldMessagePlaceholder: "Tell us about your event, booth workflow, or questions",
    submit: "Submit application",
    submitting: "Submitting…",
    waitNote: "We review applications manually. Expect a reply within 3 working days.",
    successTitle: "Got it. Thanks.",
    successBody: "We'll review your application and reply within three working days. If approved, you'll get an invite code by email.",
    statusTitle: "Check application status",
    statusBody: "Status check is opening soon. In the meantime, watch your inbox — we reply within three working days.",
    navFeatures: "Features",
    navHowItWorks: "How it works",
    navFaq: "FAQ",
    navSignIn: "Sign in",
    backToHome: "Back to home",
    heroHeadline: "Simple POS for pop-up sellers",
    heroSubheadline: "Fast Sales. Easy Stock. Clear Reports.",
    heroBody: "Sell faster at events, track stock clearly, and close each selling day with reports you can trust.",
    heroCtaPrimary: "Try Demo / Apply",
    heroCtaSecondary: "See how it works",
    heroTrustNote: "Early access is reviewed by a real person. We help you get set up.",
    audiencesHeading: "Built for small brands selling in real places",
    audiencesBody: "Mochi POS is for sellers who need a practical booth system, not a complicated enterprise setup.",
    audiences: [
      "Product booth sellers",
      "Pop-up store owners",
      "Event sellers",
      "Small retail brands",
      "Small brands preparing for multi-day events",
    ],
    featuresHeading: "Everything a small event seller needs to run the booth",
    featuresBody: "Keep checkout, stock, and reporting in one simple workflow your team can understand quickly.",
    benefits: [
      { title: "Fast checkout", body: "Ring up orders quickly on a tablet or laptop, even when the booth gets busy." },
      { title: "Easy stock", body: "Track event stock, samples, and restock adjustments without paper notes." },
      { title: "Clear reports", body: "See daily sales, payment methods, and event summaries after each selling day." },
      { title: "Product setup", body: "Manage products, SKU, price, and starting stock before the event opens." },
      { title: "QR payment support", body: "Built for QR and PromptPay-friendly sales workflows." },
    ],
    howItWorksHeading: "How it works",
    steps: [
      { title: "Apply or try the demo", body: "Tell us about your brand and upcoming event. We review early access by hand." },
      { title: "Set up products and stock", body: "Add products, SKU, prices, and starting stock for each event." },
      { title: "Sell at the booth", body: "Use the POS to record sales, payment type, samples, and corrections." },
      { title: "Close the day", body: "Review sales, cash, and stock movement before the team goes home." },
    ],
    contactHeading: "You are not setting this up alone",
    contactBody: "Mochi POS is currently open to selected early users. We review each application, help set up the first workspace, and collect feedback to improve the product before wider launch.",
    dataHeading: "Your sales data stays your business data",
    dataBody: "Mochi POS uses workspace-based access so each seller only sees their own products, orders, stock, and reports. We use your application information to review your pilot request and contact you about setup. We do not sell your customer or sales data.",
    dataFootnote: "Simple promise: practical access control, careful handling, and no exaggerated enterprise claims.",
    faqHeading: "Questions before you try Mochi POS",
    faqs: [
      { q: "Is Mochi POS free to try?", a: "Early access is reviewed case by case. Apply and we will contact you with the current pilot details." },
      { q: "What device do I need?", a: "A tablet or laptop with internet access works best." },
      { q: "Can it support QR payment?", a: "Yes. Mochi POS is designed for QR and PromptPay-friendly sales workflows." },
      { q: "Can I use it for a multi-day event?", a: "Yes. The workflow supports event stock and daily reporting." },
      { q: "Do I need technical setup?", a: "No. We help early users get started and understand the setup." },
      { q: "Who will support me?", a: "VC is the contact person for early access and setup questions." },
    ],
    applyHeading: "Apply for early access",
    applyBody: "Tell us about your brand, products, and upcoming events. We will review your application and contact you about the next step.",
    applyBoxHeading: "Early access, with hands-on support",
    applyBoxBody: "You do not need to be technical. We will help you understand the setup and decide whether Mochi POS fits your event workflow.",
    applyAsideHeading: "Start your application",
    applyAsideBody: "We review every application by hand. Expect a reply within 3 working days.",
    heroPreviewKicker: "Event checkout",
    heroPreviewTitle: "Booth POS",
    heroPreviewStatus: "Running",
    heroPreviewToday: "Today",
    heroPreviewFooter: "Stock, cash, QR, and daily close in one flow.",
    alreadyApproved: "Already approved?",
    redeemInvite: "Redeem your invite code",
  },
  appHome: {
    title: "Open booth",
    subtitle: "Pick your next move.",
    tilePosTitle: "POS",
    tilePosBody: "Sell at the booth right now.",
    tileProductsTitle: "Products",
    tileProductsBody: "Set up SKUs, prices, images.",
    tileEventsTitle: "Events",
    tileEventsBody: "Create an event, allocate stock per SKU, then start selling.",
    tileDashboardTitle: "Dashboard",
    tileDashboardBody: "Today’s sales and inventory.",
    tileSendLaterTitle: "Send-later",
    tileSendLaterBody: "Fulfil pending shipments.",
    tileCorrectionsTitle: "Corrections",
    tileCorrectionsBody: "Void a sale, restore inventory.",
    tileAuditLogTitle: "Audit log",
    tileAuditLogBody: "Settings, catalog, sales, voids — append-only.",
    tileCloseDayTitle: "Close day",
    tileCloseDayBody: "Reconcile counted cash against today’s sales.",
    tileStockCountTitle: "Stock count",
    tileStockCountBody: "Walk the warehouse, count, fix drift after each event.",
    tileSampleBucketTitle: "Sample bucket",
    tileSampleBucketBody: "Move stock between sellable and on-display sample.",
    tileCustomersTitle: "Customers",
    tileCustomersBody: "Lifecycle, lifetime spend, top SKU per phone.",
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
  login: {
    title: "เข้าสู่ระบบ",
    subtitle: "สำหรับผู้ขายในโครงการนำร่องและแอดมิน",
    emailLabel: "อีเมล",
    emailPlaceholder: "you@brand.com",
    passwordLabel: "รหัสผ่าน",
    passwordPlaceholder: "รหัสผ่านของคุณ",
    submit: "เข้าสู่ระบบ",
    submitting: "กำลังเข้าสู่ระบบ…",
    errorInvalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    errorConfig: "ยังเข้าสู่ระบบไม่ได้ในโหมดทดลอง",
    forgotPassword: "ลืมรหัสผ่าน?",
    invitedPrefix: "มีรหัสเชิญแล้ว?",
    registerCta: "ใช้รหัสเชิญของคุณ →",
    newHerePrefix: "เพิ่งเริ่มใช้งาน?",
    applyCta: "สมัครเข้าร่วม",
    backHome: "← หน้าหลัก",
    googleCta: "ดำเนินการต่อด้วย Google",
    orDivider: "หรือ",
    errorNeedsInvite:
      "บัญชี Google นี้ยังไม่ได้ตั้งค่า กรุณาใช้รหัสเชิญของคุณก่อน",
    errorGoogleGeneric: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง",
  },
  register: {
    title: "ใช้รหัสเชิญของคุณ",
    subtitle: "กรอกรหัสเชิญจากอีเมลของคุณเพื่อตั้งค่าเวิร์กสเปซ",
    codeLabel: "รหัสเชิญ",
    codePlaceholder: "CATBOOTH-XXXX-YYYY",
    codeCta: "ต่อไป",
    accountTitle: "สร้างบัญชีของคุณ",
    accountSubtitle: "ตั้งรหัสผ่านและเลือกที่อยู่เวิร์กสเปซ",
    brandLabel: "แบรนด์",
    emailLabel: "อีเมล",
    emailHint: "นี่คืออีเมลสำหรับเข้าสู่ระบบ (จากรหัสเชิญของคุณ)",
    slugLabel: "ที่อยู่เวิร์กสเปซ",
    slugHint: "ตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น เปลี่ยนภายหลังไม่ได้",
    passwordLabel: "รหัสผ่าน",
    passwordPlaceholder: "อย่างน้อย 8 ตัวอักษร",
    confirmLabel: "ยืนยันรหัสผ่าน",
    confirmPlaceholder: "กรอกรหัสผ่านอีกครั้ง",
    submit: "สร้างบัญชีและเวิร์กสเปซ",
    submitting: "กำลังตั้งค่า…",
    useDifferentCode: "← ใช้รหัสอื่น",
    haveAccount: "มีบัญชีอยู่แล้ว?",
    signInCta: "เข้าสู่ระบบ",
    backHome: "← หน้าหลัก",
    googleCta: "ดำเนินการต่อด้วย Google",
    orDivider: "หรือ",
    googleHint: "เข้าสู่ระบบด้วยบัญชี Google ของอีเมลด้านบน",
    errorEmailMismatch:
      "อีเมลของบัญชี Google ไม่ตรงกับรหัสเชิญของคุณ กรุณาใช้อีเมลที่ได้รับเชิญ หรือตั้งรหัสผ่านแทน",
    errorSlugTaken:
      "ที่อยู่ Workspace นี้ถูกใช้งานแล้ว กรุณากลับไปเลือกที่อยู่ใหม่แล้วลองอีกครั้ง",
    errorSlugInvalid:
      "ที่อยู่ Workspace ไม่ถูกต้อง ใช้ได้เฉพาะตัวพิมพ์เล็ก ตัวเลข และขีดกลาง",
    errorGoogleGeneric: "ดำเนินการต่อด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง",
  },
  passwordReset: {
    forgotTitle: "รีเซ็ตรหัสผ่าน",
    forgotSubtitle: "กรอกอีเมลของคุณ แล้วเราจะส่งลิงก์รีเซ็ตให้",
    emailLabel: "อีเมล",
    emailPlaceholder: "you@brand.com",
    sendCta: "ส่งลิงก์รีเซ็ต",
    sending: "กำลังส่ง…",
    sentTitle: "ตรวจสอบอีเมลของคุณ",
    sentBody:
      "หากมีบัญชีสำหรับอีเมลนี้ เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปแล้ว ลิงก์จะหมดอายุในไม่ช้า",
    resetTitle: "ตั้งรหัสผ่านใหม่",
    resetSubtitle: "เลือกรหัสผ่านใหม่สำหรับบัญชีของคุณ",
    newPasswordLabel: "รหัสผ่านใหม่",
    newPasswordPlaceholder: "อย่างน้อย 8 ตัวอักษร",
    confirmLabel: "ยืนยันรหัสผ่าน",
    confirmPlaceholder: "กรอกรหัสผ่านใหม่อีกครั้ง",
    updateCta: "อัปเดตรหัสผ่าน",
    updating: "กำลังอัปเดต…",
    expiredTitle: "ลิงก์หมดอายุ",
    expiredBody: "ลิงก์รีเซ็ตรหัสผ่านนี้ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่",
    requestNewCta: "ขอลิงก์ใหม่",
    backToLogin: "← กลับไปเข้าสู่ระบบ",
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
    signOut: "ออกจากระบบ",
  },
  landing: {
    kicker: "โครงการนำร่อง · เฉพาะผู้ได้รับเชิญ · ประเทศไทย",
    title1: "ระบบ POS",
    title2: "สำหรับร้านออกบูธ",
    body: "ขายเร็วขึ้นในงานอีเวนต์ ติดตามสต็อกแยกแต่ละงาน รับเงินสด พร้อมเพย์ โอน หรือบัตร พร้อมระบบจัดส่งทีหลัง ปิดยอดประจำวันได้ใน 5 นาที",
    ctaApply: "สมัครเข้าร่วมโครงการ",
    ctaStatus: "ตรวจสอบสถานะการสมัคร",
    ctaRegister: "ใช้รหัสเชิญ",
    ctaOpenApp: "เปิดแอป",
    feature1Title: "ออกแบบมาเพื่อบูธ",
    feature1Body: "สร้างจากประสบการณ์ขายหน้างานจริง เวิร์กโฟลว์เดียวกับบูธอีเวนต์ แค่รองรับหลายร้าน",
    feature2Title: "ฐานข้อมูลจริง",
    feature2Body: "ทุกออเดอร์อยู่ใน Supabase สำรองข้อมูลได้ ตรวจสอบย้อนหลังได้ ใช้งานข้ามอุปกรณ์ ไม่ต้องเสี่ยงกับ localStorage",
    feature3Title: "มีระบบจัดส่งทีหลัง",
    feature3Body: "สินค้าหมดที่บูธ? รับเงินไปก่อน ส่งทีหลังได้ พร้อมระบบติดตามสถานะ",
    feature4Title: "นำร่องก่อน ฟรี",
    feature4Body: "5 ร้านออกบูธ คัดด้วยมือ ใช้ฟรีตลอดช่วงนำร่อง",
    footer: "Booth POS · นำร่อง",
  },
  apply: {
    kicker: "โครงการนำร่อง · ร้านออกบูธ",
    title: "สมัครเข้าร่วมโครงการนำร่อง",
    body: "บอกเราเกี่ยวกับร้านหรือแบรนด์ของคุณสักเล็กน้อย เราคัดร้านค้านำร่อง 5 ร้าน เราจะตอบกลับภายใน 3 วันทำการ",
    fieldName: "ชื่อของคุณ",
    fieldPhone: "เบอร์โทรศัพท์",
    fieldEmail: "อีเมล",
    fieldBrand: "ชื่อแบรนด์",
    fieldCategory: "หมวดหมู่สินค้า",
    fieldSocial: "Instagram / Facebook / เว็บไซต์ (ไม่บังคับ)",
    fieldNumSkus: "จำนวน SKU ที่ใช้งาน",
    fieldEventsPerYear: "จำนวนงานต่อปี",
    fieldMessage: "งานที่จะออกหรือหมายเหตุการเซ็ตอัป (ไม่บังคับ)",
    fieldMessagePlaceholder: "เล่าให้ฟังเกี่ยวกับงาน กระบวนการออกบูธ หรือคำถาม",
    submit: "ส่งใบสมัคร",
    submitting: "กำลังส่ง…",
    waitNote: "เราพิจารณาใบสมัครด้วยตนเอง ตอบกลับภายใน 3 วันทำการ",
    successTitle: "ได้รับใบสมัครแล้ว ขอบคุณครับ",
    successBody:
      "เราจะพิจารณาใบสมัครของคุณและตอบกลับภายใน 3 วันทำการ หากผ่านการพิจารณา คุณจะได้รับรหัสเชิญทางอีเมล",
    statusTitle: "ตรวจสอบสถานะการสมัคร",
    statusBody:
      "ระบบตรวจสอบสถานะกำลังจะเปิดให้ใช้งานเร็ว ๆ นี้ ระหว่างนี้รอดูในกล่องอีเมล — เราตอบกลับภายใน 3 วันทำการ",
    navFeatures: "ฟีเจอร์",
    navHowItWorks: "วิธีการใช้งาน",
    navFaq: "คำถามที่พบบ่อย",
    navSignIn: "เข้าสู่ระบบ",
    backToHome: "กลับหน้าหลัก",
    heroHeadline: "POS ออกบูธสำหรับ SME",
    heroSubheadline: "ขายได้เร็ว. สต็อกชัดเจน. รายงานน่าเชื่อถือ.",
    heroBody: "ขายได้เร็วขึ้นที่งาน ดูสต็อกได้ชัดเจน และปิดวันขายพร้อมรายงานที่ไว้วางใจได้",
    heroCtaPrimary: "ทดลองใช้ / สมัคร",
    heroCtaSecondary: "ดูวิธีการใช้งาน",
    heroTrustNote: "สมัครทดลองใช้ผ่านคนจริง เราช่วยเซ็ตอัปให้",
    audiencesHeading: "สร้างมาสำหรับแบรนด์เล็กที่ขายในงานจริง",
    audiencesBody: "Mochi POS สำหรับผู้ขายที่ต้องการระบบบูธใช้งานได้จริง ไม่ใช่ระบบองค์กรที่ซับซ้อน",
    audiences: [
      "ร้านออกบูธสินค้า",
      "ร้าน Pop-up",
      "ผู้ขายในงานอีเวนต์",
      "แบรนด์รีเทลขนาดเล็ก",
      "แบรนด์ที่เตรียมออกงานหลายวัน",
    ],
    featuresHeading: "ทุกอย่างที่ร้านออกบูธต้องการ",
    featuresBody: "รวมการชำระเงิน สต็อก และรายงาน ในกระบวนการเดียวที่ทีมเข้าใจได้ทันที",
    benefits: [
      { title: "เช็คเอาต์เร็ว", body: "รับออเดอร์ได้รวดเร็วบนแท็บเล็ตหรือโน้ตบุ๊ก แม้ช่วงบูธแน่น" },
      { title: "จัดการสต็อกง่าย", body: "ติดตามสต็อกงาน ของตัวอย่าง และการเติมสินค้า โดยไม่ต้องจดบนกระดาษ" },
      { title: "รายงานชัดเจน", body: "ดูยอดขายรายวัน วิธีชำระเงิน และสรุปงาน หลังเลิกขายแต่ละวัน" },
      { title: "ตั้งค่าสินค้า", body: "จัดการสินค้า SKU ราคา และสต็อกเริ่มต้นก่อนงานเปิด" },
      { title: "รองรับ QR", body: "ออกแบบมาสำหรับการขายแบบ QR และ PromptPay โดยเฉพาะ" },
    ],
    howItWorksHeading: "วิธีการใช้งาน",
    steps: [
      { title: "สมัครหรือลองใช้ Demo", body: "บอกเราเกี่ยวกับแบรนด์และงานที่จะออก เราพิจารณาคัดเลือกด้วยตนเอง" },
      { title: "ตั้งค่าสินค้าและสต็อก", body: "เพิ่มสินค้า SKU ราคา และสต็อกเริ่มต้นสำหรับแต่ละงาน" },
      { title: "ขายที่บูธ", body: "ใช้ POS บันทึกยอดขาย ประเภทการชำระ ของตัวอย่าง และการแก้ไข" },
      { title: "ปิดวัน", body: "ตรวจสอบยอดขาย เงินสด และความเคลื่อนไหวของสต็อกก่อนทีมกลับบ้าน" },
    ],
    contactHeading: "คุณไม่ต้องเซ็ตอัปคนเดียว",
    contactBody: "ตอนนี้ Mochi POS เปิดให้กับผู้ใช้กลุ่มแรกที่คัดเลือกมา เราพิจารณาใบสมัครแต่ละใบ ช่วยเซ็ตอัป workspace แรก และรวบรวม feedback เพื่อปรับปรุงก่อนเปิดกว้างมากขึ้น",
    dataHeading: "ข้อมูลยอดขายของคุณเป็นของคุณเท่านั้น",
    dataBody: "Mochi POS ใช้การแบ่งสิทธิ์แบบ workspace แต่ละร้านเห็นแค่สินค้า ออเดอร์ สต็อก และรายงานของตัวเอง เราใช้ข้อมูลใบสมัครเพื่อพิจารณาและติดต่อเรื่องการเซ็ตอัปเท่านั้น ไม่นำข้อมูลลูกค้าหรือยอดขายของคุณไปขาย",
    dataFootnote: "สัญญาง่าย ๆ: ควบคุมสิทธิ์อย่างรัดกุม ดูแลข้อมูลอย่างระมัดระวัง ไม่มีคำโอ้อวดแบบองค์กร",
    faqHeading: "คำถามก่อนลองใช้ Mochi POS",
    faqs: [
      { q: "Mochi POS ทดลองใช้ฟรีไหม?", a: "สิทธิ์ใช้งานกลุ่มแรกพิจารณาเป็นรายกรณี สมัครได้เลยแล้วเราจะติดต่อแจ้งรายละเอียดโครงการนำร่อง" },
      { q: "ต้องใช้อุปกรณ์อะไร?", a: "แท็บเล็ตหรือโน้ตบุ๊กที่ต่ออินเทอร์เน็ตได้เหมาะที่สุด" },
      { q: "รองรับการชำระด้วย QR ได้ไหม?", a: "ได้ Mochi POS ออกแบบมาสำหรับการขายแบบ QR และ PromptPay โดยเฉพาะ" },
      { q: "ใช้กับงานหลายวันได้ไหม?", a: "ได้ ระบบรองรับสต็อกงานและรายงานรายวัน" },
      { q: "ต้องมีความรู้ด้านเทคนิคไหม?", a: "ไม่ต้อง เราช่วยผู้ใช้กลุ่มแรกเริ่มต้นและเข้าใจการเซ็ตอัป" },
      { q: "ใครจะซัพพอร์ตเรา?", a: "VC เป็นผู้ติดต่อหลักสำหรับสิทธิ์ใช้งานกลุ่มแรกและคำถามเรื่องการเซ็ตอัป" },
    ],
    applyHeading: "สมัครใช้งานกลุ่มแรก",
    applyBody: "บอกเราเกี่ยวกับแบรนด์ สินค้า และงานที่จะออก เราจะพิจารณาใบสมัครและติดต่อแจ้งขั้นตอนต่อไป",
    applyBoxHeading: "ใช้งานกลุ่มแรก พร้อมซัพพอร์ตจากทีมงาน",
    applyBoxBody: "ไม่จำเป็นต้องมีความรู้ด้านเทคนิค เราจะช่วยให้คุณเข้าใจการเซ็ตอัปและตัดสินใจว่า Mochi POS เหมาะกับกระบวนการออกบูธของคุณหรือไม่",
    applyAsideHeading: "เริ่มต้นสมัคร",
    applyAsideBody: "เราพิจารณาใบสมัครทุกใบด้วยตนเอง ตอบกลับภายใน 3 วันทำการ",
    heroPreviewKicker: "ระบบขายงาน",
    heroPreviewTitle: "บูธ POS",
    heroPreviewStatus: "กำลังเปิดขาย",
    heroPreviewToday: "วันนี้",
    heroPreviewFooter: "สต็อก เงินสด QR และปิดวัน ในระบบเดียว",
    alreadyApproved: "ได้รับการอนุมัติแล้วใช่ไหม?",
    redeemInvite: "ใช้รหัสเชิญ",
  },
  appHome: {
    title: "เปิดร้าน",
    subtitle: "เลือกขั้นตอนต่อไป",
    tilePosTitle: "POS",
    tilePosBody: "ขายของที่บูธทันที",
    tileProductsTitle: "สินค้า",
    tileProductsBody: "ตั้งค่า SKU ราคา รูปภาพ",
    tileEventsTitle: "งาน",
    tileEventsBody: "สร้างงาน จัดสรรสต็อกต่อ SKU แล้วเริ่มขาย",
    tileDashboardTitle: "แดชบอร์ด",
    tileDashboardBody: "ยอดขายและสต็อกของวันนี้",
    tileSendLaterTitle: "จัดส่งทีหลัง",
    tileSendLaterBody: "จัดส่งออเดอร์ที่ค้างอยู่",
    tileCorrectionsTitle: "แก้ไขรายการ",
    tileCorrectionsBody: "ยกเลิกออเดอร์ คืนสต็อก",
    tileAuditLogTitle: "บันทึกการเปลี่ยนแปลง",
    tileAuditLogBody: "ตั้งค่า สินค้า ยอดขาย การยกเลิก — เก็บไว้อ่านอย่างเดียว",
    tileCloseDayTitle: "ปิดวัน",
    tileCloseDayBody: "ตรวจนับเงินสดเทียบกับยอดขายของวัน",
    tileStockCountTitle: "นับสต็อก",
    tileStockCountBody: "เดินนับคลัง ตรวจสอบ แก้ไขส่วนต่างหลังงาน",
    tileSampleBucketTitle: "ของตัวอย่าง",
    tileSampleBucketBody: "ย้ายสต็อกระหว่างสินค้าขายได้และของโชว์",
    tileCustomersTitle: "ลูกค้า",
    tileCustomersBody: "ประวัติ ยอดซื้อรวม สินค้าที่ซื้อบ่อยต่อเบอร์",
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
