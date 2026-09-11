import "dotenv/config";
import bcrypt from "bcryptjs";
import { chooseDriver, getStore } from "../data/store.js";
import { daysAgo, monthOffsetMonthsAgo } from "./seedHelpers.js";
import { getSettings } from "../services/settingsService.js";

const NOW = new Date();
function pad(n) { return String(n).padStart(3, "0"); }

const BATCHES = [
  { name: "Class 10 — Morning", course: "Class 10", teacher: "Mr. Rajesh Iyer", days: ["Monday", "Wednesday", "Friday"], startTime: "9:00 AM", endTime: "10:30 AM", room: "Room 101", capacity: 30 },
  { name: "Class 10 — Evening", course: "Class 10", teacher: "Ms. Kavita Nair", days: ["Tuesday", "Thursday", "Saturday"], startTime: "5:00 PM", endTime: "6:30 PM", room: "Room 102", capacity: 30 },
  { name: "Class 11 — Morning", course: "Class 11", teacher: "Mr. Arjun Mehta", days: ["Monday", "Wednesday", "Friday"], startTime: "7:00 AM", endTime: "8:30 AM", room: "Room 201", capacity: 35 },
  { name: "Class 11 — Evening", course: "Class 11", teacher: "Mrs. Shalini Rao", days: ["Tuesday", "Thursday", "Saturday"], startTime: "5:00 PM", endTime: "6:30 PM", room: "Room 202", capacity: 35 },
  { name: "Class 12 — Morning", course: "Class 12", teacher: "Mr. Suresh Kumar", days: ["Monday", "Wednesday", "Friday"], startTime: "7:00 AM", endTime: "8:30 AM", room: "Room 301", capacity: 30 },
  { name: "Class 12 — Evening", course: "Class 12", teacher: "Dr. Meera Krishnan", days: ["Tuesday", "Thursday", "Saturday"], startTime: "5:00 PM", endTime: "6:30 PM", room: "Room 302", capacity: 30 }
];

const FEE_PLANS = [
  { course: "Class 9", monthlyFee: 1800, quarterlyFee: 4900, halfYearlyFee: 9200, yearlyFee: 17000, admissionFee: 1000 },
  { course: "Class 10", monthlyFee: 2000, quarterlyFee: 5500, halfYearlyFee: 10500, yearlyFee: 20000, admissionFee: 1000 },
  { course: "Class 11", monthlyFee: 2000, quarterlyFee: 5500, halfYearlyFee: 10500, yearlyFee: 20000, admissionFee: 1200 },
  { course: "Class 12", monthlyFee: 2500, quarterlyFee: 6800, halfYearlyFee: 12500, yearlyFee: 24000, admissionFee: 1200 }
];

// [name, fatherName, phone, parentPhone, "Class n · Gender", batchName, monthlyFee, monthsPaid]
const RAW_STUDENTS = [
  ["Rahul Sharma", "Rajesh Sharma", "9812345670", "9812345671", "Class 10 · Male", "Class 10 — Evening", 2000, 4],
  ["Ananya Verma", "Sanjay Verma", "9822334455", "9822334456", "Class 12 · Female", "Class 12 — Evening", 2500, 3],
  ["Aman Kumar", "Rakesh Kumar", "9833445566", "9833445567", "Class 11 · Male", "Class 11 — Evening", 2000, 2],
  ["Priya Joshi", "Nitin Joshi", "9844556677", "9844556678", "Class 10 · Female", "Class 10 — Morning", 2000, 5],
  ["Kabir Malhotra", "Vikram Malhotra", "9855667788", "9855667789", "Class 12 · Male", "Class 12 — Morning", 2500, 3],
  ["Sneha Patil", "Anil Patil", "9866778899", "9866778890", "Class 11 · Female", "Class 11 — Morning", 2000, 4],
  ["Arjun Deshmukh", "Prakash Deshmukh", "9877889900", "9877889901", "Class 10 · Male", "Class 10 — Evening", 2000, 1],
  ["Ishita Gupta", "Deepak Gupta", "9888990011", "9888990012", "Class 12 · Female", "Class 12 — Evening", 2500, 6],
  ["Rohan Naik", "Sunil Naik", "9899001122", "9899001123", "Class 11 · Male", "Class 11 — Morning", 2000, 3],
  ["Meghna Reddy", "Kishore Reddy", "9900112233", "9900112234", "Class 10 · Female", "Class 10 — Morning", 2000, 2],
  ["Aditya Rao", "Harish Rao", "9911223344", "9911223345", "Class 12 · Male", "Class 12 — Morning", 2500, 2],
  ["Tanvi Kulkarni", "Madhav Kulkarni", "9922334455", "9922334456", "Class 11 · Female", "Class 11 — Evening", 2000, 5],
  ["Yash Singh", "Arvind Singh", "9933445566", "9933445567", "Class 10 · Male", "Class 10 — Morning", 2000, 0],
  ["Nandini Bose", "Debraj Bose", "9944556677", "9944556678", "Class 12 · Female", "Class 12 — Evening", 2500, 4],
  ["Vivaan Shah", "Manish Shah", "9955667788", "9955667789", "Class 11 · Male", "Class 11 — Morning", 2000, 1],
  ["Sara Fernandes", "Anthony Fernandes", "9966778899", "9966778890", "Class 10 · Female", "Class 10 — Evening", 2000, 3],
  ["Kunal Mishra", "Om Mishra", "9977889900", "9977889901", "Class 12 · Male", "Class 12 — Morning", 2500, 5],
  ["Divya Choudhary", "Mahesh Choudhary", "9988990011", "9988990012", "Class 11 · Female", "Class 11 — Evening", 2000, 4],
  ["Harsh Vora", "Naresh Vora", "9999123456", "9999123457", "Class 10 · Male", "Class 10 — Morning", 2000, 2],
  ["Gauri Pandit", "Sameer Pandit", "9990234567", "9990234568", "Class 12 · Female", "Class 12 — Evening", 2500, 1],
  ["Ishan Bhat", "Ravi Bhat", "9991345678", "9991345679", "Class 11 · Male", "Class 11 — Morning", 2000, 0]
];

