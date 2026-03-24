import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.(tsx|ts|js|mjs|jsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "@wyw-in-js/webpack-loader",
          options: { classNameSlug: "[title]-[hash]" },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
