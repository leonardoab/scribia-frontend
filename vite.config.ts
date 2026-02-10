// vite.config.ts - v1.0.1
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const httpsConfig = mode === 'development' && fs.existsSync(path.resolve(__dirname, "localhost-key.pem"))
    ? {
        key: fs.readFileSync(path.resolve(__dirname, "localhost-key.pem")),
        cert: fs.readFileSync(path.resolve(__dirname, "localhost-cert.pem")),
      }
    : undefined;

  return {
    server: {
      host: "::",
      port: 8080,
      https: httpsConfig,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
