import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin")
      return res.status(403).json({ error: "Admin only" });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
