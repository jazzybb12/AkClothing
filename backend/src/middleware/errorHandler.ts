import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "@/utils/AppError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: "A record with these unique details already exists. Please use a different name or value." });
    if (err.code === "P2003" || err.code === "P2014") return res.status(409).json({ error: "This change conflicts with linked records. Reassign or remove those links first." });
    if (err.code === "P2025") return res.status(404).json({ error: "This record no longer exists. Refresh the page and try again." });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
