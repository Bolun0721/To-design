/**
 * 离线示例稿件 —— 没有 API Key 时也能完整体验「生成 → 选择 → 拖拽 → 导出」。
 * 内容为固定示例：巷口咖啡馆的一个周日下午。接入真实模型后由模型生成。
 */
import { chineseDate } from '../lib/format.js'

export const DEMO_DESCRIPTION =
  '周末下午在巷口的咖啡馆，靠窗的位置，一杯手冲和一本翻旧的书。想做成一张有年代感、像报纸头版一样的纪念图，可以打印出来贴在墙上。'

const A_BODY = [
  '下午三点，巷口的咖啡馆只坐了三桌客人。靠窗的位置上，一杯手冲刚刚注完最后一段水，滤杯里的咖啡粉缓缓塌陷下去，热气沿着玻璃向上爬。',
  '店员说，这支豆子来自云南保山，烘焙度偏浅，冲煮时水温控制在九十二度。客人没有追问风味，只是把杯子挪到光线更好的地方，看了一会儿窗外。',
  '十分钟后，杯底见空。他合上书，起身结账，推门走进下午的光里。巷口的风把门上的铜铃吹响了一声。',
]

const B_BODY = [
  '周日下午三点，巷口咖啡馆的靠窗座位再次被占满。没有会议，没有待办，只有一杯手冲和一本翻到一半的旧书。',
  '店主把水温压在九十二度，水流绕圈落下，咖啡粉鼓起又塌陷。整个过程不到三分钟，却让整张桌子安静下来。',
  '有人为这十分钟排了二十分钟的队，也有人只是路过。店主说，周末的座位不预订，先到先得。',
  '四点零七分，客人起身离开。杯子空了，书签留在原地。下一位客人坐下时，窗外的光刚好移到桌角。',
]

const C_BODY = [
  '光从窗户斜进来，落在桌面上，把杯子的影子拉得很长。咖啡馆里放着很轻的音乐，几乎听不见。',
  '手冲是店主推荐的，豆子偏酸，温度刚好。书翻到第三十七页，停了很久没有往下读。',
  '没有发生什么特别的事。杯子空的时候，下午才过了一半。',
  '离开前，他把椅子推回原位。门外的巷子很安静，像什么都没发生过。',
]

export function buildDemoPayload({ date = chineseDate(), format = 'newspaper' } = {}) {
  return {
    summary: '三套头版已完成，推荐 B：标题最有力，适合社交分享。',
    meta: {
      date,
      disclaimer: '创意报纸版式，非真实新闻',
    },
    schemes: [
      {
        id: 'A',
        name: '巷口纪事',
        layout_variant: 'classic_broadsheet',
        color_preset: 'classic_serious',
        font_pairing: 'serif_serif',
        style: { columns: 3, headline_scale: 'large', image_treatment: 'original' },
        content: {
          headline: '巷口那杯手冲',
          subhead: '一个普通的周日下午，被十分钟的等待重新计时',
          body_blocks: A_BODY.map((text) => ({ type: 'paragraph', text })),
          caption: '靠窗的座位上，一杯手冲与一本翻旧的书',
          caption_secondary: '午后的光停在桌沿，像一张没洗出来的旧照片',
          pullquote: '有些下午，不需要被安排。',
          poster_note: '周日 · 下午三点 · 巷口',
          date,
          image_placeholders: [],
        },
        design_rationale: '正式报道腔，适合打印留存与纪念',
      },
      {
        id: 'B',
        name: '十分钟逃离',
        layout_variant: 'tabloid_bold',
        color_preset: 'financial_daily',
        font_pairing: 'serif_sans',
        style: { columns: 2, headline_scale: 'large', image_treatment: 'duotone' },
        content: {
          headline: '这杯咖啡，值得上头版',
          subhead: '巷口小店的一张靠窗桌，装下了整周的松弛',
          body_blocks: B_BODY.map((text) => ({ type: 'paragraph', text })),
          caption: '靠窗的桌子，下午三点之后属于咖啡',
          caption_secondary: '下午三点的桌面与半杯咖啡',
          pullquote: '今天不赶时间。',
          poster_note: 'SPECIAL ISSUE · 001 / 十分钟',
          date,
          image_placeholders: [],
        },
        design_rationale: '强冲击标题，适合社交分享与活动传播',
      },
      {
        id: 'C',
        name: '周日，晴',
        layout_variant: 'minimal_masthead',
        color_preset: 'newsprint_single_accent',
        font_pairing: 'superfamily',
        style: { columns: 2, headline_scale: 'medium', image_treatment: 'halftone_mono' },
        content: {
          headline: '周日，晴',
          subhead: '一张照片，一杯咖啡，一段没有议程的上午',
          body_blocks: C_BODY.map((text) => ({ type: 'paragraph', text })),
          caption: '窗边的光，落在杯沿与书页之间',
          caption_secondary: '光落在杯沿，书页停在第三十七页',
          pullquote: '把生活过成可以阅读的样子。',
          poster_note: 'A QUIET SUNDAY · 001',
          date,
          image_placeholders: [],
        },
        design_rationale: '克制留白，适合展陈与画册',
      },
    ],
    _demo: { format },
  }
}
