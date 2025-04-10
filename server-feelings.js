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

// 初始化默认商品数据
const initDefaultProducts = () => {
  const productsFilePath = path.join(dataDir, 'products.json');
  
  // 如果商品文件不存在，创建默认商品数据
  if (!fs.existsSync(productsFilePath)) {
    const defaultProducts = [
      { id: 1, name: "amuse SUNDAY", description: "星期天", price: 4490 },
    ];
    
    fs.writeFileSync(
      productsFilePath, 
      JSON.stringify(defaultProducts, null, 2), 
      'utf8'
    );
    
    console.log('创建了默认商品数据');
  }
};

// 启动时初始化默认商品
initDefaultProducts();

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

// API 路由：获取商品列表
app.get('/api/get-products', (req, res) => {
  try {
    const filePath = path.join(dataDir, 'products.json');
    
    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，返回空数组
      return handleResponse(res, [], '商品数据文件不存在，返回空列表');
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const products = JSON.parse(fileData);
    
    return handleResponse(res, products, '成功获取商品列表');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法获取商品列表');
  }
});

// API 路由：添加新商品
app.post('/api/add-product', (req, res) => {
  try {
    const { id, name, description, price } = req.body;
    
    // 验证必要字段
    if (!name || !description || price === undefined || price <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的商品数据，必须包含name、description和price'
      });
    }
    
    const filePath = path.join(dataDir, 'products.json');
    let products = [];
    
    // 读取现有商品
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      products = JSON.parse(fileData);
    }
    
    // 创建新商品
    const newProduct = {
      id: id || Date.now(),
      name,
      description,
      price: Number(price),
      createdAt: new Date().toISOString()
    };
    
    // 添加到商品列表
    products.push(newProduct);
    
    // 保存更新后的商品列表
    const jsonData = JSON.stringify(products, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');
    
    console.log(`新商品已添加: ${name} - ¥${price}`);
    return handleResponse(res, newProduct, '商品已成功添加');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法添加商品');
  }
});

// API 路由：购买商品
app.post('/api/purchase-product', (req, res) => {
  try {
    const { productId, price } = req.body;
    
    if (!productId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: '无效的购买数据，必须包含productId和price'
      });
    }
    
    // 获取商品数据
    const productsFilePath = path.join(dataDir, 'products.json');
    if (!fs.existsSync(productsFilePath)) {
      return res.status(404).json({
        success: false,
        message: '商品数据不存在'
      });
    }
    
    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    const products = JSON.parse(productsData);
    
    // 检查商品是否存在
    const product = products.find(p => p.id == productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为${productId}的商品`
      });
    }
    
    // 检查金币是否足够
    const coinsFilePath = path.join(dataDir, 'user-coins.json');
    let userCoins = { coins: 0 };
    
    if (fs.existsSync(coinsFilePath)) {
      const coinsData = fs.readFileSync(coinsFilePath, 'utf8');
      userCoins = JSON.parse(coinsData);
    }
    
    if (userCoins.coins < price) {
      return res.status(400).json({
        success: false,
        message: '金币不足，无法购买'
      });
    }
    
    // 扣除金币
    userCoins.coins -= price;
    userCoins.lastUpdated = new Date().toISOString();
    
    // 保存更新后的金币数据
    fs.writeFileSync(coinsFilePath, JSON.stringify(userCoins, null, 2), 'utf8');
    
    // 记录购买记录
    const purchasesFilePath = path.join(dataDir, 'purchases.json');
    let purchases = [];
    
    if (fs.existsSync(purchasesFilePath)) {
      const purchasesData = fs.readFileSync(purchasesFilePath, 'utf8');
      purchases = JSON.parse(purchasesData);
    }
    
    const purchase = {
      id: Date.now(),
      productId,
      productName: product.name,
      price,
      timestamp: new Date().toISOString()
    };
    
    purchases.push(purchase);
    fs.writeFileSync(purchasesFilePath, JSON.stringify(purchases, null, 2), 'utf8');
    
    console.log(`商品已购买: ${product.name} - 金币:${price}`);
    return handleResponse(res, { purchase, remainingCoins: userCoins.coins }, '购买成功');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法完成购买');
  }
});

// API 路由：获取购买历史
app.get('/api/get-purchases', (req, res) => {
  try {
    const filePath = path.join(dataDir, 'purchases.json');
    
    if (!fs.existsSync(filePath)) {
      return handleResponse(res, [], '购买历史文件不存在，返回空列表');
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const purchases = JSON.parse(fileData);
    
    return handleResponse(res, purchases, '成功获取购买历史');
  } catch (error) {
    return handleError(res, error, '服务器错误，无法获取购买历史');
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
  console.log('\x1b[35m- GET /api/get-products - 获取商品列表\x1b[0m');
  console.log('\x1b[35m- POST /api/add-product - 添加新商品\x1b[0m');
  console.log('\x1b[35m- POST /api/purchase-product - 购买商品\x1b[0m');
  console.log('\x1b[35m- GET /api/get-purchases - 获取购买历史\x1b[0m');
}); 