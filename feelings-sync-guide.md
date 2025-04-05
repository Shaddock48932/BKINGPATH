# 情思功能使用指南

## 前置准备

```bash
# 安装所需依赖
npm install
npm install express cors
npm install -D concurrently
```

## 启动方法

### 一键启动（推荐）
```bash
npm run start
```

### 分步启动
```bash
# 终端1：启动Vue应用
npm run dev

# 终端2：启动情思服务
node server-feelings.js
```

## 使用情思功能

1. 点击应用右上角 💟 图标打开情思面板
2. 在底部输入框中输入ID和情思内容，按Enter提交
3. 面板右上角会显示同步状态（正在同步/同步成功/同步失败）
4. 数据自动保存到 `src/data/encrypted-feelings.json`

## 工作原理

- 前端加密数据后发送到本地服务器
- 服务器将加密数据写入JSON文件
- 同时备份到浏览器localStorage
- 数据通过自定义算法加密，保证隐私安全

## 常见问题

### 端口冲突
修改 `server-feelings.js` 中的PORT变量和 `NoteBook.vue` 中的API地址

### 无法连接服务器
- 确认服务器运行状态
- 检查端口号是否匹配
- 确认防火墙设置

### 文件写入失败
- 确保有 `src/data` 目录的写入权限
- 检查文件是否被其他程序锁定

## 高级配置

### 自定义端口
1. 修改 `server-feelings.js` 中的PORT常量
2. 更新 `src/components/NoteBook.vue` 中的API URL

### 设置自动启动
在 `package.json` 中添加：
```json
"scripts": {
  "start": "concurrently \"vite\" \"node server-feelings.js\""
}
``` 