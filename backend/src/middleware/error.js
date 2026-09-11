export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
}

export function errorHandler(err, req, res, _next) {
  console.error("[error]", err.message || err);
  if (err.name === "ValidationError") {
    return res.status(422).json({ success: false, message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with this value already exists." });
  }
  const isProduction = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "Internal server error" : (err.message || "Something went wrong.")
  });
}
