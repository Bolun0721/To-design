/**
 * 由 scripts/fetch-web-fonts.mjs 生成，请勿手改。
 * 海报导出时按 family + weight 找文件，base64 嵌入 SVG，保证 PNG 与预览一致。
 */
export const WEB_FONT_FILES = [
  {
    "family": "Playfair Display",
    "weight": "700",
    "style": "normal",
    "file": "/fonts/web/playfair-display-700.woff2"
  },
  {
    "family": "Playfair Display",
    "weight": "900",
    "style": "normal",
    "file": "/fonts/web/playfair-display-900.woff2"
  },
  {
    "family": "PT Serif",
    "weight": "400",
    "style": "normal",
    "file": "/fonts/web/pt-serif-400.woff2"
  },
  {
    "family": "PT Serif",
    "weight": "700",
    "style": "normal",
    "file": "/fonts/web/pt-serif-700.woff2"
  },
  {
    "family": "Source Sans 3",
    "weight": "400",
    "style": "normal",
    "file": "/fonts/web/source-sans-3-400.woff2"
  },
  {
    "family": "Source Sans 3",
    "weight": "600",
    "style": "normal",
    "file": "/fonts/web/source-sans-3-600.woff2"
  },
  {
    "family": "Source Sans 3",
    "weight": "700",
    "style": "normal",
    "file": "/fonts/web/source-sans-3-700.woff2"
  },
  {
    "family": "Source Serif 4",
    "weight": "400",
    "style": "normal",
    "file": "/fonts/web/source-serif-4-400.woff2"
  },
  {
    "family": "Source Serif 4",
    "weight": "600",
    "style": "normal",
    "file": "/fonts/web/source-serif-4-600.woff2"
  },
  {
    "family": "Source Serif 4",
    "weight": "700",
    "style": "normal",
    "file": "/fonts/web/source-serif-4-700.woff2"
  },
  {
    "family": "IBM Plex Mono",
    "weight": "400",
    "style": "normal",
    "file": "/fonts/web/ibm-plex-mono-400.woff2"
  },
  {
    "family": "IBM Plex Mono",
    "weight": "600",
    "style": "normal",
    "file": "/fonts/web/ibm-plex-mono-600.woff2"
  }
]

export function webFontFilesFor(families = []) {
  const wanted = new Set(families.filter(Boolean))
  return WEB_FONT_FILES.filter((entry) => wanted.has(entry.family))
}
