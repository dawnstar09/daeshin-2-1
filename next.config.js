/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Externalize undici to prevent webpack from trying to bundle it on the client
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('undici');
      }
    }
    return config;
  },
}

module.exports = nextConfig
