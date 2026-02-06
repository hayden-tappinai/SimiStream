/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@simistream/types",
    "@simistream/config",
    "@simistream/db",
    "@simistream/odyssey-client",
  ],
};

module.exports = nextConfig;
