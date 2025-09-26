import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: ".", // Set root to the current directory
  base: mode === "production" ? "" : "/", // Use relative paths for production
  plugins: [react()],
  build: {
    outDir: "dist", // Ensure output is in the dist folder
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
}));
