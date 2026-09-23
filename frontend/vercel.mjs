const apiOrigin = process.env.API_ORIGIN?.replace(/\/$/, "");

if (!apiOrigin || !apiOrigin.startsWith("https://")) {
  throw new Error("API_ORIGIN must be configured with the HTTPS Monster API URL.");
}

export const config = {
  rewrites: [
    {
      source: "/api/:path*",
      destination: `${apiOrigin}/api/:path*`,
    },
    { source: "/(.*)", destination: "/index.html" },
  ],
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Robots-Tag", value: "index, follow" },
      ],
    },
  ],
};
