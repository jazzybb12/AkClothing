import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  leopards: {
    apiKey: process.env.LEOPARDS_API_KEY ?? "",
    apiPassword: process.env.LEOPARDS_API_PASSWORD ?? "",
    baseUrl: process.env.LEOPARDS_BASE_URL ?? "https://merchantapi.leopardscourier.com/api",
  },
  postex: {
    token: process.env.POSTEX_TOKEN ?? "",
    baseUrl: process.env.POSTEX_BASE_URL ?? "https://api.postex.pk/services/integration/api/order",
  },
  whatsappDefaultNumber: process.env.WHATSAPP_DEFAULT_NUMBER ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:3000",
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? "",
    fromAddress: process.env.RESEND_FROM_ADDRESS ?? "ak.shop <onboarding@resend.dev>",
  },
};
