import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/detox-tracker2/",
  plugins: [react()],
});
