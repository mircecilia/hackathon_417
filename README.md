# 代号：猫 (V1.2)

HTML5 Canvas 像素风互动养成游戏。

## 启动

**静态服务器**，不要双击 HTML：
```bash
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## V1.2 更新概览

| 模块 | 变更 |
|---|---|
| **BGM** | 新增 `Music.mp3`（默认）+ `Music_special.mp3`（心情 20~50 专属），全程循环；讲话 & 动画猫叫时音量 ducking 到 0.06 |
| **猫叫** | 6 首猫叫齐备（Meow1~6.mp3），配置 `meows[]` 已同步 |
| **顶部按钮** | 设置 / 商店 / 语音 emoji 替换为专属像素风 SVG 图标 |
| **反应动画** | 3 组动画（舔毛 / 伸懒腰 / 吃小鱼干），严格按 `Cat → mid → action → mid → Cat` 5 阶段 × 500ms 节奏 |
| **触摸随机反馈** | 点击猫身 0.8 概率仅文本、0.1 舔毛动画、0.1 伸懒腰动画；文本框始终正常显示 |
| **小鱼干专属动画** | 投喂小鱼干成功后自动播放吃鱼动画（其他食物暂无） |
| **动作锁** | 动画期间忽略新触摸/投喂/互动请求（Toast 提示"猫咪正在忙"）|
| **猫叫时机** | 每组反应动画在"第二个 mid 帧"结束瞬间随机播放 1 声猫叫 |
| **预加载** | 初始化阶段等 11 张图片（4 基础 + 6 动画精灵 + 背景）全部 load 完才第一次渲染，避免闪烁 |

## 目录

```
cat_game/
├── index.html                  # 入口 + 内联 JSON 配置
├── css/style.css               # 所有样式
├── js/
│   ├── config.js               # 配置加载
│   ├── corpus.js               # 离线心理活动语料库（≈120 条）
│   ├── icons.js                # 14 个像素风 SVG 图标
│   ├── storage.js              # localStorage 持久化
│   ├── audio.js                # 猫叫 + BGM 管理器（含 ducking）
│   ├── llm.js                  # LLM 请求 + 语料库兜底
│   ├── ui.js                   # 弹窗 / Toast / 对话框
│   ├── cat.js                  # Canvas 渲染 + 动画调度 + 动作锁
│   └── main.js                 # 入口整合所有交互
├── images/
│   ├── Cat.png                 # 默认
│   ├── Cat_listen.png          # 长按聆听
│   ├── Cat_openMouth.png       # 猫叫张嘴
│   ├── Background.png          # 树洞背景
│   ├── lick_mid.png            # 舔毛-中间
│   ├── lick_action.png         # 舔毛-动作
│   ├── stretch_mid.png         # 伸懒腰-中间
│   ├── stretch_action.png      # 伸懒腰-动作
│   ├── fish_mid.png            # 吃鱼-中间
│   └── fish_action.png         # 吃鱼-动作
└── audio/
    ├── Meow1.mp3 ~ Meow6.mp3   # 6 声猫叫
    ├── Music.mp3               # 默认 BGM（当前是 Music_special 的副本占位）
    └── Music_special.mp3       # 心情 20~50 的特殊 BGM
```

## BGM 配置（`index.html` 内联 JSON）

```json
"bgm": {
  "default":  { "file": "./audio/Music.mp3",         "volume": 0.4 },
  "special":  { "file": "./audio/Music_special.mp3", "volume": 0.4 },
  "duckVolume": 0.06,
  "specialMin": 20,
  "specialMax": 50
}
```

- BGM 循环、首个用户手势（点击/触摸）后自动启动（浏览器 autoplay 策略）
- 好感度 ∈ [specialMin, specialMax] 自动切到 special，否则切回 default
- 讲话/动画猫叫时音量降到 duckVolume，结束后 240ms 淡入恢复

## 动画配置

```json
"animations": {
  "frameIntervalMs": 500,
  "touchProbabilities": { "text": 0.8, "lick": 0.1, "stretch": 0.1 },
  "sprites": {
    "lick":    { "midFrame": "./images/lick_mid.png",    "actionFrame": "./images/lick_action.png" },
    "stretch": { "midFrame": "./images/stretch_mid.png", "actionFrame": "./images/stretch_action.png" },
    "fish":    { "midFrame": "./images/fish_mid.png",    "actionFrame": "./images/fish_action.png" }
  }
}
```

帧序（所有动画通用）：
```
Cat.png (500ms) → mid (500ms) → action (500ms) → mid (500ms) → Cat.png
                                                         ↑
                                                    触发随机猫叫
                                                    （带 BGM ducking）
```

**扩展新动画**：在 `animations.sprites` 加一条 `{ midFrame, actionFrame }`，然后在代码中 `GAME.Cat.playAnimation('yourKey')` 即可。  
**为其他食物添加进食动画**：在 sprites 里加 `catnip`/`catstrip` 等 key，然后在 `main.js.handleFeed` 里判断 `food.id` 对应调用。

## 控制台调试

```js
// 立刻播放某个动画
window.GAME.Cat.playAnimation('lick')

// 查看当前 BGM 轨道
window.GAME.Audio.currentBgm  // 'default' | 'special' | null

// 手动强制切换 BGM 段
window.GAME.State.setAffinity(30); window.GAME.Audio.updateBgmByMood(30)

// 显示 4 个点击判定框
window.GAME.DEBUG_HITAREAS = true; window.GAME.redraw()
```

## 你可选择补齐的资源

- 真正的 `Music.mp3` —— 当前是 Music_special 的同源副本（功能上 OK，但听不到两个音轨差异）
- 为 `奶茶 / 猫条 / 猫薄荷 / 柠檬片` 新增进食动画：补 12 张图片 + 在 JSON 添加条目 + `handleFeed` 里扩展 switch

## 特性清单

- ✅ 全程 BGM 循环 + 讲话时 ducking + 好感度段自动切轨
- ✅ 3 组反应动画严格按 5 阶段节奏播放，结束自动回到 Cat.png
- ✅ 动作锁防冲突，动画中再次点击/投喂会被静默忽略或 Toast 提示
- ✅ 初始化预加载全部 10 张图片
- ✅ 动画播放期间文字对话框不受影响
- ✅ 三按钮像素风 SVG 图标替代 emoji
- ✅ 所有 V1.0/V1.1 特性保留（点击判定/对话语料/冷却/折扣/购买确认/好感度/存档）
- ✅ 纯离线（LLM 可选），无任何外部 CDN
