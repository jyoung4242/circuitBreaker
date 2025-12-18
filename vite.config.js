import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext", //browsers can handle the latest ES features
  },
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.svg", "**/*.tff"],
  plugins: [VitePWA({ registerType: "autoUpdate" })],
});
