import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      console.log("No such Users");
      return res.status(401).json({ error: "No such Users" });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      console.log("invalid credentials");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: "admin" },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    res.json({ token, expiresIn: JWT_EXPIRES_IN });
  } catch (err) {
    next(err);
  }
}
