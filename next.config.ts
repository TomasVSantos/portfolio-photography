import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [480, 768, 1024, 1536],
    imageSizes: [256, 384],
  },
  trailingSlash: true,
};

export default nextConfig;
