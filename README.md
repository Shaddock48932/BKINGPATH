# 单词快速扫盲 🎯

一个简单高效的单词学习应用，支持自定义词库、背景音乐和快捷键操作。

## ⚡ 快速开始

```bash
# 进入项目目录
cd bKingPath

# 安装依赖
npm install

# 启动项目
npm run dev
```

## 🎯 功能

- 🌐 联网状态下支持所有单词的语音播放
- 📚 支持自定义词库导入
- 🎵 支持背景音乐播放
- ⌨️ 便捷的快捷键操作

## ⌨️ 快捷键

| 功能 | 快捷键 |
|------|--------|
| 切换单词 | `Enter` |
| 显示/隐藏翻译 | 双击 `Shift` |
| 播放语音 | 双击 `Ctrl` |

## 📁 项目结构

```
src/
├── main.js                 # 应用程序入口文件
├── App.vue                 # 根组件
│   ├── 单词列表管理
│   ├── 用户输入处理
│   └── 布局和响应式设计
│
├── components/            
│   ├── WordCard.vue       # 单词卡片组件
│   ├── MusicPlayer.vue    # 音乐播放器组件
│   └── BackgroundUploader.vue  # 背景上传组件
│
├── assets/               
│   ├── music/           # 音乐文件
│   └── images/          # 图片资源
│
├── data/                # 词库文件
│   ├── cs.json         # 计算机专业词汇
│   ├── web.json        # 前端相关词汇
│   ├── javause.json    # Java 相关词汇
│   ├── data_structure.json  # 数据结构词汇
│   └── dailyuse.json   # 日常易错词汇
│
└── style.css           # 全局样式文件
```

## 🔧 自定义配置

### 添加新词库

1. 将 JSON 文件放在 `src/data/` 目录下
2. 在 `App.vue` 的 `wordLists` 中添加路径
3. JSON 格式参考 `src/data` 目录下的现有文件

### 添加背景音乐

1. 将音乐文件放在 `src/assets/music` 目录下
2. 在 `src/components/MusicPlayer.vue` 的 `musicList` 中添加路径
3. 在 `MusicPlayer.vue` 的开头导入音乐文件

## 📱 响应式设计

- 支持移动端和桌面端自适应布局
- 针对不同屏幕尺寸优化显示效果

## 🔊 语音功能

- 优先使用有道词典 API 进行语音播放
- 支持 Web Speech API 作为备用发音方案
- 自动处理网络异常情况

## 🛠️ 技术栈

- Vue 3
- Vite
- Web Speech API
- 有道词典 API
