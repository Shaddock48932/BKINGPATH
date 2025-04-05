import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取 __dirname (ES模块中不直接提供)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保数据目录存在
const dataDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`数据目录已创建: ${dataDir}`);
}

const app = express();
const PORT = 3031;

// 启用 CORS 和 JSON 解析
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 通用响应处理函数
const handleResponse = (res, data, message, success = true, status = 200) => {
  return res.status(status).json({
    success,
    data,
    message
  });
};

// 通用错误处理函数
const handleError = (res, error, message) => {
  console.error(`${message}:`, error);
  return res.status(500).json({
    success: false,
    message,
    error: error.message
  });
};

// API 路由：保存情思数据
app.post('/api/save-feelings', (req, res) => {
  try {
    const { feelings } = req.body;
    
    if (!feelings || !Array.isArray(feelings)) {
      return res.status(400).json({
        success: false,
        message: '无效的情思数据格式'
      });
    }
    
    const filePath = path.join(dataDir, 'encrypted-feelings.json');
    const jsonData = JSON.stringify(feelings, null, 2);
    
    fs.writeFileSync(filePath, jsonData, 'utf8');
    console.log(`情思数据已成功保存`);
    
    return handleResponse(res, null, '情思数据已成功保存');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法保存情思数据');
  }
});

// API 路由：获取情思数据
app.get('/api/get-feelings', (req, res) => {
  try {
    const filePath = path.join(dataDir, 'encrypted-feelings.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(200).json([]);
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const feelings = JSON.parse(fileData);
    
    return res.status(200).json(feelings);
  } catch (error) {
    return handleError(res, error, '服务器错误，无法获取情思数据');
  }
});

// API 路由：保存金币数据
app.post('/api/save-coins', (req, res) => {
  try {
    const { coins } = req.body;
    
    if (coins === undefined || typeof coins !== 'number') {
      return res.status(400).json({
        success: false,
        message: '无效的金币数据格式'
      });
    }
    
    const filePath = path.join(dataDir, 'user-coins.json');
    const coinData = {
      coins: coins,
      lastUpdated: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(coinData, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');
    
    console.log(`金币数据已成功保存`);
    return handleResponse(res, null, '金币数据已成功保存');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法保存金币数据');
  }
});

// API 路由：获取金币数据
app.get('/api/get-coins', (req, res) => {
  try {
    const filePath = path.join(dataDir, 'user-coins.json');
    
    if (!fs.existsSync(filePath)) {
      return handleResponse(res, { coins: 0 }, '金币数据文件不存在，返回默认值');
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const coinData = JSON.parse(fileData);
    
    return handleResponse(res, coinData, '金币数据已成功获取');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法获取金币数据');
  }
});

// API 路由：保存待办事项数据
app.post('/api/save-todos', (req, res) => {
  try {
    const { todos } = req.body;
    
    if (!todos || !Array.isArray(todos)) {
      return res.status(400).json({
        success: false,
        message: '无效的待办事项数据格式'
      });
    }
    
    const filePath = path.join(dataDir, 'user-todos.json');
    const todoData = {
      todos: todos,
      lastUpdated: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(todoData, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');
    
    console.log(`待办事项数据已成功保存，共 ${todos.length} 项`);
    return handleResponse(res, null, '待办事项数据已成功保存');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法保存待办事项数据');
  }
});

// API 路由：获取待办事项数据
app.get('/api/get-todos', (req, res) => {
  try {
    const filePath = path.join(dataDir, 'user-todos.json');
    
    if (!fs.existsSync(filePath)) {
      return handleResponse(res, { todos: [] }, '待办事项数据文件不存在，返回空列表');
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const todoData = JSON.parse(fileData);
    
    return handleResponse(res, todoData, '待办事项数据已成功获取');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法获取待办事项数据');
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\x1b[36m情思同步服务器正在运行，端口:', PORT, '\x1b[0m');
  console.log('\x1b[35m可用的API端点:\x1b[0m');
  console.log('\x1b[35m- POST /api/save-feelings - 保存情思数据\x1b[0m');
  console.log('\x1b[35m- GET /api/get-feelings - 获取情思数据\x1b[0m');
  console.log('\x1b[35m- POST /api/save-coins - 保存金币数据\x1b[0m');
  console.log('\x1b[35m- GET /api/get-coins - 获取金币数据\x1b[0m');
  console.log('\x1b[35m- POST /api/save-todos - 保存待办事项数据\x1b[0m');
  console.log('\x1b[35m- GET /api/get-todos - 获取待办事项数据\x1b[0m');
}); 