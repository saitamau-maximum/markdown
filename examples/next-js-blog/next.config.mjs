/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  webpack: (config, { webpack }) => {
    return {
      ...config,
      plugins: [
        ...config.plugins,
        new webpack.IgnorePlugin({
          resourceRegExp: /^electron$/,
        }),
      ],
    };
  },
};

export default nextConfig;
