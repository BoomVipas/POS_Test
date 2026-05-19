# Reading TypeScript without learning to write it

> A 10-minute cheat sheet so the type annotations in MochiPOS stop looking scary. You don't need to write TypeScript — but you'll *read* it constantly, and a few patterns repeat. Companion to [LEARNING.md](LEARNING.md) and [LEARNING_GLOSSARY.md](LEARNING_GLOSSARY.md).

---

## The 1-minute version

TypeScript is JavaScript + labels that say what shape values must have. The labels:
- run only at edit/build time (the browser sees plain JS),
- catch typos and shape mismatches before you ship.

Every label is just a contract. Read them as: *"this thing must look like X."*

---

## The 10 patterns you'll see most

### 1. Type annotation on a variable
```ts
const total: number = 1000;
```
*"`total` must be a number."*

You'll rarely see this in MochiPOS because TS infers the type from the right side. But when you see it, that's all it means.

### 2. Type annotation on a function parameter
```ts
function format(amount: number, currency: string) { ... }
```
*"This function takes a number and a string."*

If you call `format("hello", 5)` it errors at edit time.

### 3. Function return type
```ts
function format(amount: number): string { ... }
```
The `: string` after the parens means "this function returns a string."

### 4. Optional parameter / field
```ts
type Customer = {
  name: string;
  phone?: string;
}
```
The `?` means "this can be missing." `Customer.phone` might be `string` or `undefined`.

### 5. Union type
```ts
type PaymentMethod = "cash" | "promptpay" | "transfer" | "card" | "other";
```
*"Must be exactly one of these strings."* Trying to set `payment_method = "bitcoin"` errors.

You'll see this *all over* MochiPOS for status fields, payment methods, fulfillment types. It's how the database's `check (status in (...))` constraints get mirrored in TypeScript.

### 6. Object type
```ts
type Product = {
  id: string;
  workspace_id: string;
  name: string;
  price_satang: number;
  is_active: boolean;
  image_path: string | null;
}
```
*"A product object must have these fields with these types."*

`string | null` means "either a string or null" — common for nullable database columns. (The real `Product` in `src/lib/pos/types.ts` has a few more fields — `sku`, `category`, `current_qty`, optional `cost_satang`, `reorder_point`, `upsellSkus`, `pinned`. This is the simplified core.)

### 7. Array type
```ts
const skus: string[] = ["A1", "B2", "C3"];
```
*"Array of strings."* Read `[]` as "array of."

You'll also see `Array<string>` — same thing, different syntax.

### 8. Generics (don't panic)
```ts
function first<T>(items: T[]): T | undefined { ... }
```
The `<T>` is a placeholder type. *"Whatever type you call this with, the result is the same type."* So `first<string>([...])` returns `string | undefined`; `first<Product>([...])` returns `Product | undefined`.

You'll mostly *use* generics through library functions (React's `useState<Customer>(null)`), not write them.

### 9. Type assertion (the `as` keyword)
```ts
const id = formData.get("id") as string;
```
*"Trust me, this is a string."* Used when you know more than the type system does. Be careful — it's a manual override of safety.

In MochiPOS, you'll see `as` mostly when:
- Reading form data (which is typed as `FormDataEntryValue`).
- Casting JSON parsed responses.

### 10. The `Database` type from Supabase
```ts
import type { Database } from "@/lib/database.types";
type Product = Database["public"]["Tables"]["products"]["Row"];
```
*"A `Product` is whatever shape `database.types.ts` says the `products` table's row is."*