const METHODS = ["Cash", "UPI", "Bank Transfer", "Card", "Other"];
const MONTHLY_DUE_DAY = 10;

function pickMethod(i) { return METHODS[i % METHODS.length]; }

function paymentNotes(i) {
  const notes = ["Monthly Fee", "Monthly Fee", "Adjusted for exam break", "Monthly Fee", "Paid during class"];
  return notes[i % notes.length];
}

async function seed() {
  const driver = await chooseDriver();
  const store = await getStore();
  console.log(`Seeding QUANTUM with ${driver} driver...\n`);

  for (const m of ["User", "Student", "Payment", "Batch", "Expense", "FeePlan", "AuditLog", "Notification", "Setting"]) {
    const list = await store.model(m).find({}, null);
    for (const d of list) await store.model(m).deleteById(d.id).catch(() => {});
  }
  await store.model("Payment").deleteMany({}).catch(() => {});

  const hash = await bcrypt.hash("admin123", 10);
  const admin = await store.model("User").create({
    name: "Admin",
    email: "admin@quantum.in",
    username: "admin",
    password: hash,
    role: "ADMIN",
    phone: "9876543210",
    active: true
  });

  await store.model("Setting").findOneAndUpdate({ key: "app" }, { value: {
    coaching: { name: "Quantum", tagline: "Academy", address: "12, MG Road, Pune, Maharashtra 411001", phone: "+91 98765 43210", email: "hello@quantum.in" },
    fee: { defaultDueDate: MONTHLY_DUE_DAY, defaultPaymentCycle: "Monthly", allowAdvancePayments: false },
    receipt: { prefix: "QTM", startNumber: 1, pattern: "{prefix}-{number}" },
    profile: { currency: "₹" }
  } }, { upsert: true });
  await store.model("Setting").findOneAndUpdate({ key: "receiptCounter" }, { value: 0 }, { upsert: true });

  for (const b of BATCHES) await store.model("Batch").create(b);
  for (const f of FEE_PLANS) await store.model("FeePlan").create(f);

  let counter = 0;
  let receiptNum = 0;

  for (let i = 0; i < RAW_STUDENTS.length; i++) {
    const [name, father, phone, parentPhone, clsMale, batchName, monthlyFee, monthsPaid] = RAW_STUDENTS[i];
    counter++;
    const [cls, genderRaw] = clsMale.split(" · ");
    const gender = genderRaw === "Male" ? "Male" : "Female";
    const studentId = `QTM-${NOW.getFullYear()}-${pad(counter)}`;
    const joining = monthOffsetMonthsAgo(6 + (i % 5));
    const firstDue = new Date(joining);
    firstDue.setDate(MONTHLY_DUE_DAY);
    const totalFee = monthlyFee * 12;
    const discount = i % 5 === 0 ? 1000 : 0;
    const finalFee = totalFee - discount;
    const batch = BATCHES.find((b) => b.name === batchName);
    const nextDue = new Date(NOW);
    nextDue.setDate(MONTHLY_DUE_DAY);

    const student = await store.model("Student").create({
      studentId,
      name,
      dob: new Date(2006 + ((i % 4)), (i * 3) % 12, (i % 27) + 1),
      gender,
      phone,
      parentName: father,
      parentPhone,
      email: name.toLowerCase().replace(/\s+/g, ".") + "@gmail.com",
      address: `${(i % 40) + 1}, Ashok Nagar, Pune, Maharashtra`,
      course: cls,
      subject: ["Mathematics & Science", "Physics, Chemistry & Maths", "Mathematics, Physics & Chemistry"][i % 3],
      batch: batchName,
      teacher: batch.teacher,
      joiningDate: joining,
      totalFee,
      monthlyFee,
      admissionFee: 1000,
      discount,
      finalFee,
      paymentPlan: "Monthly",
      firstDueDate: firstDue,
      monthlyDueDate: MONTHLY_DUE_DAY,
      nextDueDate: nextDue,
      status: "Active",
      notes: ""
    });

    for (let m = monthsPaid - 1; m >= 0; m--) {
      const payDate = m === monthsPaid - 1 ? daysAgo(3 + (i % 6)) : monthOffsetMonthsAgo(m);
      receiptNum++;
      const monthName = payDate.toLocaleDateString("en-US", { month: "long" });
      await store.model("Payment").create({
        paymentId: `PY-${Date.now()}-${i}-${m}`,
        studentId: student.id,
        studentName: name,
        amount: monthlyFee,
        date: payDate,
        method: pickMethod(i + m),
        paymentFor: `${monthName} Fee`,
        receiptNumber: `QTM-${pad(receiptNum)}`,
        notes: paymentNotes(m),
        recordedBy: admin.id
      });
    }

    if (i === 3 || i === 6 || i === 15) {
      receiptNum++;
      const todayPay = daysAgo(0);
      await store.model("Payment").create({
        paymentId: `PY-${Date.now()}-today-${i}`,
        studentId: student.id,
        studentName: name,
        amount: monthlyFee,
        date: todayPay,
        method: i % 2 === 0 ? "UPI" : "Cash",
        paymentFor: `${todayPay.toLocaleDateString("en-US", { month: "long" })} Fee`,
        receiptNumber: `QTM-${pad(receiptNum)}`,
        notes: "Monthly Fee",
        recordedBy: admin.id
      });
    }
  }

  const EXPENSES = [
    ["Rent", "Monthly rent for coaching premises", 26000, 5],
    ["Electricity", "Electricity bill", 3400, 6],
    ["Teacher Salary", "Salary for Mr. Suresh Kumar", 15000, 5],
    ["Teacher Salary", "Salary for Ms. Kavita Nair", 15000, 7],
    ["Stationery", "Printing notes & test papers", 2400, 8],
    ["Internet", "Wi-Fi connection for online classes", 1499, 6],
    ["Maintenance", "Classroom upkeep & minor repairs", 2100, 10],
    ["Marketing", "Local newspaper advertisement", 3800, 4],
    ["Electricity", "Electricity bill", 3600, 12],
    ["Rent", "Monthly rent for coaching premises", 26000, 1]
  ];
  let expenseCounter = 0;
  for (const [category, description, amount, daysBack] of EXPENSES) {
    expenseCounter++;
    await store.model("Expense").create({
      category,
      description,
      amount,
      date: daysAgo(daysBack),
      method: pickMethod(expenseCounter),
      notes: ""
    });
  }

  const AUDIT_ACTIONS = [
    "Added student Rahul Sharma (QTM-2026-001)",
    "Recorded UPI payment of ₹2,000 for Ananya Verma",
    "Updated profile for Priya Joshi",
    "Created batch Class 10 — Evening",
    "Recorded Cash payment of ₹2,500 for Kabir Malhotra",
    "Added expense: Rent ₹26,000"
  ];
  for (let i = 0; i < AUDIT_ACTIONS.length; i++) {
    await store.model("AuditLog").create({
      userId: admin.id,
      userName: admin.name,
      action: AUDIT_ACTIONS[i],
      entity: "System",
      entityId: "",
      details: "",
      ip: "127.0.0.1",
      createdAt: daysAgo(i + 1)
    });
  }

  const NOTIFICATIONS = [
    ["fee_overdue", "Fee overdue", "3 students have fees overdue. Review the pending page."],
    ["payment_received", "Payment received", "Today's collection reached ₹6,000 so far."],
    ["student_added", "New student added", "Gauri Pandit joined Class 12 — Evening."]
  ];
  for (const [type, title, message] of NOTIFICATIONS) {
    await store.model("Notification").create({ type, title, message, read: false });
  }

  console.log(`  users:        1`);
  console.log(`  students:     ${counter}`);
  console.log(`  batches:      ${BATCHES.length}`);
  console.log(`  fee plans:    ${FEE_PLANS.length}`);
  console.log(`  expenses:     ${EXPENSES.length}`);
  console.log(`  receipts:     up to QTM-${pad(receiptNum)}`);
  console.log(`\n  Login →  admin@quantum.in  /  admin123`);
  console.log(`  Driver → ${driver}\n`);
}

seed().catch((e) => {
  console.error("[seed] failed:", e);
  process.exit(1);
});