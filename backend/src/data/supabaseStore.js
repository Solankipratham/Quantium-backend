import { getSupabase, isSupabaseConfigured, getSupabaseInitError } from "../lib/supabase.js";
import fileStore from "./fileStore.js";

const tableMap = {
  User: "profiles",
  Student: "students",
  Payment: "payments",
  Batch: "batches",
  Expense: "expenses",
  FeePlan: "courses",
  AuditLog: "audit_logs",
  Notification: "notifications",
  Setting: "fee_settings",
  MonthlyFee: "monthly_fees",
};

const fieldMap = {
  studentId: "student_code",
  name: "full_name",
  parentName: "guardian_name",
  parentPhone: "alternate_phone",
  dob: "date_of_birth",
  totalFee: "total_course_fee",
  monthlyFee: "monthly_fee",
  finalFee: "final_fee",
  photo: "photo_url",
  course: "course_name",
  batch: "batch_name",
  teacher: "teacher",
  subject: "subject",
  joiningDate: "joining_date",
  firstDueDate: "first_due_date",
  monthlyDueDate: "monthly_due_day",
  nextDueDate: "next_due_date",
  admissionFee: "admission_fee",
  paymentPlan: "payment_plan",
  createdAt: "created_at",
  updatedAt: "updated_at",
  deletedAt: "deleted_at",
  deletedBy: "deleted_by",
  isDeleted: "is_deleted",
  studentName: "student_name",
  amount: "amount",
  date: "payment_date",
  method: "payment_method",
  paymentFor: "payment_for",
  receiptNumber: "receipt_number",
  recordedBy: "created_by",
  paymentId: "transaction_id",
  course: "course_name",
  teacher: "faculty_name",
  startTime: "start_time",
  endTime: "end_time",
  active: "status",
  days: "days",
  course: "name",
  yearlyFee: "yearly_fee",
  quarterlyFee: "quarterly_fee",
  halfYearlyFee: "half_yearly_fee",
  admissionFee: "admission_fee",
  userId: "user_id",
  userName: "user_name",
  entity: "entity_type",
  entityId: "entity_id",
  ip: "ip",
  type: "type",
  title: "title",
  message: "message",
  isRead: "is_read",
  key: "key",
  value: "value",
};

const ignoreFields = new Set(["paid", "pending", "status", "daysOverdue", "nextDueDate", "lastPayment", "monthlyRecords", "currentMonth", "studentName", "studentCourse", "studentBatch"]);

const reverseFieldMap = Object.fromEntries(
  Object.entries(fieldMap).map(([k, v]) => [v, k])
);

const modelFieldMap = {
  Student: {
    studentId: "student_code",
    name: "full_name",
    parentName: "guardian_name",
    parentPhone: "alternate_phone",
    dob: "date_of_birth",
    totalFee: "total_course_fee",
    monthlyFee: "monthly_fee",
    finalFee: "final_fee",
    photo: "photo_url",
    course: "course_name",
    batch: "batch_name",
    teacher: "teacher",
    subject: "subject",
    joiningDate: "joining_date",
    firstDueDate: "first_due_date",
    monthlyDueDate: "monthly_due_day",
    nextDueDate: "next_due_date",
    admissionFee: "admission_fee",
    paymentPlan: "payment_plan",
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    deletedBy: "deleted_by",
    isDeleted: "is_deleted",
    is_deleted: "is_deleted",
  },
  Payment: {
    studentId: "student_id",
    studentName: "student_name",
    amount: "amount",
    date: "payment_date",
    method: "payment_method",
    paymentFor: "payment_for",
    receiptNumber: "receipt_number",
    recordedBy: "created_by",
    paymentId: "transaction_id",
  },
  Batch: {
    course: "course_name",
    teacher: "faculty_name",
    startTime: "start_time",
    endTime: "end_time",
    active: "status",
    days: "days",
  },
  FeePlan: {
    course: "name",
    monthlyFee: "monthly_fee",
    yearlyFee: "yearly_fee",
    quarterlyFee: "quarterly_fee",
    halfYearlyFee: "half_yearly_fee",
    admissionFee: "admission_fee",
  },
  AuditLog: {
    userId: "user_id",
    userName: "user_name",
    entity: "entity_type",
    entityId: "entity_id",
    ip: "ip",
  },
  Notification: {
    isRead: "is_read",
  },
};

function columnFor(model, field) {
  return modelFieldMap[model]?.[field] || fieldMap[field] || field;
}

