import { Order, OrderItem } from "@prisma/client";

export type OrderWithItems = Order & { items: OrderItem[] };

export interface ShipmentResult {
  trackingNumber: string;
  raw: unknown;
}

export interface TrackingResult {
  status: string;
  raw: unknown;
}

// Shared contract both courier integrations implement, so order/checkout logic never
// has to know whether a shipment is going through Leopards or PostEx.
export interface CourierAdapter {
  createShipment(order: OrderWithItems): Promise<ShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingResult>;
}
