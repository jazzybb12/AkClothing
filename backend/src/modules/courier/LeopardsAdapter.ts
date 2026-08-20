import fetch from "node-fetch";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import { CourierAdapter, OrderWithItems, ShipmentResult, TrackingResult } from "./CourierAdapter";

// Leopards Courier "Merchant API" (https://merchantapi.leopardscourier.com) — booking
// endpoint is `bookPacket`, tracking is `trackBookedPacket`. Field names below match
// their documented request shape. Needs a real api_key/api_password to go live.
// TODO(courier-live): validate exact field names/response shape against the sandbox
// once real Leopards merchant credentials are available.
export class LeopardsAdapter implements CourierAdapter {
  async createShipment(order: OrderWithItems): Promise<ShipmentResult> {
    if (!env.leopards.apiKey) {
      throw new AppError(500, "Leopards courier is not configured (missing API credentials)");
    }

    const address = order.shippingAddress as { address: string; city: string };

    const response = await fetch(`${env.leopards.baseUrl}/bookPacket/format/json/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: env.leopards.apiKey,
        api_password: env.leopards.apiPassword,
        booked_packet_weight: "1",
        booked_packet_no_piece: String(order.items.length),
        booked_packet_collection_amount: String(order.total),
        origin_city: "Lahore",
        destination_city: address.city,
        shipment_name_eng: order.customerName,
        shipment_email: "",
        shipment_phone: order.customerPhone,
        shipment_address: address.address,
        order_id: order.orderNumber,
        products: order.items.map((i) => i.productNameSnapshot).join(", "),
      }),
    });

    const data = (await response.json()) as { track_number?: string; error?: string };
    if (!response.ok || !data.track_number) {
      throw new AppError(502, data.error ?? "Leopards courier booking failed");
    }

    return { trackingNumber: data.track_number, raw: data };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const response = await fetch(`${env.leopards.baseUrl}/trackBookedPacket/format/json/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: env.leopards.apiKey,
        api_password: env.leopards.apiPassword,
        track_numbers: trackingNumber,
      }),
    });

    const data = (await response.json()) as { packet_status?: string }[];
    const status = data?.[0]?.packet_status ?? "UNKNOWN";
    return { status, raw: data };
  }
}
