import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取 __dirname (ES模块中不直接提供)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3031;

// 启用 CORS 和 JSON 解析
app.use(cors());
app.use(express.json({ limit: '1mb' }));

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
    
    // 获取情思数据文件的绝对路径
    // 这里假设 server.js 在项目根目录，与 src 目录同级
    const filePath = path.join(__dirname, 'src', 'data', 'encrypted-feelings.json');
    
    // 将数据格式化为 JSON 字符串
    const jsonData = JSON.stringify(feelings, null, 2);
    
    // 写入文件
    fs.writeFileSync(filePath, jsonData, 'utf8');
    
    console.log(`情思数据已成功保存到: ${filePath}`);
    
    return res.status(200).json({
      success: true,
      message: '情思数据已成功保存',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('保存情思数据时出错:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，无法保存情思数据',
      error: error.message
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\x1b[38;2;0;191;255m██████╗ ██╗  ██╗██╗███╗   ██╗ ██████╗ \n██╔══██╗██║ ██╔╝██║████╗  ██║██╔════╝ \n██████╔╝█████╔╝ ██║██╔██╗ ██║██║  ███╗\n██╔══██╗██╔═██╗ ██║██║╚██╗██║██║   ██║\n██████╔╝██║  ██╗██║██║ ╚████║╚██████╔╝\n╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝\x1b[0m'); 
  console.log(`\x1b[36m情思同步服务器正在运行，端口: ${PORT}\x1b[0m`);
  console.log(`\x1b[36mAPI 可通过 http://localhost:${PORT}/api/save-feelings 访问\x1b[0m`);
}); 