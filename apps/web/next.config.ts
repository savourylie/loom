import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.fallback = config.resolve.fallback || {};

    // Shim node:perf_hooks for browser builds
    if (!isServer) {
      // Handle both node:perf_hooks and perf_hooks
      config.resolve.alias["node:perf_hooks"] = path.join(
        __dirname,
        "./lib/perf-hooks-shim.ts",
      );
      config.resolve.alias["perf_hooks"] = path.join(
        __dirname,
        "./lib/perf-hooks-shim.ts",
      );
      config.resolve.fallback["perf_hooks"] = path.join(
        __dirname,
        "./lib/perf-hooks-shim.ts",
      );
    }

    // Add a custom plugin to handle node: protocol scheme
    config.plugins = config.plugins || [];
    config.plugins.push({
      apply(compiler: any) {
        compiler.hooks.normalModuleFactory.tap(
          "NodeProtocolPlugin",
          (nmf: any) => {
            nmf.hooks.beforeResolve.tap("NodeProtocolPlugin", (data: any) => {
              if (data.request?.startsWith("node:")) {
                const moduleName = data.request.slice(5); // Remove 'node:' prefix
                if (moduleName === "perf_hooks" && !isServer) {
                  data.request = path.join(
                    __dirname,
                    "./lib/perf-hooks-shim.ts",
                  );
                }
              }
            });
          },
        );
      },
    });

    return config;
  },
};

export default nextConfig;
