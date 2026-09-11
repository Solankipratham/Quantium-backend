import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data");
const dbFile = path.join(dir, "quantum-store.json");

export function generateId() {
  return "id_" + crypto.randomBytes(8).toString("hex");
}

const EMPTY = {
  users: [],
  students: [],
  payments: [],
  batches: [],
  expenses: [],
  feephans: [],
  feeplans: [],
  auditlogs: [],
  notifications: [],
  settings: []
};

let state = null;
let saveTimer = null;

function deepClone(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

export function loadState() {
  if (state) return state;
  if (!fs.existsSync(dbFile)) {
    state = deepClone(EMPTY);
    persist();
    return state;
  }
  try {
    const raw = fs.readFileSync(dbFile, "utf8");
    const parsed = JSON.parse(raw);
    state = { ...deepClone(EMPTY), ...parsed };
  } catch {
    state = deepClone(EMPTY);
  }
  return state;
}

export function persist() {
  if (!state) return;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(state, null, 2), "utf8");
    } catch (e) {
      console.error("[fileStore] persist error:", e.message);
    }
  }, 250);
}

function collectionName(model) {
  const map = {
    User: "users",
    Student: "students",
    Payment: "payments",
    Batch: "batches",
    Expense: "expenses",
    FeePlan: "feeplans",
    AuditLog: "auditlogs",
    Notification: "notifications",
    Setting: "settings"
  };
  if (map[model]) return map[model];
  return model.toLowerCase() + "s";
}

function matches(doc, filter) {
  if (!filter) return true;
  for (const key of Object.keys(filter)) {
    const expected = filter[key];
    const actual = doc[key];
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if (expected.$gte !== undefined && !(actual >= expected.$gte)) return false;
      if (expected.$lte !== undefined && !(actual <= expected.$lte)) return false;
      if (expected.$gt !== undefined && !(actual > expected.$gt)) return false;
      if (expected.$lt !== undefined && !(actual < expected.$lt)) return false;
      if (expected.$ne !== undefined && actual === expected.$ne) return false;
      if (expected.$in && !(expected.$in.includes(actual))) return false;
      if (expected.$nin && expected.$nin.includes(actual)) return false;
      if (expected.$exists !== undefined && (actual === undefined) !== !expected.$exists) return false;
      if (expected.$regex !== undefined && !String(actual ?? "").match(new RegExp(expected.$regex, "i"))) return false;
    } else if (expected && typeof expected === "object" && Array.isArray(expected)) {
      // array field, check contains any
      if (!Array.isArray(actual)) return false;
      if (!expected.some((v) => actual.includes(v))) return false;
    } else {
      if (actual !== expected) return false;
    }
  }
  return true;
}

const store = {
  activeDriver: "file",
  model(name) {
    const coll = () => loadState()[collectionName(name)] || (loadState()[collectionName(name)] = []);

    return {
      async find(filter = {}, sort = null) {
        let list = coll().filter((d) => matches(d, filter));
        if (sort) {
          const [key, order] = Object.entries(sort)[0];
          list = [...list].sort((a, b) => {
            if (a[key] == null && b[key] == null) return 0;
            if (a[key] == null) return 1;
            if (b[key] == null) return -1;
            const av = a[key] instanceof Date ? a[key].getTime() : a[key];
            const bv = b[key] instanceof Date ? b[key].getTime() : b[key];
            if (av === bv) return 0;
            return (av < bv ? -1 : 1) * order;
          });
        }
        return deepClone(list);
      },
      async findById(id) {
        const doc = coll().find((d) => d.id === id);
        return doc ? deepClone(doc) : null;
      },
      async findOne(filter = {}) {
        const doc = coll().find((d) => matches(d, filter));
        return doc ? deepClone(doc) : null;
      },
      async count(filter = {}) {
        return coll().filter((d) => matches(d, filter)).length;
      },
      async create(data) {
        const nd = {
          ...deepClone(data),
          id: data.id || generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        coll().push(nd);
        persist();
        return deepClone(nd);
      },
      async updateById(id, patch = {}) {
        const collArr = coll();
        const idx = collArr.findIndex((d) => d.id === id);
        if (idx === -1) return null;
        const merged = { ...collArr[idx], ...deepClone(patch), id, updatedAt: new Date().toISOString() };
        collArr[idx] = merged;
        persist();
        return deepClone(merged);
      },
      async deleteById(id) {
        const collArr = coll();
        const idx = collArr.findIndex((d) => d.id === id);
        if (idx === -1) return null;
        const removed = collArr.splice(idx, 1)[0];
        persist();
        return deepClone(removed);
      },
      async deleteMany(filter = {}) {
        const collArr = coll();
        const before = collArr.length;
        loadState()[collectionName(name)] = collArr.filter((d) => !matches(d, filter));
        persist();
        return before - loadState()[collectionName(name)].length;
      },
      async findOneAndUpdate(filter = {}, patch = {}, opts = {}) {
        const collArr = coll();
        const idx = collArr.findIndex((d) => matches(d, filter));
        if (idx === -1) {
          if (opts.upsert) {
            const nd = { ...filter, ...deepClone(patch), id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            collArr.push(nd);
            persist();
            return deepClone(nd);
          }
          return null;
        }
        const merged = { ...collArr[idx], ...deepClone(patch), id: collArr[idx].id, updatedAt: new Date().toISOString() };
        collArr[idx] = merged;
        persist();
        return deepClone(merged);
      },
      countDocuments(filter = {}) {
        return Promise.resolve(coll().filter((d) => matches(d, filter)).length);
      },
      distinct(field) {
        return Promise.resolve([...new Set(coll().map((d) => d[field]).filter((v) => v !== undefined && v !== null && v !== ""))]);
      }
    };
  },
  connection: () => ({
    readyState: 1
  })
};

export default store;