import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite is only used for local development without DATABASE_URL.
  serverExternalPackages: ["@electric-sql/pglite", "exceljs"],
  // Room for staff-list Excel uploads.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default nextConfig;
