# 代号：猫

一款基于 HTML5 Canvas 的像素风格互动养成游戏。

## 运行方式

**本地运行（推荐）：** 任意静态服务器启动即可，比如：
```bash
# Python 3
python3 -m http.server 8080
# 然后浏览器访问 http://localhost:8080
```
或使用 VS Code 的 Live Server 插件直接打开 `index.html`。

**直接双击 index.html 可能会因浏览器安全策略（图片/音频跨协议）导致资源加载失败**，请务必通过 http 协议访问。

## 目录结构

```
cat_game/
├── index.html              # 入口（含所有内联配置 JSON）
├── css/style.css           # 像素风样式
├── js/
│   ├── config.js           # 读取内联 JSON 配置
│   ├── storage.js          # localStorage 存档封装
│   ├── audio.js            # 猫叫加权随机播放
│   ├── llm.js              # LLM 请求与容错
│   ├── ui.js               # 弹窗 / Toast / 对话框
│   ├── cat.js              # Canvas 渲染 & 点击区判定
│   └── main.js             # 入口整合
├── images/
│   ├── Cat.png             # 默认状态
│   └── Cat_listen.png      # 聆听状态
└── audio/
    └── Meow1.mp3           # 已提供一个占位；其余 10 个请按命名 Meow2.mp3~Meow11.mp3 放入同目录
```

## 需要你补齐的资源

1. **猫叫音频**：`audio/Meow2.mp3` ~ `audio/Meow11.mp3`。文件命名对应 `index.html` 内联配置 `meows[].file` 字段；只放 `Meow1.mp3` 也可以正常运行（只会随机到这一首）。
2. **像素中文字体（可选）**：如果希望严格的像素中文显示效果，可以将 `Zpix.ttf` 或 `FusionPixel.ttf` 放入 `fonts/` 目录并在 `style.css` 顶部添加：
    ```css
    @font-face {
      font-family: "Zpix";
      src: url("../fonts/Zpix.ttf") format("truetype");
      font-display: swap;
    }
    ```
   项目默认已经在字体回退链里引用了这些名字，放入资源即自动生效。

## 配置说明（index.html 内的 `<script id="gameConfig">`）

所有可调项都在 JSON 里：

| 字段 | 作用 |
|---|---|
| `affinity.initial` | 初始好感度 |
| `affinity.voiceGainChance` | 对话获得 +1 好感的概率（默认 0.2） |
| `affinity.dailyVoiceChanceCap` | 每日对话好感上限 |
| `player.initialCoins` | 初始金币（默认 200，便于开发测试） |
| `cooldownMs` | 通用交互节流（默认 200ms） |
| `meows[]` | 11 种猫叫配置，`weight` 为加权概率 |
| `foods[]` | 食物清单（可任意扩展） |
| `interactions[]` | 互动清单（可任意扩展，`requireItem` 为所需道具 id） |
| `shop[]` | 商店商品（可任意扩展） |
| `hitAreas[]` | 4 个点击判定区（头/身体/爪子/尾巴）的百分比位置 |
| `llm.systemPrompt` | 提示词模板，`{action}` `{mood}` 会被替换 |

## 点击区域微调

在 `index.html` 内联 JSON 中的 `hitAreas` 每一项都用百分比定义（0~1）：
```json
{ "id": "head",  "name": "头部", "xPct": 0.30, "yPct": 0.05, "wPct": 0.50, "hPct": 0.30 }
```

**调试可视化**：打开浏览器控制台输入
```js
window.GAME.DEBUG_HITAREAS = true; window.GAME.redraw();
```
即可在猫身上看到 4 个红色判定框，边调边看。

## LLM 接入

点击左上角 ⚙️ 按钮可填入：
- API Endpoint（任意 POST JSON 接口）
- API Key（可选，会作为 `Authorization: Bearer xxx` 发送）

请求体：
```json
{
  "prompt": "拼装后的完整提示词",
  "action": "触摸头部",
  "mood": 45
}
```

响应支持多种格式（兼容 OpenAI 风格 `choices[0].message.content`、阿里百炼等），也支持最简单的：
```json
{ "text": "喵…不想被碰" }
```

未启用或调用失败时，界面会显示 `喵~` 作为占位。

## 交互说明

- **🎙️ 长按 Voice**：猫切换聆听图；松开播放随机猫叫 + 对话回调。对话有 20% 概率 +1 好感，每日上限 10。
- **点击猫身**：按头/身体/爪子/尾巴触发不同的 LLM 心理活动。
- **投喂按钮**：消耗对应食物，增加好感。
- **互动按钮**：需要指定道具（铲子/逗猫棒），背包为 0 会 alert 提示去商店。
- **🛒 商店**：花金币购买道具。

## 特性

- ✅ 纯离线（除 LLM 外），无任何外部 CDN
- ✅ 单文件配置驱动，扩展新商品/互动只需改 JSON
- ✅ 所有按钮 200ms 节流防连点
- ✅ 触摸端 `touchstart/touchend` + `preventDefault` 阻断长按菜单
- ✅ 猫 Canvas 使用 DPR 自适应，像素不糊
- ✅ localStorage 持久化好感/金币/背包/每日计数/LLM 配置
- ✅ 每日 0 点自动重置对话好感计数
