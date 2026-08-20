import fetch from "node-fetch";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import { CourierAdapter, OrderWithItems, ShipmentResult, TrackingResult } from "./CourierAdapter";

// PostEx integration API (https://api.postex.pk) — order creation is
// `POST /v1/create-order`, tracking is `GET /v1/order-detail/{trackingNumber}`, auth via
// a static merchant `token` header. Needs a real merchant token to go live.
// TODO(courier-live): validate exact field names/response shape against the sandbox
// once real PostEx merchant credentials are available.
export class PostExAdapter implements CourierAdapter {
  async createShipment(order: OrderWithItems): Promise<ShipmentResult> {
    if (!env.postex.token) {
      throw new AppError(500, "PostEx courier is not configured (missing API token)");
    }

    const address = order.shippingAddress as { address: string; city: string };

    const response = await fetch(`${env.postex.baseUrl}/v3/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: env.postex.token },
      body: JSON.stringify({
        cityName: address.city,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: address.address,
        invoiceDivision: 0,
        invoicePayment: Number(order.total),
        items: order.items.length,
        orderDetail: order.items.map((i) => i.productNameSnapshot).join(", "),
        orderRefNumber: order.orderNumber,
        orderType: "Normal",
      }),
    });

    const data = (await response.json()) as { dist: { trackingNumber?: string }; statusMessage?: string };
    if (!response.ok || !data.dist?.trackingNumber) {
      throw new AppError(502, data.statusMessage ?? "PostEx courier booking failed");
    }

    return { trackingNumber: data.dist.trackingNumber, raw: data };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const response = await fetch(`${env.postex.baseUrl}/v1/order-detail/${trackingNumber}`, {
      headers: { token: env.postex.token },
    });

    const data = (await response.json()) as { dist?: { transactionStatus?: string } };
    const status = data.dist?.transactionStatus ?? "UNKNOWN";
    return { status, raw: data };
  }
}