This is how MochiPOS keeps the TS types in sync with the database schema. If the database adds a column, `database.types.ts` is updated, and every place that uses `Product` gets the new field automatically (or breaks if it's missing).

---

## Three real patterns from MochiPOS

### Pattern A — A Server Action's signature

From `src/app/apply/actions.ts`:

```ts
export type SubmitApplicationResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitApplication(
  values: ApplicationFormValues,
): Promise<SubmitApplicationResult> { ... }
```

Decoded:
- `SubmitApplicationResult` is *either* a success object `{ok: true}` *or* a failure object with `error` + optional `fieldErrors`.
- `Record<string, string>` = "an object whose keys are strings and whose values are strings" — i.e., a dictionary like `{ email: "Invalid", phone: "Required" }`.
- The function takes an `ApplicationFormValues` (defined elsewhere) and returns a `Promise` (because it's `async`) that resolves to a `SubmitApplicationResult`.

This is everywhere in MochiPOS: discriminated union for results. When you call it, you write:

```ts
const res = await submitApplication(values);
if (res.ok) {
  // here res.error doesn't exist (compiler knows)
} else {
  // here res.error is required (compiler knows)
}
```

The compiler narrows the type based on the `ok` field. Beautiful and safe.

### Pattern B — A React component's props

A simplified shape (not copy-pasted from any one file — the real `ProductFormModal` props are more complex; see `src/app/app/setup/products/ProductFormModal.tsx`):

```ts
type Props = {
  productId: string;
  onClose: () => void;
  initialValues?: Partial<ProductFormValues>;
};

export function ExampleModal({ productId, onClose, initialValues }: Props) { ... }
```

Decoded:
- `productId: string` — required.
- `onClose: () => void` — a function taking nothing and returning nothing (`void`).
- `initialValues?: Partial<ProductFormValues>` — optional. `Partial<X>` means "all fields of X, but each one optional."

When you use this component:

```tsx
<ExampleModal productId="abc" onClose={() => setOpen(false)} />
```

Missing `productId`? Compiler error. Wrong type for `onClose`? Compiler error.

### Pattern C — A hook's return type

From `src/lib/demo/useDemoCustomerTokens.ts`:

```ts
export function useDemoCustomerTokens(): {
  tokens: DemoCustomerToken[];
  portalCustomers: DemoPortalCustomer[];
  ready: boolean;
  create: (orderId: string) => DemoCustomerToken;
  validate: (tokenString: string) => ReturnType<typeof validateToken>;
  claim: (tokenString: string, payload: ClaimPayload) => ClaimResult;
  forOrder: (orderId: string) => DemoCustomerToken[];
  registeredForOrder: (orderId: string) => DemoPortalCustomer[];
  clear: () => void;
} { ... }
```

Decoded: *"This hook returns an object with these named functions and arrays."*

When you call it in a component:

```tsx
const { tokens, create, claim, ready } = useDemoCustomerTokens();
```

Autocomplete works. Calling `tokens.length` works (it's an array). Calling `create("order_123")` works. Calling `create()` errors (missing arg). Calling `nonexistent()` errors.

This is the pattern for every demo-mode hook in MochiPOS. Once you can read this, you can read all of them.

---

## What you'll struggle with at first

### Looking up types
You see `ApplicationFormValues` and don't know what it is. **Ctrl+click on it in your editor** — it'll jump to the definition. That works almost everywhere.

### Long error messages
TypeScript errors can be 8 lines long. Read the **first line** — that's the actual problem. The rest is the type-equality breakdown, which is mostly noise. If the first line says *"Property 'foo' does not exist on type '{ bar: string; baz: number }'"*, the fix is "you typed `foo` and meant something else."

### Generics with multiple parameters
`Map<K, V>` (a key-value map) or `Promise<Result<T>>`. Just substitute mentally: *"Map of K to V"*, *"Promise of Result of T"*.

### `unknown` vs `any`
`any` = "give up on type checking." Avoid.
`unknown` = "I don't know what this is yet, force me to check." Safer.

You'll see `unknown` in error handlers (`catch (e: unknown)`) — the `e` could be anything, so you have to narrow it before using it.

---

## How to use TypeScript in MochiPOS without writing TS

You don't need to design types. You need to:

1. **Read** types when you open a file (so you know what shape data has).
2. **Trust** types when calling existing functions (autocomplete tells you what to pass).
3. **Notice** when the editor shows red squiggles or "Property X does not exist" — that's TypeScript saving you from a runtime bug. Don't dismiss it.
4. **Ask the AI** to add types when you write new code: *"Add proper types to this function. Use the same style as `apply/actions.ts`."*

That's enough to ship.

---

## When to ignore types (rare)

The compiler is right >95% of the time. The other <5%:

- Old library without proper TypeScript support (use `as any` reluctantly).
- A migration where types are temporarily out of sync (use a comment explaining).
- Reading raw JSON whose shape you'll validate at runtime (use `unknown` then narrow with Zod).

If you find yourself fighting the compiler, ask the AI: *"Why is TypeScript complaining here? What's the right fix?"*. 9 times out of 10, the right fix is to make your code match the type, not the other way around.

---

## Bottom line

You don't need TypeScript fluency. You need to:
1. Recognize the patterns in this doc.
2. Ctrl+click into types when you don't recognize them.
3. Treat compiler errors as "I'm helping you" not "I'm yelling at you."

That's the whole skill, applied across hundreds of files.
