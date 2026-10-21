import { h } from 'preact'
import htm from 'htm'
import { Paper } from './Paper.js'

const html = htm.bind(h)

export function Intro({ demo, photo, onDemo, onOpenSkill }) {
  const back = demo[0]
  const front = demo[1]
  if (!back || !front) return null

  return html`
    <section class="intro">
      <div class="intro-copy">
        <span class="eyebrow">BYOK · 智能头版生成器</span>
        <h1>把一张照片，<br />做成一张<em>头版</em>。</h1>
        <p class="intro-lede">
          上传照片、写下场景，模型会写出三种不同角度的报道，并把它们排成可直接打印的报纸或海报。
          版块可拖动、文字可直接改，最后导出 PNG 或打印成 PDF。
        </p>

        <div class="intro-steps">
          <div class="intro-step">
            <span class="step-n">01</span>
            <span class="step-t">给素材</span>
            <span class="step-d">一张照片 + 一句描述，模型据此写稿。</span>
          </div>
          <div class="intro-step">
            <span class="step-n">02</span>
            <span class="step-t">选方案</span>
            <span class="step-d">三套版式并排，挑一套进入画布。</span>
          </div>
          <div class="intro-step">
            <span class="step-n">03</span>
            <span class="step-t">微调导出</span>
            <span class="step-d">拖版块、改文字、换主色，导出图片。</span>
          </div>
        </div>

        <div class="intro-actions">
          <button class="btn solid" onClick=${onDemo}>载入示例，先看效果 →</button>
          <button class="btn" onClick=${onOpenSkill}>看看内置设计 Skill</button>
        </div>

        <div class="intro-foot">3 套版式 · 5 组配色 · 8 条编辑设计纪律 · 零后端</div>
      </div>

      <div class="intro-visual">
        <div class="intro-paper-back">
          <${Paper} scheme=${back} format="newspaper" photo=${photo} scale=${0.42} />
        </div>
        <div class="intro-paper-front">
          <${Paper} scheme=${front} format="newspaper" photo=${photo} scale=${0.48} />
        </div>
        <span class="intro-visual-foot">示例稿件 · 方案 B / 小报冲击</span>
      </div>
    </section>
  `
}
