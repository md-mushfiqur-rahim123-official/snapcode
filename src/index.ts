#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve } from "path";
import { Command } from "commander";
import chalk from "chalk";
import { renderCode } from "./renderer.js";

const program = new Command();

program
  .name("snapcode")
  .description("Convert code into beautiful images for social media, presentations, and documentation.")
  .version("1.0.0")
  .argument("<file>", "Path to the code file")
  .option("-o, --output <path>", "Output image path (default: output/<filename>.png)")
  .option("-t, --theme <theme>", "Color theme: monokai, github-dark, github-light, nord, dracula, one-dark, one-light, solarized-dark, solarized-light", "monokai")
  .option("-w, --window", "Show window frame with title bar", true)
  .option("--no-window", "Hide window frame")
  .option("--title <title>", "Custom title for window frame")
  .option("-l, --lang <lang>", "Override language detection")
  .option("--width <px>", "Image width in pixels", "840")
  .option("--padding <px>", "Padding around code", "32")
  .option("--font-size <size>", "Font size in pixels", "14")
  .option("--line-numbers", "Show line numbers", true)
  .option("--no-line-numbers", "Hide line numbers")
  .option("--high-quality", "Render at 2x resolution for retina displays")
  .action(async (file, options) => {
    try {
      const filePath = resolve(file);
      const code = readFileSync(filePath, "utf-8");
      const lang = options.lang || detectLang(filePath);
      const title = options.title || filePath.split(/[\\/]/).pop() || "untitled";
      const width = parseInt(options.width);
      const padding = parseInt(options.padding);
      const fontSize = parseInt(options.fontSize);
      const output = options.output || `output/${title}.png`;

      console.log(chalk.cyan(`\n  snapcode — generating image...\n`));
      console.log(chalk.dim(`  File: ${filePath}`));
      console.log(chalk.dim(`  Theme: ${options.theme}`));
      console.log(chalk.dim(`  Language: ${lang}`));
      console.log(chalk.dim(`  Output: ${output}\n`));

      await renderCode({
        code,
        lang,
        title,
        theme: options.theme,
        width,
        padding,
        fontSize,
        window: options.window,
        lineNumbers: options.lineNumbers,
        highQuality: options.highQuality,
        outputPath: resolve(output),
      });

      console.log(chalk.green(`  ✓ Image saved to ${resolve(output)}\n`));
    } catch (e: any) {
      console.error(chalk.red(`  Error: ${e.message}`));
      process.exit(1);
    }
  });

program.parse();

function detectLang(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", rb: "ruby", rs: "rust", go: "go", java: "java",
    c: "c", cpp: "cpp", h: "c", hpp: "cpp", cs: "csharp",
    swift: "swift", kt: "kotlin", scala: "scala", php: "php",
    html: "html", css: "css", scss: "scss", sass: "sass",
    json: "json", yml: "yaml", yaml: "yaml", md: "markdown",
    sh: "bash", bash: "bash", zsh: "bash", ps1: "powershell",
    sql: "sql", r: "r", dart: "dart", lua: "lua",
    vue: "vue", svelte: "svelte", astro: "astro",
    tsconfig: "json", env: "plaintext", gitignore: "plaintext",
    dockerfile: "dockerfile", tf: "terraform",
  };
  return map[ext] || "plaintext";
}
