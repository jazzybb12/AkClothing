import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { verifyAccessToken } from "@/modules/auth/jwt";
import { Permission } from "@/constants/permissions";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; permissions: string[] };
    }
  }
}

// Looks the user up fresh on every request rather than trusting the JWT's role claim,
// so a deactivated account or a role change (e.g. demoting a STAFF member) takes effect
// immediately instead of waiting up to the access token's TTL to expire.
async function extractUser(req: Request): Promise<{ id: string; role: Role; permissions: string[] } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) return null;
    // permissions is stored as a MySQL JSON column (Prisma has no native array type there),
    // but is always written/read as a plain string[] — see schema.prisma.
    return { id: user.id, role: user.role, permissions: user.permissions as string[] };
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const user = await extractUser(req);
  if (!user) {
    return res.status(401).json({ error: "Access denied. No valid token provided." });
  }
  req.user = user;
  next();
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  req.user = (await extractUser(req)) ?? undefined;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions." });
    }
    next();
  };
}

// ADMIN always passes regardless of `permissions` (which is only meaningful for STAFF).
// A STAFF account without the named resource in its permissions array is rejected.
export function requirePermission(resource: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(403).json({ error: "Forbidden: insufficient permissions." });
    if (req.user.role === Role.ADMIN) return next();
    if (req.user.role === Role.STAFF && req.user.permissions.includes(resource)) return next();
    return res.status(403).json({ error: "Forbidden: insufficient permissions." });
  };
}
