import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves at /<repo-name>/, so we set base accordingly.
// Override with VITE_BASE env if needed.
const base = process.env.VITE_BASE ?? "/asdalsdasd/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
