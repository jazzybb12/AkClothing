import { apiFetch } from "./api";

interface SignResponse {
  timestamp: number;
  signature: string;
  folder: string;
  apiKey: string;
  cloudName: string;
}

export async function uploadImage(file: File, token: string): Promise<string> {
  const sign = await apiFetch<SignResponse>("/uploads/sign", { method: "POST", token });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sign.apiKey);
  formData.append("timestamp", String(sign.timestamp));
  formData.append("signature", sign.signature);
  formData.append("folder", sign.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Image upload failed");
  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}
