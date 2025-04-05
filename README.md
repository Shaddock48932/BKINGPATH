# 单词快速扫盲 🎯

小领域单词快速扫盲/暴力印象/背单词

## 🔧 环境准备

- **Node.js**: v14.0.0 或更高版本
- **npm**: v6.0.0 或更高版本
- **浏览器**: 推荐使用 Chrome、Firefox 或 Edge 最新版本
- **网络连接**: 语音功能需要网络连接才能正常使用


## ⚡ 快速开始

### 方法一：一键启动（推荐）

```bash
# 安装所有依赖
npm install

# 安装一键启动工具
npm install -D concurrently

# 然后使用以下命令一键启动所有服务
npm run start
```

### 方法二：分步启动

```bash
# 安装项目依赖
npm install 

# 安装情思服务器依赖
npm install express cors

# 第一步：启动Vue应用
npm run dev
# 此时可在浏览器中访问终端显示的链接(通常是http://localhost:5173/)

# 第二步：另开终端窗口，启动情思同步服务
node server-feelings.js
```

在浏览器访问应用后，点击右上角 💟 图标使用情思功能。详细指南请参考 `feelings-sync-guide.md`。

## 🎯 功能

- 🌐 联网状态下支持所有单词的语音播放
- 📚 支持自定义词库导入
- 🎵 支持背景音乐播放
- ⌨️ 便捷的快捷键操作
- 💟 情思功能，记录学习心情和感悟
- 🔒 情思内容加密存储，保护隐私
- ✍️ 单词练习功能，可在输入框中键入单词进行拼写练习

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
│   ├── WordCard.vue        # 单词卡片组件
│   ├── MusicPlayer.vue     # 音乐播放器组件
│   ├── NoteBook.vue        # 情思记录组件
│   └── BackgroundUploader.vue  # 背景上传组件
│
├── assets/               
│   ├── music/             # 音乐文件
│   ├── icon.png          # 应用图标
│   └── initialbgc.png    # 初始背景图片
│
├── data/                 # 词库和情思数据
│   ├── cs.json           # 计算机专业词汇
│   ├── web.json          # 前端相关词汇
│   ├── javause.json      # Java 相关词汇
│   ├── data_structure.json  # 数据结构词汇
│   ├── dailyuse.json     # 日常易错词汇
│   └── encrypted-feelings.json # 加密存储的情思数据
│
├── utils/                # 工具函数
│   ├── encryption.js     # 加密解密工具
│   ├── feelingsEncryption.js # 情思专用加密工具
│   ├── restore-feelings.js   # 情思数据恢复工具
│   └── errorNotification.js  # 错误通知工具
│
└── style.css            # 全局样式文件

根目录:
├── server.js            # 服务器文件
├── server-feelings.js   # 情思同步服务器
├── feelings-sync-guide.md # 情思服务使用指南
├── package.json         # 项目依赖配置
├── server-package.json  # 服务器依赖配置
├── vite.config.js       # Vite 配置文件
└── index.html           # HTML 入口文件
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

### 情思同步服务配置

如需更改情思同步服务的端口或其他设置，请编辑 `server-feelings.js` 文件。详细配置说明请参考 `feelings-sync-guide.md`。


## 🔊 语音功能

- 优先使用有道词典 API 进行语音播放
- 支持 Web Speech API 作为备用发音方案
- 自动处理网络异常情况

## 🛠️ 技术栈

- Vue 3
- Vite
- Web Speech API
- 有道词典 API
- Express (情思同步服务)