function toSupabaseRow(model, data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (ignoreFields.has(k)) continue;
    const col = columnFor(model, k);
    out[col] = v;
  }
  if (model === "Payment" && data.studentId) {
    out.student_id = data.studentId;
    delete out.student_code;
  }
  if (model === "Student" && data.studentId) {
    out.student_code = data.studentId;
  }
  if (model === "Batch") {
    if (data.course !== undefined) { out.course_name = data.course; delete out.course; }
    if (data.teacher !== undefined) { out.faculty_name = data.teacher; delete out.teacher; }
    if (data.active !== undefined) { out.status = data.active ? "active" : "inactive"; delete out.active; }
  }
  if (model === "FeePlan") {
    if (data.course !== undefined) { out.name = data.course; delete out.course; }
    if (data.monthlyFee !== undefined) { out.monthly_fee = data.monthlyFee; delete out.monthlyFee; }
    if (data.quarterlyFee !== undefined) { out.quarterly_fee = data.quarterlyFee; delete out.quarterlyFee; }
    if (data.halfYearlyFee !== undefined) { out.half_yearly_fee = data.halfYearlyFee; delete out.halfYearlyFee; }
    if (data.yearlyFee !== undefined) { out.yearly_fee = data.yearlyFee; delete out.yearlyFee; }
    if (data.admissionFee !== undefined) { out.admission_fee = data.admissionFee; delete out.admissionFee; }
    if (data.courseFee !== undefined) { out.course_fee = data.courseFee; delete out.courseFee; }
  }
  if (model === "User") {
    if (data.name !== undefined) { out.full_name = data.name; delete out.name; }
    delete out.password;
    delete out.username;
    delete out.active;
  }
  if (model === "Student" && data.totalFee !== undefined) {
    const total = Number(data.totalFee) || 0;
    const discount = Number(data.discount) || 0;
    const finalFee = data.finalFee !== undefined ? Number(data.finalFee) : total - discount;
    out.final_fee = finalFee;
    if (data.totalFee !== undefined) out.total_course_fee = total;
    if (data.discount !== undefined) out.discount = discount;
  }
  return out;
}

function fromSupabaseRow(model, row) {
  if (!row) return null;
  const out = { ...row };

  for (const [supa, legacy] of Object.entries(reverseFieldMap)) {
    if (supa in out && !(legacy in out)) {
      out[legacy] = out[supa];
    }
  }

  if (model === "Student") {
    out.id = row.id;
    if (row.student_code) out.studentId = row.student_code;
    if (row.full_name) out.name = row.full_name;
    if (row.date_of_birth) out.dob = row.date_of_birth;
    if (row.alternate_phone) out.parentPhone = row.alternate_phone;
    if (row.guardian_name) out.parentName = row.guardian_name;
    if (row.total_course_fee) out.totalFee = Number(row.total_course_fee);
    if (row.monthly_fee) out.monthlyFee = Number(row.monthly_fee);
    if (row.final_fee) out.finalFee = Number(row.final_fee);
    if (row.admission_fee) out.admissionFee = Number(row.admission_fee);
    if (row.discount) out.discount = Number(row.discount);
    if (row.photo_url) out.photo = row.photo_url;
    if (row.course_name) out.course = row.course_name;
    if (row.batch_name) out.batch = row.batch_name;
    if (row.joining_date) out.joiningDate = row.joining_date;
    if (row.first_due_date) out.firstDueDate = row.first_due_date;
    if (row.monthly_due_day) out.monthlyDueDate = row.monthly_due_day;
    if (row.next_due_date) out.nextDueDate = row.next_due_date;
    if (row.payment_plan) out.paymentPlan = row.payment_plan;
    if (row.teacher) out.teacher = row.teacher;
    if (row.subject) out.subject = row.subject;
  }

  if (model === "Payment") {
    out.id = row.id;
    if (row.student_id) out.studentId = row.student_id;
    if (row.payment_date) out.date = row.payment_date;
    if (row.payment_method) out.method = row.payment_method;
    if (row.receipt_number) out.receiptNumber = row.receipt_number;
    if (row.payment_for) out.paymentFor = row.payment_for;
    if (row.created_by) out.recordedBy = row.created_by;
    if (row.transaction_id) out.paymentId = row.transaction_id;
  }

  if (model === "Batch") {
    if (row.faculty_name) out.teacher = row.faculty_name;
    if (row.start_time) out.startTime = row.start_time;
    if (row.end_time) out.endTime = row.end_time;
    if (row.course_name) out.course = row.course_name;
    if (row.room) out.room = row.room;
    if (row.days && typeof row.days === "string") {
      out.days = row.days.split(",").map(d => d.trim());
    } else if (Array.isArray(row.days)) {
      out.days = row.days;
    }
    out.active = row.status === "active";
  }

  if (model === "FeePlan") {
    if (row.name) out.course = row.name;
    if (row.monthly_fee) out.monthlyFee = Number(row.monthly_fee);
    if (row.quarterly_fee) out.quarterlyFee = Number(row.quarterly_fee);
    if (row.half_yearly_fee) out.halfYearlyFee = Number(row.half_yearly_fee);
    if (row.yearly_fee) out.yearlyFee = Number(row.yearly_fee);
    if (row.admission_fee) out.admissionFee = Number(row.admission_fee);
    if (row.course_fee) out.courseFee = Number(row.course_fee);
  }

  if (model === "User") {
    if (row.full_name) out.name = row.full_name;
    out.active = true;
  }

  if (model === "AuditLog") {
    if (row.user_id) out.userId = row.user_id;
    if (row.user_name) out.userName = row.user_name;
    if (row.entity_type) out.entity = row.entity_type;
    if (row.entity_id) out.entityId = row.entity_id;
  }

  if (model === "Notification") {
    if (row.is_read !== undefined) out.isRead = row.is_read;
  }

  return out;
}

