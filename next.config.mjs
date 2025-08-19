/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Evitar que exceljs intente resolver módulos de Node en SSR
    config.externals = [...(config.externals || []), "fs"]
    return config
  },
}

export default nextConfig
