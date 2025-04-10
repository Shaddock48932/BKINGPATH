# 单词快速扫盲 🎯

小领域单词快速扫盲/暴力印象/背单词

## 🔧 环境准备

- **Node.js**: v14.0.0+
- **npm**: v6.0.0+
- **浏览器**: Chrome、Firefox、Edge 最新版
- **网络连接**: 语音功能需要网络连接

## ⚡ 快速开始

```bash
# 一键启动（推荐）
npm install
npm run start

# 或分步启动
npm install 
npm run dev     # 启动Vue应用
npm run feelings  # 另开终端，启动情思服务
```

访问终端显示的链接，右上角💟图标可使用情思功能。

## 🎯 功能

- 🌐 单词语音播放
- 📚 自定义词库导入
- 🎵 背景音乐播放
- ⌨️ 快捷键操作
- 💟 情思记录功能
- 🔒 内容加密存储
- ✍️ 单词拼写练习
- 🛍️ 虚拟商城系统
- 📝 可重复任务管理

## ⌨️ 快捷键

| 功能 | 快捷键 |
|------|--------|
| 切换单词 | `Enter` |
| 显示/隐藏翻译 | 双击 `Shift` |
| 播放语音 | 双击 `Ctrl` |

## 📁 项目结构

```
src/
├── main.js                 # 入口文件
├── App.vue                 # 根组件
├── components/             # 组件目录
├── views/                  # 视图组件
├── assets/                 # 静态资源
├── data/                   # 数据文件
└── style.css               # 全局样式

根目录:
├── server-feelings.js      # 情思服务器
├── feelings-sync-guide.md  # 情思服务指南
├── package.json            # 依赖配置
└── index.html              # HTML入口
```

## 🔧 自定义配置

### 添加词库
1. JSON文件放入`src/data/`
2. 在`App.vue`的`wordLists`添加路径

### 添加音乐
1. 音乐文件放入`src/assets/music`
2. 在`MusicPlayer.vue`的`musicList`添加

### 自定义商品
1. 修改`ShoppingMall.vue`中的`defaultProducts`
2. 或通过管理员界面添加
3. 或通过API提供数据

## 🔁 任务系统

- 支持常规和重复任务
- 执行按钮和计数统计
- 完成时间跟踪
- 本地存储任务状态

## 🔊 语音功能

- 有道词典API优先
- Web Speech API备用
- 异常自动处理

## 💰 商城系统

- 学习获取金币
- 购买道具主题
- 查看历史记录
- 本地数据存储

## 🛠️ 技术栈

- Vue 3
- Vite
- Web Speech API
- 有道词典API
- Express
