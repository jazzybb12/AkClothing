import { Router } from "express";
import { z } from "zod";
import { authenticate, requirePermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";
import { toCsv } from "@/utils/csv";
import { resolveRange } from "./dashboard.service";
import { getAllCustomerReport, getAllProductPerformance, getCustomerReport, getProductPerformance } from "./reports.service";

const router = Router();

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  format: z.enum(["json", "csv"]).default("json"),
});

// GET /api/admin/reports/products?from=&to=&page=&pageSize=&format=csv
router.get(
  "/products",
  authenticate,
  requirePermission("REPORTS"),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const range = resolveRange(query.from, query.to);

    if (query.format === "csv") {
      const rows = await getAllProductPerformance(range);
      const csv = toCsv(rows, [
        { key: "name", label: "Product", value: (r) => r.name },
        { key: "qtySold", label: "Qty Sold", value: (r) => r.qtySold },
        { key: "revenue", label: "Revenue", value: (r) => r.revenue.toFixed(2) },
      ]);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="product-performance.csv"');
      return res.send(csv);
    }

    const result = await getProductPerformance(range, query.page, query.pageSize);
    res.json({ ...result, page: query.page, pageSize: query.pageSize });
  })
);

// GET /api/admin/reports/customers?from=&to=&page=&pageSize=&format=csv
router.get(
  "/customers",
  authenticate,
  requirePermission("REPORTS"),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const range = resolveRange(query.from, query.to);

    if (query.format === "csv") {
      const rows = await getAllCustomerReport(range);
      const csv = toCsv(rows, [
        { key: "name", label: "Customer", value: (r) => r.name },
        { key: "email", label: "Email", value: (r) => r.email },
        { key: "orderCount", label: "Orders", value: (r) => r.orderCount },
        { key: "totalSpent", label: "Total Spent", value: (r) => r.totalSpent.toFixed(2) },
      ]);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="customer-report.csv"');
      return res.send(csv);
    }

    const result = await getCustomerReport(range, query.page, query.pageSize);
    res.json({ ...result, page: query.page, pageSize: query.pageSize });
  })
);

export default router;
