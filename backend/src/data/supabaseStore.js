import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import fileStore from "./fileStore.js";

// ── Table mapping (legacy model name → Supabase table) ──────────────
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

// ── Field mapping: legacy field → Supabase column ────────────────────
const fieldMap = {
  // Student
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

  // Payment
  studentName: "student_name",
  amount: "amount",
  date: "payment_date",
  method: "payment_method",
  paymentFor: "payment_for",
  receiptNumber: "receipt_number",
  recordedBy: "created_by",
  paymentId: "transaction_id",

  // Batch
  course: "course_name",
  teacher: "faculty_name",
  startTime: "start_time",
  endTime: "end_time",
  active: "status",
  days: "days",

  // FeePlan / Course
  course: "name",
  yearlyFee: "yearly_fee",
  quarterlyFee: "quarterly_fee",
  halfYearlyFee: "half_yearly_fee",
  admissionFee: "admission_fee",

  // AuditLog
  userId: "user_id",
  userName: "user_name",
  entity: "entity_type",
  entityId: "entity_id",
  ip: "ip",

  // Notification
  type: "type",
  title: "title",
  message: "message",
  isRead: "is_read",

  // Setting
  key: "key",
  value: "value",
};

// Fields that should NOT be sent to Supabase (computed / not columns)
const ignoreFields = new Set(["paid", "pending", "status", "daysOverdue", "nextDueDate", "lastPayment", "monthlyRecords", "currentMonth", "studentName", "studentCourse", "studentBatch"]);

const reverseFieldMap = Object.fromEntries(
  Object.entries(fieldMap).map(([k, v]) => [v, k])
);

// ── Convert legacy fields → Supabase columns ─────────────────────────
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
  // Fix: Payment studentId → student_id (not student_code)
  if (model === "Payment" && data.studentId) {
    out.student_id = data.studentId;
    delete out.student_code;
  }
  // Fix: Student studentId → student_code
  if (model === "Student" && data.studentId) {
    out.student_code = data.studentId;
  }
  // Fix: Batch course → store as course_name, also resolve course_id if it looks like a UUID
  if (model === "Batch") {
    if (data.course !== undefined) {
      out.course_name = data.course;
      delete out.course;
    }
    if (data.teacher !== undefined) {
      out.faculty_name = data.teacher;
      delete out.teacher;
    }
    // Map active boolean to status
    if (data.active !== undefined) {
      out.status = data.active ? "active" : "inactive";
      delete out.active;
    }
  }
  // Fix: FeePlan → courses table
  if (model === "FeePlan") {
    if (data.course !== undefined) { out.name = data.course; delete out.course; }
    if (data.monthlyFee !== undefined) { out.monthly_fee = data.monthlyFee; delete out.monthlyFee; }
    if (data.quarterlyFee !== undefined) { out.quarterly_fee = data.quarterlyFee; delete out.quarterlyFee; }
    if (data.halfYearlyFee !== undefined) { out.half_yearly_fee = data.halfYearlyFee; delete out.halfYearlyFee; }
    if (data.yearlyFee !== undefined) { out.yearly_fee = data.yearlyFee; delete out.yearlyFee; }
    if (data.admissionFee !== undefined) { out.admission_fee = data.admissionFee; delete out.admissionFee; }
    if (data.courseFee !== undefined) { out.course_fee = data.courseFee; delete out.courseFee; }
  }
  // Fix: User → profiles (no password, no username, no active)
  if (model === "User") {
    if (data.name !== undefined) { out.full_name = data.name; delete out.name; }
    delete out.password;
    delete out.username;
    delete out.active;
  }
  // Student finalFee computation
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

// ── Convert Supabase columns → legacy fields ─────────────────────────
function fromSupabaseRow(model, row) {
  if (!row) return null;
  const out = { ...row };

  // Reverse-map known Supabase columns back to legacy names
  for (const [supa, legacy] of Object.entries(reverseFieldMap)) {
    if (supa in out && !(legacy in out)) {
      out[legacy] = out[supa];
    }
  }

  // Student specific
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

  // Payment specific
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

  // Batch specific
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

  // FeePlan/Course specific
  if (model === "FeePlan") {
    if (row.name) out.course = row.name;
    if (row.monthly_fee) out.monthlyFee = Number(row.monthly_fee);
    if (row.quarterly_fee) out.quarterlyFee = Number(row.quarterly_fee);
    if (row.half_yearly_fee) out.halfYearlyFee = Number(row.half_yearly_fee);
    if (row.yearly_fee) out.yearlyFee = Number(row.yearly_fee);
    if (row.admission_fee) out.admissionFee = Number(row.admission_fee);
    if (row.course_fee) out.courseFee = Number(row.course_fee);
  }

  // User/Profile specific
  if (model === "User") {
    if (row.full_name) out.name = row.full_name;
    out.active = true;
  }

  // AuditLog specific
  if (model === "AuditLog") {
    if (row.user_id) out.userId = row.user_id;
    if (row.user_name) out.userName = row.user_name;
    if (row.entity_type) out.entity = row.entity_type;
    if (row.entity_id) out.entityId = row.entity_id;
  }

  // Notification specific
  if (model === "Notification") {
    if (row.is_read !== undefined) out.isRead = row.is_read;
  }

  return out;
}

