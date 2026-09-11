export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
}

export function errorHandler(err, req, res, _next) {
  console.error("[error]", err.message);
  if (err.name === "ValidationError") {
    return res.status(422).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "A record with this value already exists." });
  }
  res.status(err.status || 500).json({ message: err.message || "Something went wrong." });
}