import { mkdirSync } from "fs";
import { dirname } from "path";
import puppeteer from "puppeteer";
import { codeToHtml } from "shiki";

export interface RenderOptions {
  code: string;
  lang: string;
  title: string;
  theme: string;
  width: number;
  padding: number;
  fontSize: number;
  window: boolean;
  lineNumbers: boolean;
  highQuality?: boolean;
  outputPath: string;
}

function getThemeColors(theme: string) {
  const themes: Record<string, { bg: string; fg: string; titleBg: string; titleFg: string; btnColor: string }> = {
    "monokai": { bg: "#272822", fg: "#f8f8f2", titleBg: "#1e1f1c", titleFg: "#75715e", btnColor: "#e6db74" },
    "github-dark": { bg: "#0d1117", fg: "#c9d1d9", titleBg: "#161b22", titleFg: "#8b949e", btnColor: "#58a6ff" },
    "github-light": { bg: "#ffffff", fg: "#24292f", titleBg: "#f6f8fa", titleFg: "#57606a", btnColor: "#0969da" },
    "nord": { bg: "#2e3440", fg: "#d8dee9", titleBg: "#3b4252", titleFg: "#81a1c1", btnColor: "#88c0d0" },
    "dracula": { bg: "#282a36", fg: "#f8f8f2", titleBg: "#21222c", titleFg: "#6272a4", btnColor: "#bd93f9" },
    "one-dark": { bg: "#282c34", fg: "#abb2bf", titleBg: "#21252b", titleFg: "#5c6370", btnColor: "#61afef" },
    "one-light": { bg: "#fafafa", fg: "#383a42", titleBg: "#f0f0f0", titleFg: "#9d9d9f", btnColor: "#4078f2" },
    "solarized-dark": { bg: "#002b36", fg: "#839496", titleBg: "#073642", titleFg: "#586e75", btnColor: "#2aa198" },
    "solarized-light": { bg: "#fdf6e3", fg: "#657b83", titleBg: "#eee8d5", titleFg: "#93a1a1", btnColor: "#2aa198" },
  };
  return themes[theme] || themes["monokai"];
}

export async function renderCode(options: RenderOptions): Promise<void> {
  const { code, lang, title, theme, width, padding, fontSize, window, lineNumbers, highQuality, outputPath } = options;
  const colors = getThemeColors(theme);
  const scale = highQuality ? 2 : 1;

  const shikiTheme = theme === "github-dark" ? "github-dark" :
    theme === "github-light" ? "github-light" :
    theme === "nord" ? "nord" :
    theme === "dracula" ? "dracula" :
    theme === "one-dark" ? "one-dark-pro" :
    theme === "one-light" ? "one-light" :
    theme === "solarized-dark" ? "solarized-dark" :
    theme === "solarized-light" ? "solarized-light" :
    "monokai";

  const html = await codeToHtml(code, {
    lang,
    theme: shikiTheme,
  });

  const lineCount = code.split("\n").length;
  const lineNumWidth = lineNumbers ? 56 : 0;
  const innerWidth = width - padding * 2 - lineNumWidth;
  const codeFontSize = fontSize;
  const lineHeight = codeFontSize * 1.5;
  const codeHeight = lineCount * lineHeight + padding * 2;
  const titleBarHeight = window ? 38 : 0;
  const titlePadding = window ? 16 : padding;
  const totalHeight = titleBarHeight + codeHeight + (window ? 12 : 0);

  const titleBarHTML = window ? `
    <div style="
      display:flex; align-items:center; height:${titleBarHeight}px;
      padding:0 ${titlePadding}px;
      background:${colors.titleBg};
      border-radius:8px 8px 0 0;
      user-select:none;
    ">
      <div style="display:flex; gap:8px; margin-right:16px;">
        <div style="width:12px;height:12px;border-radius:50%;background:#ff5f56;"></div>
        <div style="width:12px;height:12px;border-radius:50%;background:#ffbd2e;"></div>
        <div style="width:12px;height:12px;border-radius:50%;background:#27c93f;"></div>
      </div>
      <div style="
        flex:1; text-align:center;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        font-size:13px; color:${colors.titleFg};
      ">${escapeHtml(title)}</div>
      <div style="width:52px;"></div>
    </div>` : "";

  const lineNumHTML = lineNumbers ? `
    <div style="
      padding:${padding}px 0;
      text-align:right;
      user-select:none;
      opacity:0.4;
      font-family:'JetBrains Mono','Fira Code',monospace;
      font-size:${codeFontSize}px;
      line-height:${lineHeight};
      color:${colors.fg};
      width:${lineNumWidth}px;
      flex-shrink:0;
    ">${Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join("")}</div>` : "";

  const doc = `<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;background:transparent;">
  <div style="
    width:${width}px;
    background:${colors.bg};
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 20px 60px rgba(0,0,0,0.3);
    font-family:'JetBrains Mono','Fira Code',monospace;
  ">
    ${titleBarHTML}
    <div style="display:flex; padding:${padding}px ${padding}px ${padding}px ${padding}px;">
      ${lineNumHTML}
      <div style="flex:1; overflow-x:auto;">
        <div style="
          font-size:${codeFontSize}px;
          line-height:${lineHeight};
        ">
          ${html}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  mkdirSync(dirname(outputPath), { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(doc, { waitUntil: "load" });
    await page.setViewport({
      width: Math.round(width * scale),
      height: Math.round(totalHeight * scale),
      deviceScaleFactor: scale,
    });

    const element = await page.$("body > div");
    if (!element) throw new Error("Failed to find rendered element");

    await element.screenshot({
      path: outputPath,
      omitBackground: true,
    });
  } finally {
    await browser.close();
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
