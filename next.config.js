/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  assetPrefix: './',
  basePath: '',
};

module.exports = nextConfig;