// ── Determine if model should use Supabase ────────────────────────────
function useSupabaseFor(model) {
  if (!isSupabaseConfigured()) return false;
  const supaTable = tableMap[model];
  const supaTables = ["students", "batches", "courses", "monthly_fees", "payments", "profiles", "audit_logs", "notifications", "fee_settings", "student_notes", "student_documents"];
  return supaTables.includes(supaTable);
}

// ── Store interface ───────────────────────────────────────────────────
const store = {
  activeDriver: isSupabaseConfigured() ? "supabase" : "file",

  model(name) {
    const supaTable = tableMap[name] || name.toLowerCase() + "s";
    const useSupa = useSupabaseFor(name);

    if (!useSupa) {
      return fileStore.model(name);
    }

    const sb = getSupabase();

    return {
      async find(filter = {}, sort = null) {
        let q = sb.from(supaTable).select("*");

        // Apply filters
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

        // Apply sort
        if (sort && typeof sort === "object") {
          for (const [key, order] of Object.entries(sort)) {
            const col = columnFor(name, key);
            q = q.order(col, { ascending: order === 1 });
          }
        }

        const { data, error } = await q;
        if (error) {
          console.error(`[supabase] find(${supaTable}) error:`, error.message);
          throw error;
        }
        return (data || []).map(r => fromSupabaseRow(name, r));
      },

      async findById(id) {
        const { data, error } = await sb.from(supaTable).select("*").eq("id", id).single();
        if (error && error.code === "PGRST116") return null;
        if (error) {
          console.error(`[supabase] findById(${supaTable}) error:`, error.message);
          throw error;
        }
        return fromSupabaseRow(name, data);
      },

      async findOne(filter = {}) {
        const res = await this.find(filter, null);
        return res[0] || null;
      },

      async count(filter = {}) {
        // Use count query instead of fetching all rows
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
        return count || 0;
      },

      async create(data) {
        const row = toSupabaseRow(name, data);
        // Remove id if empty to let Supabase generate UUID
        if (!row.id) delete row.id;
        const { data: inserted, error } = await sb.from(supaTable).insert(row).select().single();
        if (error) {
          console.error(`[supabase] create(${supaTable}) error:`, error.message, row);
          throw error;
        }
        return fromSupabaseRow(name, inserted);
      },

      async updateById(id, patch = {}) {
        const row = toSupabaseRow(name, patch);
        // Don't send id in update
        delete row.id;
        const { data, error } = await sb.from(supaTable).update(row).eq("id", id).select().single();
        if (error) {
          console.error(`[supabase] updateById(${supaTable}) error:`, error.message);
          throw error;
        }
        return fromSupabaseRow(name, data);
      },

      async deleteById(id) {
        const { data, error } = await sb.from(supaTable).delete().eq("id", id).select().single();
        if (error) {
          console.error(`[supabase] deleteById(${supaTable}) error:`, error.message);
          throw error;
        }
        return fromSupabaseRow(name, data);
      },

      async deleteMany(filter = {}) {
        let q = sb.from(supaTable).delete();
        for (const [k, v] of Object.entries(filter)) {
          const col = columnFor(name, k);
          q = q.eq(col, v);
        }
        const { error, count } = await q;
        if (error) throw error;
        return count || 0;
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
        const col = columnFor(name, field);
        const { data, error } = await sb.from(supaTable).select(col);
        if (error) {
          console.error(`[supabase] distinct(${supaTable}.${col}) error:`, error.message);
          throw error;
        }
        return [...new Set((data || []).map(r => r[col]).filter(Boolean))];
      },
    };
  },

  connection: () => ({ readyState: isSupabaseConfigured() ? 1 : 1 }),
};

export default store;