const _tableReadyCache = {};

function isTableReady(tableName) {
  return _tableReadyCache[tableName] === true;
}

function markTableReady(tableName) {
  _tableReadyCache[tableName] = true;
}

function markTableNotReady(tableName) {
  _tableReadyCache[tableName] = false;
}

function makeModel(name) {
  const supaTable = tableMap[name] || name.toLowerCase() + "s";
  const useSupa = isSupabaseConfigured() && [
    "students", "batches", "courses", "monthly_fees", "payments", "profiles", "audit_logs",
    "notifications", "fee_settings", "student_notes", "student_documents"
  ].includes(tableMap[name]);

  if (!useSupa) return fileStore.model(name);

  const sb = getSupabase();
  if (!sb) return fileStore.model(name);

  const storeMethods = {
    async find(filter = {}, sort = null) {
      try {
        let q = sb.from(supaTable).select("*");
        for (const [k, v] of Object.entries(filter)) {
          if (v === null || v === undefined) continue;
          const col = columnFor(name, k);
          if (typeof v === "object" && !Array.isArray(v) && v !== null) {
            if (v.$ne !== undefined) q = q.neq(col, v.$ne);
            else if (v.$gte !== undefined) q = q.gte(col, v.$gte);
            else if (v.$lte !== undefined) q = q.lte(col, v.$lte);
            else if (v.$gt !== undefined) q = q.gt(col, v.$gt);
            else if (v.$lt !== undefined) q = q.lt(col, v.$lt);
            else if (v.$in) q = q.in(col, v.$in);
            else if (v.$regex) q = q.ilike(col, `%${v.$regex}%`);
            else if (v.$exists !== undefined) {
              if (v.$exists) q = q.not(col, "is", null);
              else q = q.is(col, null);
            }
          } else if (Array.isArray(v)) {
            q = q.in(col, v);
          } else {
            q = q.eq(col, v);
          }
        }
        if (sort && typeof sort === "object") {
          for (const [key, order] of Object.entries(sort)) {
            const col = columnFor(name, key);
            q = q.order(col, { ascending: order === 1 });
          }
        }
        const { data, error } = await q;
        if (error) throw error;
        markTableReady(supaTable);
        return (data || []).map(r => fromSupabaseRow(name, r));
      } catch (e) {
        if (e.message?.includes("does not exist") || e.code === "42P01" || e.message?.includes("relation") || e.message?.includes("table")) {
          markTableNotReady(supaTable);
          console.warn(`[supabase] table ${supaTable} not found — using fileStore`);
        } else {
          console.warn(`[supabase] find(${supaTable}) error:`, e.message);
        }
        return fileStore.model(name).find(filter, sort);
      }
    },

    async findById(id) {
      try {
        const { data, error } = await sb.from(supaTable).select("*").eq("id", id).single();
        if (error && error.code === "PGRST116") return null;
        if (error) throw error;
        markTableReady(supaTable);
        return fromSupabaseRow(name, data);
      } catch (e) {
        if (e.message?.includes("does not exist") || e.code === "42P01" || e.message?.includes("relation") || e.message?.includes("table")) {
          markTableNotReady(supaTable);
        }
        return fileStore.model(name).findById(id);
      }
    },

    async findOne(filter = {}) {
      const res = await this.find(filter, null);
      return res[0] || null;
    },

    async count(filter = {}) {
      try {
        let q = sb.from(supaTable).select("*", { count: "exact", head: true });
        for (const [k, v] of Object.entries(filter)) {
          if (v === null || v === undefined) continue;
          const col = columnFor(name, k);
          if (typeof v === "object" && !Array.isArray(v) && v !== null) {
            if (v.$ne !== undefined) q = q.neq(col, v.$ne);
            else if (v.$gte !== undefined) q = q.gte(col, v.$gte);
            else if (v.$lte !== undefined) q = q.lte(col, v.$lte);
          } else {
            q = q.eq(col, v);
          }
        }
        const { count, error } = await q;
        if (error) throw error;
        markTableReady(supaTable);
        return count || 0;
      } catch (e) {
        return fileStore.model(name).count(filter);
      }
    },

    async create(data) {
      try {
        const row = toSupabaseRow(name, data);
        if (!row.id) delete row.id;
        const { data: inserted, error } = await sb.from(supaTable).insert(row).select().single();
        if (error) throw error;
        markTableReady(supaTable);
        return fromSupabaseRow(name, inserted);
      } catch (e) {
        const isTableMissing = e.message?.includes("does not exist") || e.code === "42P01" || e.message?.includes("relation") || e.message?.includes("table");
        if (isTableMissing) {
          console.warn(`[supabase] create(${supaTable}) table not found — using fileStore`);
          return fileStore.model(name).create(data);
        }
        console.error(`[supabase] create(${supaTable}) FAILED:`, e.message);
        throw e;
      }
    },

    async updateById(id, patch = {}) {
      try {
        const row = toSupabaseRow(name, patch);
        delete row.id;
        const { data, error } = await sb.from(supaTable).update(row).eq("id", id).select().single();
        if (error) throw error;
        markTableReady(supaTable);
        return fromSupabaseRow(name, data);
      } catch (e) {
        const isTableMissing = e.message?.includes("does not exist") || e.code === "42P01" || e.message?.includes("relation") || e.message?.includes("table");
        if (isTableMissing) {
          console.warn(`[supabase] updateById(${supaTable}) table not found — using fileStore`);
          return fileStore.model(name).updateById(id, patch);
        }
        console.error(`[supabase] updateById(${supaTable}) FAILED:`, e.message);
        throw e;
      }
    },

    async deleteById(id) {
      try {
        const { data, error } = await sb.from(supaTable).delete().eq("id", id).select().single();
        if (error) throw error;
        markTableReady(supaTable);
        return fromSupabaseRow(name, data);
      } catch (e) {
        const isTableMissing = e.message?.includes("does not exist") || e.code === "42P01" || e.message?.includes("relation") || e.message?.includes("table");
        if (isTableMissing) {
          console.warn(`[supabase] deleteById(${supaTable}) table not found — using fileStore`);
          return fileStore.model(name).deleteById(id);
        }
        console.error(`[supabase] deleteById(${supaTable}) FAILED:`, e.message);
        throw e;
      }
    },

    async deleteMany(filter = {}) {
      try {
        let q = sb.from(supaTable).delete();
        for (const [k, v] of Object.entries(filter)) {
          const col = columnFor(name, k);
          q = q.eq(col, v);
        }
        const { error, count } = await q;
        if (error) throw error;
        markTableReady(supaTable);
        return count || 0;
      } catch (e) {
        const isTableMissing = e.message?.includes("does not exist") || e.code === "42P01" || e.message?.includes("relation") || e.message?.includes("table");
        if (isTableMissing) {
          console.warn(`[supabase] deleteMany(${supaTable}) table not found — using fileStore`);
          return fileStore.model(name).deleteMany(filter);
        }
        console.error(`[supabase] deleteMany(${supaTable}) FAILED:`, e.message);
        throw e;
      }
    },

    async findOneAndUpdate(filter = {}, patch = {}, opts = {}) {
      const existing = await this.findOne(filter);
      if (!existing) {
        if (opts.upsert) return this.create({ ...filter, ...patch });
        return null;
      }
      return this.updateById(existing.id, patch);
    },

    countDocuments(filter = {}) {
      return this.count(filter);
    },

    async distinct(field) {
      try {
        const col = columnFor(name, field);
        const { data, error } = await sb.from(supaTable).select(col);
        if (error) throw error;
        markTableReady(supaTable);
        return [...new Set((data || []).map(r => r[col]).filter(Boolean))];
      } catch (e) {
        console.warn(`[supabase] distinct(${supaTable}.${field}) error:`, e.message);
        return fileStore.model(name).distinct(field);
      }
    },
  };

  return storeMethods;
}

const store = {
  get activeDriver() {
    return isSupabaseConfigured() ? "supabase" : "file";
  },

  model(name) {
    return makeModel(name);
  },

  connection: () => ({ readyState: isSupabaseConfigured() ? 1 : 1 }),
};

export default store;
