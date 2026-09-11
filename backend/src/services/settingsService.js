import { getStore } from "../data/store.js";

const DEFAULTS = {
  coaching: {
    name: "Quantum",
    tagline: "Academy",
    address: "",
    phone: "",
    email: ""
  },
  fee: {
    defaultDueDate: 10,
    defaultPaymentCycle: "Monthly",
    allowAdvancePayments: false
  },
  receipt: {
    prefix: "QTM",
    startNumber: 1,
    pattern: "{prefix}-{number}"
  },
  profile: {
    currency: "₹"
  }
};

const SINGLE_KEY = "app";

export async function getSettings(store) {
  const s = store || (await getStore());
  const row = await s.model("Setting").findOne({ key: SINGLE_KEY });
  const current = row?.value || {};
  return {
    ...JSON.parse(JSON.stringify(DEFAULTS)),
    ...current,
    receipt: { ...DEFAULTS.receipt, ...(current.receipt || {}) },
    coaching: { ...DEFAULTS.coaching, ...(current.coaching || {}) },
    fee: { ...DEFAULTS.fee, ...(current.fee || {}) },
    profile: { ...DEFAULTS.profile, ...(current.profile || {}) }
  };
}

export async function saveSettings(patch) {
  const store = await getStore();
  const row = await store.model("Setting").findOneAndUpdate(
    { key: SINGLE_KEY },
    { value: patch },
    { upsert: true, new: true }
  );
  return getSettings(store);
}

export function renderReceiptNumber(settings, number) {
  const { prefix, pattern } = settings.receipt;
  const n = String(Number(number) || 1).padStart(4, "0");
  const rendered = (pattern || "{prefix}-{number}").replace("{prefix}", prefix).replace("{number}", n);
  return rendered;
}

export async function getNextReceiptNumber() {
  const store = await getStore();
  const row = await store.model("Setting").findOne({ key: "receiptCounter" });
  const current = row?.value || 0;
  const next = Number(current) + 1;
  await store.model("Setting").findOneAndUpdate({ key: "receiptCounter" }, { value: next }, { upsert: true });
  return next;
}

export function buildReceiptNumber(settings, counter) {
  return renderReceiptNumber(settings, counter);
}