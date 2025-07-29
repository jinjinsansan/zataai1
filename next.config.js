/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  output: 'standalone',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig