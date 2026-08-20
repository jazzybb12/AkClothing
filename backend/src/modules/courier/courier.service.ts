import { CourierProvider } from "@prisma/client";
import { CourierAdapter } from "./CourierAdapter";
import { LeopardsAdapter } from "./LeopardsAdapter";
import { PostExAdapter } from "./PostExAdapter";

const adapters: Record<CourierProvider, CourierAdapter> = {
  LEOPARDS: new LeopardsAdapter(),
  POSTEX: new PostExAdapter(),
};

export function getCourierAdapter(provider: CourierProvider): CourierAdapter {
  return adapters[provider];
}
