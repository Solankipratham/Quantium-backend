import sanitizeHtml from "sanitize-html";
import validator from "validator";

export function sanitize(payload) {
  const out = {};
  for (const key of Object.keys(payload || {})) {
    let val = payload[key];
    if (typeof val === "string") {
      val = sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} }).trim();
    }
    out[key] = val;
  }
  return out;
}

export function validateStudent(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push("Full name is required.");
  if (!body.phone) errors.push("Student phone is required.");
  else if (!validator.isMobilePhone(String(body.phone).replace(/[^0-9+]/g, ""), "any", { strictMode: false })) errors.push("Student phone is invalid.");
  if (body.parentPhone && !validator.isMobilePhone(String(body.parentPhone).replace(/[^0-9+]/g, ""), "any", { strictMode: false })) errors.push("Parent phone is invalid.");
  if (body.email && !validator.isEmail(String(body.email))) errors.push("Email is invalid.");
  if (body.totalFee === undefined || body.totalFee === null || isNaN(Number(body.totalFee)) || Number(body.totalFee) < 0) errors.push("Total course fee must be a positive number.");
  if (body.discount !== undefined && body.discount !== null && (isNaN(Number(body.discount)) || Number(body.discount) < 0)) errors.push("Discount must be a positive number.");
  if (body.firstDueDate && !validator.isISO8601(String(body.firstDueDate))) errors.push("First due date is invalid.");
  if (body.joiningDate && !validator.isISO8601(String(body.joiningDate))) errors.push("Joining date is invalid.");
  return errors;
}

export function validatePayment(body, student) {
  const errors = [];
  const amount = Number(body.amount);
  if (body.amount === undefined || body.amount === null || isNaN(amount)) errors.push("Payment amount is required.");
  else if (amount <= 0) errors.push("Payment amount must be greater than zero.");
  else if (amount > 5000000) errors.push("Payment amount seems too large.");
  if (!body.date || !validator.isISO8601(String(body.date))) errors.push("Payment date is required.");
  const allowed = ["Cash", "UPI", "Bank Transfer", "Card", "Other"];
  if (body.method && !allowed.includes(body.method)) errors.push("Payment method is invalid.");
  return errors;
}

export function validateSignup(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push("Name is required.");
  if (!body.email || !validator.isEmail(String(body.email))) errors.push("A valid email is required.");
  if (!body.password || body.password.length < 6) errors.push("Password must be at least 6 characters.");
  return errors;
}