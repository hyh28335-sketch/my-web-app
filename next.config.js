/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'my-web-app';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  basePath: isGithubPages ? `/${repoName}` : undefined,
};

module.exports = nextConfig;