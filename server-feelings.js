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

// API 路由：保存阅读书签
app.post('/api/save-bookmark', (req, res) => {
  try {
    const { bookId, page, title, timestamp } = req.body;
    
    if (!bookId || page === undefined) {
      return res.status(400).json({
        success: false,
        message: '无效的书签数据，必须包含bookId和page'
      });
    }
    
    const filePath = path.join(dataDir, 'reading-bookmarks.json');
    let bookmarks = [];
    
    // 读取现有书签
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      bookmarks = JSON.parse(fileData);
    }
    
    // 更新特定书籍的书签
    const existingIndex = bookmarks.findIndex(b => b.bookId === bookId);
    const newBookmark = {
      bookId,
      page: parseInt(page),
      title: title || `未命名书签 ${page}`,
      lastRead: timestamp || new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      bookmarks[existingIndex] = newBookmark;
    } else {
      bookmarks.push(newBookmark);
    }
    
    const jsonData = JSON.stringify(bookmarks, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');
    
    console.log(`书签已保存: ${title || bookId} - 第${page}页`);
    return handleResponse(res, newBookmark, '书签已成功保存');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法保存书签');
  }
});

// API 路由：获取阅读书签
app.get('/api/get-bookmark/:bookId', (req, res) => {
  try {
    const { bookId } = req.params;
    const filePath = path.join(dataDir, 'reading-bookmarks.json');
    
    if (!fs.existsSync(filePath)) {
      return handleResponse(res, null, '书签文件不存在，没有书签信息');
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const bookmarks = JSON.parse(fileData);
    
    // 查找特定书籍的书签
    const bookmark = bookmarks.find(b => b.bookId === bookId);
    
    if (!bookmark) {
      return handleResponse(res, null, `未找到书籍ID为 ${bookId} 的书签`);
    }
    
    return handleResponse(res, bookmark, '成功获取书签信息');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法获取书签信息');
  }
});

// API 路由：获取所有书签
app.get('/api/get-all-bookmarks', (req, res) => {
  try {
    const filePath = path.join(dataDir, 'reading-bookmarks.json');
    
    if (!fs.existsSync(filePath)) {
      return handleResponse(res, [], '书签文件不存在，返回空列表');
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const bookmarks = JSON.parse(fileData);
    
    return handleResponse(res, bookmarks, '成功获取所有书签');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法获取书签列表');
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
  console.log('\x1b[35m- POST /api/save-bookmark - 保存阅读书签\x1b[0m');
  console.log('\x1b[35m- GET /api/get-bookmark/:bookId - 获取特定书籍书签\x1b[0m');
  console.log('\x1b[35m- GET /api/get-all-bookmarks - 获取所有书签\x1b[0m');
}); 