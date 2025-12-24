// Storage helper for local filesystem + Forge storage
// Production-safe: never returns localhost URLs to browser

import { ENV } from "./_core/env";
import fs from "fs";
import path from "path";

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl || "";
  const apiKey = ENV.forgeApiKey || "";
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function getPublicBaseUrl(): string {
  // Use public URL in production (via Nginx)
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/+$/, "");
  }

  // Fallback for local dev
  const port = process.env.PORT || "3001";
  return `http://localhost:${port}`;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}` };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));

  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });

  const data = (await response.json()) as { url: string };
  return data.url;
}

/**
* Upload file (local FS if no Forge config)
*/
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const publicBaseUrl = getPublicBaseUrl();

  // === LOCAL FILESYSTEM MODE ===
  if (!baseUrl || !apiKey || baseUrl.includes("localhost")) {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, relKey);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    const buffer =
      typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    fs.writeFileSync(fullPath, buffer);

    return {
      key: relKey,
      url: `${publicBaseUrl}/uploads/${normalizeKey(relKey)}`,
    };
  }

  // === FORGE STORAGE MODE ===
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(
    data,
    contentType,
    key.split("/").pop() ?? key
  );

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }

  const result = (await response.json()) as { url: string };
  return { key, url: result.url };
}

/**
* Get download URL (never returns localhost in prod)
*/
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const publicBaseUrl = getPublicBaseUrl();

  // === LOCAL FILESYSTEM MODE ===
  if (!baseUrl || !apiKey || baseUrl.includes("localhost")) {
    return {
      key: relKey,
      url: `${publicBaseUrl}/uploads/${normalizeKey(relKey)}`,
    };
  }

  // === FORGE STORAGE MODE ===
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
 