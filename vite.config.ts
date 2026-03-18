import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve react plugin from local node_modules first
let react;
try {
  const pluginPath = path.join(__dirname, "node_modules", "@vitejs/plugin-react-swc", "index.mjs");
  const mod = await import(pluginPath);
  react = mod.default;
} catch {
  try {
    const mod = await import("@vitejs/plugin-react-swc");
    react = mod.default;
  } catch {
    const mod = await import("@vitejs/plugin-react");
    react = mod.default;
  }
}

let componentTagger;
try {
  const taggerMod = await import("lovable-tagger");
  componentTagger = taggerMod.componentTagger;
} catch {
  // tagger not available
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger?.(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
