/** @type {import('next').NextConfig} */
const nextConfig = {

    eslint: {
        // This will disable the specific rule for unused variables
        ignoreDuringBuilds: true, // Optionally ignore ESLint errors during build
      },


};

export default nextConfig;