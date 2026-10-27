/** 合并自动提取的 79 枚图标、手改覆盖和补充图标。 */
import { GENERATED_ICONS } from './icon-library.generated.js'
import { CUSTOM_ICONS, EXTRA_ICONS, ICON_OVERRIDES } from './icon-library.overrides.js'

const merged = new Map()

for (const icon of GENERATED_ICONS) {
  merged.set(icon.id, { ...icon })
}
for (const [id, override] of Object.entries(ICON_OVERRIDES)) {
  const base = merged.get(id)
  if (base) merged.set(id, { ...base, ...override })
}
for (const icon of [...CUSTOM_ICONS, ...EXTRA_ICONS]) {
  if (merged.has(icon.id)) {
    console.warn(`图标 id 冲突，忽略补充项：${icon.id}`)
    continue
  }
  merged.set(icon.id, icon)
}

export const ICON_LIBRARY = Object.fromEntries([...merged.values()].map((icon) => [icon.id, icon]))
export const ICON_IDS = Object.keys(ICON_LIBRARY)
export const ICON_GROUPS = [...new Set(Object.values(ICON_LIBRARY).map((icon) => icon.group))]

export const ICON_CATALOG = ICON_GROUPS.map((group) => ({
  group,
  items: Object.values(ICON_LIBRARY)
    .filter((icon) => icon.group === group)
    .map((icon) => ({ id: icon.id, label: icon.label })),
}))

export function getIcon(id) {
  return ICON_LIBRARY[id] || null
}

export function searchIcons(text = '') {
  const lower = String(text).toLowerCase()
  return Object.values(ICON_LIBRARY).filter((icon) =>
    [icon.id, icon.label, ...(icon.keywords || [])].some((word) =>
      lower.includes(String(word).toLowerCase()),
    ),
  )
}
