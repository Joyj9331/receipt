/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // next/image blob URL 지원 (영수증 미리보기용)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
