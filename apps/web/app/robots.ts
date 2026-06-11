import type { MetadataRoute } from "next";

const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://reunio.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/admin/", "/api/", "/booking/manage/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
