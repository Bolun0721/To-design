# Emoji 轮廓图标 · SVG 代码集

共 **51** 枚。全部为 outline 风格，统一 24×24 网格。

## 规范

| 项 | 值 |
|---|---|
| 画布 | `viewBox="0 0 24 24"` |
| 填充 | `fill="none"`（全部为描边，无实心块） |
| 描边色 | `stroke="currentColor"`（跟随文字色，可用 CSS `color` 控制） |
| 线宽 | `stroke-width="1.75"` |
| 端点/拐角 | `stroke-linecap="round" stroke-linejoin="round"` |
| 光学留白 | 圆形类外径 18（r=9）；方形类贴边 2px |

> 改颜色：给外层元素设 `color`，或把 `currentColor` 换成具体色值。
> 改粗细：`stroke-width` 建议随尺寸等比缩放，例如 32px 用 `2`、16px 用 `1.25`。

## 索引

- **表情**（6）：[微笑](#smile) [咧嘴笑](#grin) [笑哭](#joy) [眨眼](#wink) [睡着](#sleepy) [思考](#thinking)
- **手势与人**（4）：[点赞](#thumbs-up) [点踩](#thumbs-down) [挥手](#wave) [用户](#user)
- **心与符号**（8）：[爱心](#heart) [心碎](#broken-heart) [闪光](#sparkles) [星星](#star) [火焰](#fire) [闪电](#zap) [完成](#check-circle) [关闭](#x-circle)
- **天气**（6）：[太阳](#sun) [月亮](#moon) [云](#cloud) [雨伞](#umbrella) [雪花](#snowflake) [彩虹](#rainbow)
- **食物**（5）：[蛋糕](#cake) [咖啡](#coffee) [苹果](#apple) [樱桃](#cherry) [披萨](#pizza)
- **物品**（9）：[礼物](#gift) [相机](#camera) [手机](#smartphone) [邮件](#mail) [日历](#calendar) [时钟](#clock) [锁](#lock) [钥匙](#key) [灯泡](#lightbulb)
- **场所与交通**（5）：[主页](#home) [汽车](#car) [飞机](#plane) [火箭](#rocket) [地球](#globe)
- **界面与其他**（8）：[搜索](#search) [设置](#gear) [铃铛](#bell) [消息](#message) [书签](#bookmark) [奖杯](#trophy) [上升](#trending-up) [音乐](#music)

---

## 表情

### smile

`😀` 微笑 · `smile` · 分组：表情

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/>
  <path d="M9 9.5h.01"/>
  <path d="M15 9.5h.01"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01"/><path d="M15 9.5h.01"/></svg>
```

</details>

### grin

`😁` 咧嘴笑 · `grin` · 分组：表情

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M8.8 9.5h.01"/>
  <path d="M15.2 9.5h.01"/>
  <path d="M8 14.2h8a4 4 0 0 1-8 0Z"/>
  <path d="M10.5 14.2v2.1"/>
  <path d="M13.5 14.2v2.1"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.8 9.5h.01"/><path d="M15.2 9.5h.01"/><path d="M8 14.2h8a4 4 0 0 1-8 0Z"/><path d="M10.5 14.2v2.1"/><path d="M13.5 14.2v2.1"/></svg>
```

</details>

### joy

`😂` 笑哭 · `joy` · 分组：表情

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M7.6 9.8c.6-1.3 1.8-1.3 2.4 0"/>
  <path d="M14 9.8c.6-1.3 1.8-1.3 2.4 0"/>
  <path d="M8 14h8a4 4 0 0 1-8 0Z"/>
  <path d="M7.3 13.2c-.9 1.4-.9 2.7.1 3.4"/>
  <path d="M16.7 13.2c.9 1.4.9 2.7-.1 3.4"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M7.6 9.8c.6-1.3 1.8-1.3 2.4 0"/><path d="M14 9.8c.6-1.3 1.8-1.3 2.4 0"/><path d="M8 14h8a4 4 0 0 1-8 0Z"/><path d="M7.3 13.2c-.9 1.4-.9 2.7.1 3.4"/><path d="M16.7 13.2c.9 1.4.9 2.7-.1 3.4"/></svg>
```

</details>

### wink

`😉` 眨眼 · `wink` · 分组：表情

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M8.8 9.5h.01"/>
  <path d="M13.8 10c1-1.4 2.4-1.4 3.4 0"/>
  <path d="M8.5 14.6c2 1.4 5 1.4 7-.6"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.8 9.5h.01"/><path d="M13.8 10c1-1.4 2.4-1.4 3.4 0"/><path d="M8.5 14.6c2 1.4 5 1.4 7-.6"/></svg>
```

</details>

### sleepy

`😴` 睡着 · `sleepy` · 分组：表情

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M8 10.2c1-1 2-1 3 0"/>
  <path d="M13 10.2c1-1 2-1 3 0"/>
  <path d="M10.5 15.5c1 .7 2 .7 3 0"/>
  <path d="M17.5 2.5h3.5l-3.5 3.5h3.5"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 10.2c1-1 2-1 3 0"/><path d="M13 10.2c1-1 2-1 3 0"/><path d="M10.5 15.5c1 .7 2 .7 3 0"/><path d="M17.5 2.5h3.5l-3.5 3.5h3.5"/></svg>
```

</details>

### thinking

`🤔` 思考 · `thinking` · 分组：表情

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M9 9.5h.01"/>
  <path d="M14.6 9.5h.01"/>
  <path d="M9.2 15h3"/>
  <path d="M15 15.2v1.8a1.5 1.5 0 0 0 1.5 1.5h1"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9.5h.01"/><path d="M14.6 9.5h.01"/><path d="M9.2 15h3"/><path d="M15 15.2v1.8a1.5 1.5 0 0 0 1.5 1.5h1"/></svg>
```

</details>

---

## 手势与人

### thumbs-up

`👍` 点赞 · `thumbs-up` · 分组：手势与人

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M7 10.5v11"/>
  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10.5v11"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
```

</details>

### thumbs-down

`👎` 点踩 · `thumbs-down` · 分组：手势与人

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <g transform="rotate(180 12 12)"><path d="M7 10.5v11"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></g>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(180 12 12)"><path d="M7 10.5v11"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></g></svg>
```

</details>

### wave

`👋` 挥手 · `wave` · 分组：手势与人

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
  <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
  <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
```

</details>

### user

`👤` 用户 · `user` · 分组：手势与人

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"/>
  <circle cx="12" cy="7.5" r="4"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"/><circle cx="12" cy="7.5" r="4"/></svg>
```

</details>

---

## 心与符号

### heart

`❤️` 爱心 · `heart` · 分组：心与符号

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20.7C7 16.9 3.2 13.9 3.2 9.9A4.8 4.8 0 0 1 12 6.6 4.8 4.8 0 0 1 20.8 9.9C20.8 13.9 17 16.9 12 20.7Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.7C7 16.9 3.2 13.9 3.2 9.9A4.8 4.8 0 0 1 12 6.6 4.8 4.8 0 0 1 20.8 9.9C20.8 13.9 17 16.9 12 20.7Z"/></svg>
```

</details>

### broken-heart

`💔` 心碎 · `broken-heart` · 分组：心与符号

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20.7C7 16.9 3.2 13.9 3.2 9.9A4.8 4.8 0 0 1 12 6.6 4.8 4.8 0 0 1 20.8 9.9C20.8 13.9 17 16.9 12 20.7Z"/>
  <path d="M12 6.8 9.8 10.4l3.2 2.2-2.8 3.6"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.7C7 16.9 3.2 13.9 3.2 9.9A4.8 4.8 0 0 1 12 6.6 4.8 4.8 0 0 1 20.8 9.9C20.8 13.9 17 16.9 12 20.7Z"/><path d="M12 6.8 9.8 10.4l3.2 2.2-2.8 3.6"/></svg>
```

</details>

### sparkles

`✨` 闪光 · `sparkles` · 分组：心与符号

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
  <path d="M5 3v3.5"/>
  <path d="M19 17v3.5"/>
  <path d="M3 5h3.5"/>
  <path d="M17.5 19H21"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v3.5"/><path d="M19 17v3.5"/><path d="M3 5h3.5"/><path d="M17.5 19H21"/></svg>
```

</details>

### star

`⭐` 星星 · `star` · 分组：心与符号

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2.8 L14.23 8.93 L20.75 14.84 L15.61 13.17 L17.41 19.44 L12 15.8 L6.59 19.44 L8.39 13.17 L3.25 9.16 L9.77 8.93 Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 L14.23 8.93 L20.75 14.84 L15.61 13.17 L17.41 19.44 L12 15.8 L6.59 19.44 L8.39 13.17 L3.25 9.16 L9.77 8.93 Z"/></svg>
```

</details>

### fire

`🔥` 火焰 · `fire` · 分组：心与符号

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .2 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .2 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/></svg>
```

</details>

### zap

`⚡` 闪电 · `zap` · 分组：心与符号

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M13 2.5 5.5 13.5H11l-1 8 8-11.5h-5.5l.5-7.5Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2.5 5.5 13.5H11l-1 8 8-11.5h-5.5l.5-7.5Z"/></svg>
```

</details>

### check-circle

`✅` 完成 · `check-circle` · 分组：心与符号

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M8.2 12.4l2.6 2.6 5-5.2"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.2 12.4l2.6 2.6 5-5.2"/></svg>
```

</details>

### x-circle

`❌` 关闭 · `x-circle` · 分组：心与符号

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M9.4 9.4l5.2 5.2"/>
  <path d="M14.6 9.4l-5.2 5.2"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.4 9.4l5.2 5.2"/><path d="M14.6 9.4l-5.2 5.2"/></svg>
```

</details>

---

## 天气

### sun

`☀️` 太阳 · `sun` · 分组：天气

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2.2"/>
  <path d="M12 19.8V22"/>
  <path d="M4.93 4.93l1.56 1.56"/>
  <path d="M17.51 17.51l1.56 1.56"/>
  <path d="M2 12h2.2"/>
  <path d="M19.8 12H22"/>
  <path d="M6.49 17.51 4.93 19.07"/>
  <path d="M19.07 4.93l-1.56 1.56"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.2"/><path d="M12 19.8V22"/><path d="M4.93 4.93l1.56 1.56"/><path d="M17.51 17.51l1.56 1.56"/><path d="M2 12h2.2"/><path d="M19.8 12H22"/><path d="M6.49 17.51 4.93 19.07"/><path d="M19.07 4.93l-1.56 1.56"/></svg>
```

</details>

### moon

`🌙` 月亮 · `moon` · 分组：天气

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>
```

</details>

### cloud

`☁️` 云 · `cloud` · 分组：天气

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
```

</details>

### umbrella

`☔` 雨伞 · `umbrella` · 分组：天气

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 12a10.05 10.05 1 0 0-20 0Z"/>
  <path d="M12 12v8a2 2 0 0 0 4 0"/>
  <path d="M12 12v8a2 2 0 0 1-4 0"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12a10.05 10.05 1 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 12v8a2 2 0 0 1-4 0"/></svg>
```

</details>

### snowflake

`❄️` 雪花 · `snowflake` · 分组：天气

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2.5v19"/>
  <path d="M2.5 12h19"/>
  <path d="M5.3 5.3l13.4 13.4"/>
  <path d="M18.7 5.3 5.3 18.7"/>
  <path d="M9.4 5.6 12 8.2l2.6-2.6"/>
  <path d="M9.4 18.4 12 15.8l2.6 2.6"/>
  <path d="M5.6 9.4 8.2 12l-2.6 2.6"/>
  <path d="M18.4 9.4 15.8 12l2.6 2.6"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5v19"/><path d="M2.5 12h19"/><path d="M5.3 5.3l13.4 13.4"/><path d="M18.7 5.3 5.3 18.7"/><path d="M9.4 5.6 12 8.2l2.6-2.6"/><path d="M9.4 18.4 12 15.8l2.6 2.6"/><path d="M5.6 9.4 8.2 12l-2.6 2.6"/><path d="M18.4 9.4 15.8 12l2.6 2.6"/></svg>
```

</details>

### rainbow

`🌈` 彩虹 · `rainbow` · 分组：天气

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 15a9 9 0 0 1 18 0"/>
  <path d="M6.5 15a5.5 5.5 0 0 1 11 0"/>
  <path d="M10 15a2 2 0 0 1 4 0"/>
  <path d="M3 15v3.5"/>
  <path d="M21 15v3.5"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15a9 9 0 0 1 18 0"/><path d="M6.5 15a5.5 5.5 0 0 1 11 0"/><path d="M10 15a2 2 0 0 1 4 0"/><path d="M3 15v3.5"/><path d="M21 15v3.5"/></svg>
```

</details>

---

## 食物

### cake

`🎂` 蛋糕 · `cake` · 分组：食物

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.5 20.5v-6.2a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v6.2"/>
  <path d="M2.5 20.5h19"/>
  <path d="M4.5 16.5h15"/>
  <path d="M12 12.3V5"/>
  <path d="M12 5c1.3-1.1 1.5-2.4 .5-3.1-.4 1-1.1 1.4-1.5 2.1"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 20.5v-6.2a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v6.2"/><path d="M2.5 20.5h19"/><path d="M4.5 16.5h15"/><path d="M12 12.3V5"/><path d="M12 5c1.3-1.1 1.5-2.4 .5-3.1-.4 1-1.1 1.4-1.5 2.1"/></svg>
```

</details>

### coffee

`☕` 咖啡 · `coffee` · 分组：食物

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17 8.5h1.2a3.3 3.3 0 1 1 0 6.6H17"/>
  <path d="M3.5 8.5h13.5v7.5a4.5 4.5 0 0 1-4.5 4.5H8a4.5 4.5 0 0 1-4.5-4.5V8.5Z"/>
  <path d="M6.5 2v2.6"/>
  <path d="M10 2v2.6"/>
  <path d="M13.5 2v2.6"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8.5h1.2a3.3 3.3 0 1 1 0 6.6H17"/><path d="M3.5 8.5h13.5v7.5a4.5 4.5 0 0 1-4.5 4.5H8a4.5 4.5 0 0 1-4.5-4.5V8.5Z"/><path d="M6.5 2v2.6"/><path d="M10 2v2.6"/><path d="M13.5 2v2.6"/></svg>
```

</details>

### apple

`🍎` 苹果 · `apple` · 分组：食物

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20.9c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.8 0-4 1.5-5 1.5S9.8 5 7 5a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
  <path d="M10 2c1 .5 2 2 2 3.5S11 8 10 8"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.9c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.8 0-4 1.5-5 1.5S9.8 5 7 5a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 3.5S11 8 10 8"/></svg>
```

</details>

### cherry

`🍒` 樱桃 · `cherry` · 分组：食物

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="7.5" cy="17" r="3.4"/>
  <circle cx="16.8" cy="17.6" r="2.8"/>
  <path d="M7.5 13.6c.4-3.4 2.9-6 6-7.1"/>
  <path d="M16.8 14.8c.4-2.3 1.4-4.2 2.9-5.3"/>
  <path d="M13.5 6.5c1-2.4 3-3.4 5.6-3.4 0 2-1.6 4-3.6 4.5"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="17" r="3.4"/><circle cx="16.8" cy="17.6" r="2.8"/><path d="M7.5 13.6c.4-3.4 2.9-6 6-7.1"/><path d="M16.8 14.8c.4-2.3 1.4-4.2 2.9-5.3"/><path d="M13.5 6.5c1-2.4 3-3.4 5.6-3.4 0 2-1.6 4-3.6 4.5"/></svg>
```

</details>

### pizza

`🍕` 披萨 · `pizza` · 分组：食物

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2.8 3.7 19.2A9.4 9.4 0 0 0 12 21a9.4 9.4 0 0 0 8.3-1.8L12 2.8Z"/>
  <path d="M5.4 17.1c2.1.8 4.3 1.2 6.6 1.2s4.5-.4 6.6-1.2"/>
  <path d="M8.4 13.6h.01"/>
  <path d="M12 11.4h.01"/>
  <path d="M15.4 14.2h.01"/>
  <path d="M11.3 16.4h.01"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 3.7 19.2A9.4 9.4 0 0 0 12 21a9.4 9.4 0 0 0 8.3-1.8L12 2.8Z"/><path d="M5.4 17.1c2.1.8 4.3 1.2 6.6 1.2s4.5-.4 6.6-1.2"/><path d="M8.4 13.6h.01"/><path d="M12 11.4h.01"/><path d="M15.4 14.2h.01"/><path d="M11.3 16.4h.01"/></svg>
```

</details>

---

## 物品

### gift

`🎁` 礼物 · `gift` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 12v9H4v-9"/>
  <path d="M2.5 7h19v5h-19z"/>
  <path d="M12 21V7"/>
  <path d="M12 7H7.6a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z"/>
  <path d="M12 7h4.4a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v9H4v-9"/><path d="M2.5 7h19v5h-19z"/><path d="M12 21V7"/><path d="M12 7H7.6a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z"/><path d="M12 7h4.4a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/></svg>
```

</details>

### camera

`📷` 相机 · `camera` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/>
  <circle cx="12" cy="13" r="3.4"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.4"/></svg>
```

</details>

### smartphone

`📱` 手机 · `smartphone` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="6" y="2.5" width="12" height="19" rx="2.5"/>
  <path d="M10.8 18.6h2.4"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.8 18.6h2.4"/></svg>
```

</details>

### mail

`✉️` 邮件 · `mail` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2.5" y="5" width="19" height="14" rx="2"/>
  <path d="M3.2 7.2 12 13.2l8.8-6"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3.2 7.2 12 13.2l8.8-6"/></svg>
```

</details>

### calendar

`📅` 日历 · `calendar` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3.5" y="5" width="17" height="15.5" rx="2"/>
  <path d="M8 3v4"/>
  <path d="M16 3v4"/>
  <path d="M3.5 10.5h17"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3.5 10.5h17"/></svg>
```

</details>

### clock

`🕐` 时钟 · `clock` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M12 6.8v5.6l3.6 2"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6.8v5.6l3.6 2"/></svg>
```

</details>

### lock

`🔒` 锁 · `lock` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="10.5" width="16" height="10" rx="2"/>
  <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/>
  <path d="M12 14.4v2.4"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/><path d="M12 14.4v2.4"/></svg>
```

</details>

### key

`🔑` 钥匙 · `key` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="17.5" cy="6.5" r="3.4"/>
  <path d="M15.2 8.8 4.5 19.5"/>
  <path d="M8 16l2.5 2.5"/>
  <path d="M10.5 13.5 13 16"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="17.5" cy="6.5" r="3.4"/><path d="M15.2 8.8 4.5 19.5"/><path d="M8 16l2.5 2.5"/><path d="M10.5 13.5 13 16"/></svg>
```

</details>

### lightbulb

`💡` 灯泡 · `lightbulb` · 分组：物品

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9.5 18h5"/>
  <path d="M10.5 21.5h3"/>
  <path d="M15.1 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.9 14"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 18h5"/><path d="M10.5 21.5h3"/><path d="M15.1 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.9 14"/></svg>
```

</details>

---

## 场所与交通

### home

`🏠` 主页 · `home` · 分组：场所与交通

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 10.5 12 3l9 7.5"/>
  <path d="M5.2 9.6V21h13.6V9.6"/>
  <path d="M9.6 21v-6.6h4.8V21"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.2 9.6V21h13.6V9.6"/><path d="M9.6 21v-6.6h4.8V21"/></svg>
```

</details>

### car

`🚗` 汽车 · `car` · 分组：场所与交通

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3.5 15.4h17l-1.75-5.2H5.25L3.5 15.4Z"/>
  <path d="M6.6 10.2 8.1 6.6h7.8l1.5 3.6"/>
  <path d="M8.6 10.2h6.8"/>
  <circle cx="7.6" cy="16.4" r="2"/>
  <circle cx="16.4" cy="16.4" r="2"/>
  <path d="M9.6 16.4h4.8"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 15.4h17l-1.75-5.2H5.25L3.5 15.4Z"/><path d="M6.6 10.2 8.1 6.6h7.8l1.5 3.6"/><path d="M8.6 10.2h6.8"/><circle cx="7.6" cy="16.4" r="2"/><circle cx="16.4" cy="16.4" r="2"/><path d="M9.6 16.4h4.8"/></svg>
```

</details>

### plane

`✈️` 飞机 · `plane` · 分组：场所与交通

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14.54 21.69a.5.5 0 0 0 .93-.03l6.5-19a.5.5 0 0 0-.63-.63l-19 6.5a.5.5 0 0 0-.03.93l7.93 3.18a2 2 0 0 1 1.11 1.11Z"/>
  <path d="m21.85 2.15-10.94 10.94"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.54 21.69a.5.5 0 0 0 .93-.03l6.5-19a.5.5 0 0 0-.63-.63l-19 6.5a.5.5 0 0 0-.03.93l7.93 3.18a2 2 0 0 1 1.11 1.11Z"/><path d="m21.85 2.15-10.94 10.94"/></svg>
```

</details>

### rocket

`🚀` 火箭 · `rocket` · 分组：场所与交通

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/>
  <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/>
  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
```

</details>

### globe

`🌍` 地球 · `globe` · 分组：场所与交通

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M3.2 9h17.6"/>
  <path d="M3.2 15h17.6"/>
  <path d="M12 3A5 9 0 0 1 12 21A5 9 0 0 1 12 3Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.2 9h17.6"/><path d="M3.2 15h17.6"/><path d="M12 3A5 9 0 0 1 12 21A5 9 0 0 1 12 3Z"/></svg>
```

</details>

---

## 界面与其他

### search

`🔍` 搜索 · `search` · 分组：界面与其他

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="11" cy="11" r="7"/>
  <path d="M20.6 20.6 16.1 16.1"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20.6 20.6 16.1 16.1"/></svg>
```

</details>

### gear

`⚙️` 设置 · `gear` · 分组：界面与其他

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20.8 12 L17.91 14.45 L18.22 18.22 L14.45 17.91 L12 20.8 L9.55 17.91 L5.78 18.22 L7.09 14.45 L3.2 12 L7.09 9.55 L5.78 5.78 L9.55 7.09 L12 3.2 L14.45 7.09 L18.22 5.78 L17.91 9.55 Z"/>
  <circle cx="12" cy="12" r="3.2"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 12 L17.91 14.45 L18.22 18.22 L14.45 17.91 L12 20.8 L9.55 17.91 L5.78 18.22 L7.09 14.45 L3.2 12 L7.09 9.55 L5.78 5.78 L9.55 7.09 L12 3.2 L14.45 7.09 L18.22 5.78 L17.91 9.55 Z"/><circle cx="12" cy="12" r="3.2"/></svg>
```

</details>

### bell

`🔔` 铃铛 · `bell` · 分组：界面与其他

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 8.5a6 6 0 0 1 12 0c0 6.5 3 8.5 3 8.5H3s3-2 3-8.5"/>
  <path d="M10.3 20.8a1.94 1.94 0 0 0 3.4 0"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8.5a6 6 0 0 1 12 0c0 6.5 3 8.5 3 8.5H3s3-2 3-8.5"/><path d="M10.3 20.8a1.94 1.94 0 0 0 3.4 0"/></svg>
```

</details>

### message

`💬` 消息 · `message` · 分组：界面与其他

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
```

</details>

### bookmark

`🔖` 书签 · `bookmark` · 分组：界面与其他

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/></svg>
```

</details>

### trophy

`🏆` 奖杯 · `trophy` · 分组：界面与其他

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
  <path d="M4 22h16"/>
  <path d="M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22"/>
  <path d="M14 14.7V17c0 .6 .5 1 1 1.2 1.1 .6 2 2 2 3.8"/>
  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22"/><path d="M14 14.7V17c0 .6 .5 1 1 1.2 1.1 .6 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
```

</details>

### trending-up

`📈` 上升 · `trending-up` · 分组：界面与其他

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 7.5 13.5 16 8.5 11 2 17.5"/>
  <path d="M16 7.5h6v6"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 7.5 13.5 16 8.5 11 2 17.5"/><path d="M16 7.5h6v6"/></svg>
```

</details>

### music

`🎵` 音乐 · `music` · 分组：界面与其他

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 17.5V5l11-2.2v12.4"/>
  <circle cx="6" cy="17.8" r="3"/>
  <circle cx="17" cy="15.6" r="3"/>
</svg>
```

<details><summary>单行紧凑版</summary>

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.5V5l11-2.2v12.4"/><circle cx="6" cy="17.8" r="3"/><circle cx="17" cy="15.6" r="3"/></svg>
```

</details>

---

## 批量用法

若不想逐个内联，使用 sprite 文件 `emoji-outline-icons.svg`，一次引入后按 id 引用：

```html
<svg class="icon"><use href="#eo-heart"/></svg>
```

```css
.icon { width: 24px; height: 24px; stroke-width: 1.75; color: #1a1a1f; }
```

> 注意：sprite 内**不写** `stroke-width`。若写在 `<symbol>` 上，使用方的 CSS 覆盖不掉（presentation attribute 优先级高于继承值）。

