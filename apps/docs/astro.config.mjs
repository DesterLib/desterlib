// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// Read version from root package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPackagePath = join(__dirname, "../../package.json");
const rootPackage = JSON.parse(readFileSync(rootPackagePath, "utf-8"));
const version = rootPackage.version;

// https://astro.build/config
export default defineConfig({
  site: "https://docs.dester.in",
  base: "/",
  integrations: [
    starlight({
      title: "DesterLib Docs",
      description: "Documentation for DesterLib - Your Personal Media Server",
      logo: {
        src: "./src/assets/logo.svg",
        alt: "DesterLib Logo",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/DesterLib/desterlib",
        },
      ],
      customCss: ["./src/styles/global.css"],
      expressiveCode: {
        themes: ["dark-plus"],
      },
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
      },
      components: {
        Head: "./src/components/Head.astro",
        PageFrame: "./src/components/PageFrame.astro",
        Hero: "./src/components/Hero.astro",
      },
      sidebar: [
        // GETTING STARTED
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "index" },
            { label: "Quick Start", slug: "getting-started/quick-start" },
            { label: "Installation", slug: "getting-started/installation" },
          ],
        },

        // PROJECTS & TOOLS
        {
          label: "Projects",
          collapsed: false,
          items: [
            {
              label: "API Server",
              collapsed: true,
              items: [
                { label: "Overview", slug: "api/overview" },
                {
                  label: "Environment Variables",
                  slug: "api/environment-variables",
                },
                { label: "Changelog", slug: "api/changelog" },
              ],
            },
            {
              label: "Client Apps",
              collapsed: true,
              items: [
                { label: "Overview", slug: "clients/overview" },
                { label: "Platform Setup", slug: "clients/flutter" },
              ],
            },
          ],
        },

        // DEPLOYMENT
        {
          label: "Deployment",
          collapsed: true,
          items: [
            { label: "Docker Production", slug: "deployment/docker" },
            { label: "Security Guide", slug: "deployment/security" },
          ],
        },

        // DEVELOPMENT
        {
          label: "Development",
          collapsed: true,
          items: [
            { label: "Contributing Guide", slug: "development/contributing" },
            { label: "Development Workflow", slug: "development/workflow" },
            { label: "Project Structure", slug: "development/structure" },
            {
              label: "Commit Guidelines",
              slug: "development/commit-guidelines",
            },
            { label: "Versioning Guide", slug: "development/versioning" },
            { label: "Quick Reference", slug: "development/quick-reference" },
            { label: "Documentation Changelog", slug: "docs/changelog" },
          ],
        },

        // CHANGELOG
        {
          label: "Changelog",
          items: [{ label: "Overview", slug: "changelog" }],
        },

        // EXTERNAL LINKS
        {
          label: "API Reference",
          items: [
            {
              label: "Interactive API Docs (Swagger)",
              link: "http://localhost:3001/api/docs",
              attrs: { target: "_blank", rel: "noopener noreferrer" },
            },
          ],
        },
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
    },
  },
});
