<template>
  <div class="reader-page">
    <!-- 顶部标题和导航栏 -->
    <div class="reader-header">
      <div class="header-left">
        <div class="book-selector">
          <button class="book-menu-btn" title="选择书籍">
            <span class="book-menu-icon">📚</span>
          </button>
          <div class="book-dropdown">
            <div class="book-list">
              <div 
                v-for="book in availableBooks" 
                :key="book.id" 
                class="book-item"
                @click="loadSelectedBook(book)"
              >
                <span class="book-title">{{ book.title }}</span>
              </div>
            </div>
          </div>
        </div>
        <h1 class="app-title">{{ currentBook?.title || 'PDF阅读器' }}</h1>
        <span class="reading-progress">第 {{ displayStartPage }} - {{ displayEndPage }} / {{ totalPages }} 页</span>
      </div>
      
      <div class="header-right">
        <div class="page-navigation">
          <button 
            class="nav-btn" 
            @click="prevPage" 
            :disabled="currentPage <= 1"
            title="上一页"
          >
            <span class="nav-icon">◀</span>
          </button>
          
          <div class="page-input-container">
            <input 
              type="number" 
              v-model.number="pageInput" 
              min="1" 
              :max="totalPages" 
              @change="goToPage(pageInput)"
              class="page-input"
            />
            <span class="page-divider">/</span>
            <span class="page-total">{{ totalPages }}</span>
          </div>
          
          <button 
            class="nav-btn" 
            @click="nextPage" 
            :disabled="currentPage >= totalPages"
            title="下一页"
          >
            <span class="nav-icon">▶</span>
          </button>
        </div>
        
        <!-- 书签按钮 -->
        <button class="bookmark-btn" @click="saveBookmark" title="保存书签">
          <span class="bookmark-icon">🔖</span>
          保存书签
        </button>
      </div>
    </div>
    
    <div class="reader-container">
      <!-- 阅读内容 - 占据主要空间 -->
      <div class="content-panel">
        <div class="text-container" ref="pdfContainerRef">
          <div class="loading-container" v-if="isLoading">
            <div class="loading-spinner"></div>
            <div class="loading-text">正在加载... {{ loadingProgress }}%</div>
          </div>
          
          <div class="error-container" v-if="errorMessage">
            <div class="error-icon">⚠️</div>
            <div class="error-text">{{ errorMessage }}</div>
          </div>
          
          <div class="reader-content" v-if="!isLoading && !errorMessage">
            <div class="pages-container dual-page">
              <div class="page-wrapper">
                <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
              </div>
              <div class="page-wrapper">
                <canvas ref="secondPageCanvas" class="pdf-canvas"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快捷键提示 -->
    <div class="shortcut-tip">
      <div class="key-hint">←</div> <div class="key-hint">→</div> 翻页 
      <div class="key-hint">+</div> <div class="key-hint">-</div> 缩放
      <div class="key-hint">B</div> 保存书签
      <div class="key-hint">Enter</div> 下一页
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, inject } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
import { useRoute } from 'vue-router';

// 注入 alert 服务
const alert = inject('alert');

// 服务器API基本URL
const API_BASE_URL = 'http://localhost:3031/api';

// 获取当前路由
const route = useRoute();

// 可用书籍列表
const availableBooks = ref([
  {
    id: 'physics-god',
    title: '上帝掷骰子吗',
    pdfUrl: '/src/assets/book/上帝掷骰子吗.pdf'
  },
  {
    id: 'grave-robbers',
    title: '盗墓笔记',
    pdfUrl: '/src/assets/book/盗墓笔记.pdf'
  },

]);

// 阅读器状态
const currentPage = ref(1);
const totalPages = ref(1);
const pageInput = ref(1);
const isLoading = ref(false);
const errorMessage = ref('');
const pdfContainerRef = ref(null);
const pdfCanvas = ref(null);
const secondPageCanvas = ref(null);
const currentBook = ref({
  id: 'physics-god',
  title: '上帝掷骰子吗',
  pdfUrl: '/src/assets/book/上帝掷骰子吗.pdf'
});
let pdfDocument = null;
const pdfScale = ref(1.0);
const loadingProgress = ref(0);

// 加载选中的书籍
const loadSelectedBook = async (book) => {
  if (book.id === currentBook.value.id) return;
  
  // 清理当前PDF
  if (pdfDocument) {
    try {
      pdfDocument.destroy();
      pdfDocument = null;
    } catch (error) {
      console.warn('销毁PDF文档时出错，忽略:', error);
    }
  }
  
  // 更新当前书籍
  currentBook.value = book;
  
  // 重置页面状态
  currentPage.value = 1;
  pageInput.value = 1;
  totalPages.value = 1;
  
  // 加载新的PDF
  await loadPdf(book.pdfUrl);
};

// 计算属性：显示的起始页和结束页
const displayStartPage = computed(() => currentPage.value);
const displayEndPage = computed(() => {
  return Math.min(currentPage.value + 1, totalPages.value);
});

// 监听页面改变
watch(currentPage, () => {
  renderCurrentPages();
});

// 渲染当前显示的页面
const renderCurrentPages = async () => {
  if (!pdfDocument) return;
  
  // 渲染当前页
  await renderPage(currentPage.value, pdfCanvas.value);
  
  // 渲染第二页
  if (currentPage.value < totalPages.value) {
    await renderPage(currentPage.value + 1, secondPageCanvas.value);
  }
};

// 加载PDF
const loadPdf = async (url) => {
  try {
    errorMessage.value = '';
    isLoading.value = true;
    loadingProgress.value = 0;
    console.log('尝试加载PDF:', url);
    
    // 尝试多种路径格式
    let loadingTask;
    try {
      // 首先尝试原始路径
      loadingTask = pdfjsLib.getDocument({
        url: url,
        cMapUrl: 'node_modules/pdfjs-dist/cmaps/',
        cMapPacked: true
      });
    } catch (e) {
      console.warn('首次加载尝试失败，尝试其他路径格式...');
      // 如果失败，尝试添加前缀
      const alternativePath = url.startsWith('/') ? url : `/${url}`;
      loadingTask = pdfjsLib.getDocument({
        url: alternativePath,
        cMapUrl: 'node_modules/pdfjs-dist/cmaps/',
        cMapPacked: true
      });
    }
    
    // 设置加载进度回调
    loadingTask.onProgress = (data) => {
      if (data.total) {
        loadingProgress.value = Math.round((data.loaded / data.total) * 100);
      }
    };
    
    // 直接将结果赋值给非响应式变量
    pdfDocument = await loadingTask.promise;
    
    // 设置页面数量
    totalPages.value = pdfDocument.numPages;
    currentPage.value = 1;
    pageInput.value = 1;
    
    // 预先渲染第一页，确保PDF显示
    renderCurrentPages();
    
    // 尝试加载书签，但不阻塞PDF加载
    loadBookmark().catch(err => {
      console.warn('加载书签时出错，但PDF已正常加载:', err);
    });
    
  } catch (error) {
    console.error('PDF加载失败:', error);
    
    let errorMsg = '无法加载PDF文件';
    if (error.name === 'InvalidPDFException') {
      errorMsg = `PDF文件结构无效，请确保文件未损坏。尝试路径: ${url}`;
      console.error('加载失败的路径:', url);
    } else if (error.name === 'MissingPDFException') {
      errorMsg = `找不到PDF文件，请检查路径是否正确: ${url}`;
      console.error('未找到的路径:', url);
    } else if (error.name === 'UnexpectedResponseException') {
      errorMsg = '服务器返回意外响应，可能是跨域限制';
    } else {
      errorMsg = `加载PDF错误: ${error.message || '未知错误'}`;
    }
    
    errorMessage.value = errorMsg;
  } finally {
    isLoading.value = false;
  }
};

// 渲染PDF页面
const renderPage = async (pageNumber, canvasElement) => {
  // 确保PDF文档已加载且canvas元素存在
  if (!pdfDocument || !canvasElement) return;
  
  try {
    // 获取页面
    let page;
    try {
      page = await pdfDocument.getPage(pageNumber);
    } catch (pageError) {
      console.error('获取页面失败:', pageError);
      errorMessage.value = `无法获取第${pageNumber}页`;
      return;
    }
    
    const context = canvasElement.getContext('2d');
    
    // 设置视口
    const viewport = page.getViewport({scale: pdfScale.value});
    
    // 重要：确保canvas尺寸重置，防止累积增大
    canvasElement.style.width = '';
    canvasElement.style.height = '';
    canvasElement.height = viewport.height;
    canvasElement.width = viewport.width;
    
    // 清除现有内容
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // 准备渲染上下文
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    try {
      // 执行渲染
      const renderTask = page.render(renderContext);
      await renderTask.promise;
      console.log(`页面${pageNumber}渲染成功`);
    } catch (renderError) {
      console.error('渲染失败:', renderError);
      
      // 绘制错误提示
      context.fillStyle = '#f5f5f5';
      context.fillRect(0, 0, canvasElement.width, canvasElement.height);
      context.fillStyle = '#5d4037';
      context.font = '16px sans-serif';
      context.textAlign = 'center';
      context.fillText(`第 ${pageNumber} 页渲染失败`, canvasElement.width/2, 50);
      
      return;
    }
  } catch (error) {
    console.error('页面处理失败:', error);
    errorMessage.value = `无法显示页面: ${error.message || '未知错误'}`;
  }
};

// 键盘快捷键处理
const handleKeyDown = (event) => {
  // 确保只在PDF阅读器页面处理键盘事件
  if (route.path !== '/reader') {
    return;
  }
  
  // 阻止事件冒泡，避免触发App.vue中的全局事件监听
  event.stopPropagation();
  
  // 如果用户正在输入框内，不处理快捷键
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    // 但如果是页码输入框，仍处理Enter键
    if (event.key === 'Enter' && event.target.classList.contains('page-input')) {
      event.preventDefault();
      goToPage(pageInput.value);
      return;
    }
    return;
  }
  
  // 控制按键
  switch (event.key) {
    case 'ArrowLeft':
      prevPage();
      break;
    case 'ArrowRight':
      nextPage();
      break;
    case 'Enter':
      // Enter键翻到下一页，但不绑定音效
      event.preventDefault(); // 阻止默认行为
      nextPage();
      break;
    case '+':
      zoomIn();
      break;
    case '-':
      zoomOut();
      break;
    case 'b':
    case 'B':
      saveBookmark();
      break;
  }
};

// 翻页功能
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    // 一次前进两页
    const increment = 2;
    currentPage.value = Math.min(currentPage.value + increment, totalPages.value);
    pageInput.value = currentPage.value;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    // 一次后退两页
    const decrement = 2;
    currentPage.value = Math.max(currentPage.value - decrement, 1);
    pageInput.value = currentPage.value;
  }
};

const goToPage = (pageNum) => {
  let targetPage = pageNum;
  
  // 验证页码
  if (isNaN(targetPage) || targetPage < 1) {
    targetPage = 1;
  } else if (targetPage > totalPages.value) {
    targetPage = totalPages.value;
  }
  
  // 确保是偶数页（双页模式的第一页应该是奇数）
  if (targetPage % 2 === 0 && targetPage > 1) {
    targetPage = targetPage - 1;
  }
  
  if (currentPage.value !== targetPage) {
    currentPage.value = targetPage;
    pageInput.value = targetPage;
    renderCurrentPages();
  }
};

// 窗口大小调整处理
const handleWindowResize = () => {
  if (pdfDocument) {
    renderCurrentPages();
  }
};

// 缩放功能
const zoomIn = () => {
  pdfScale.value = Math.min(pdfScale.value + 0.1, 3.0);
  if (pdfDocument) {
    renderCurrentPages();
  }
};

const zoomOut = () => {
  pdfScale.value = Math.max(pdfScale.value - 0.1, 0.5);
  if (pdfDocument) {
    renderCurrentPages();
  }
};

// 从服务器或本地存储加载书签，不再使用await等待API响应
const loadBookmark = async () => {
  try {
    // 先尝试从localStorage加载，确保快速响应
    const savedBookmark = localStorage.getItem(`bookmark-${currentBook.value.id}`);
    
    if (savedBookmark) {
      const bookmark = JSON.parse(savedBookmark);
      console.log('已从本地存储找到书签:', bookmark);
      
      // 加载书签页面
      goToPage(bookmark.page);
      return true;
    }
    
    // 然后尝试从API加载，但设置较短的超时时间
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时
      
      const response = await axios.get(`${API_BASE_URL}/get-bookmark/${currentBook.value.id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data && response.data.success && response.data.data) {
        const bookmark = response.data.data;
        console.log('已从服务器找到书签:', bookmark);
        
        // 保存到本地存储以便下次快速加载
        localStorage.setItem(`bookmark-${currentBook.value.id}`, JSON.stringify(bookmark));
        
        // 加载书签页面
        goToPage(bookmark.page);
        return true;
      }
    } catch (apiError) {
      console.warn('从API加载失败，已使用本地存储:', apiError);
    }
  } catch (error) {
    console.error('加载书签出错:', error);
  }
  
  return false;
};

// 获取所有书籍的书签信息
const loadAllBookmarks = async () => {
  try {
    // 设置较短的超时时间，避免长时间等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时
    
    const response = await axios.get(`${API_BASE_URL}/get-all-bookmarks`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('已获取所有书籍的书签:', response.data.data);
      return response.data.data;
    }
  } catch (error) {
    console.error('获取所有书签失败 (非阻塞性错误):', error);
  }
  
  return [];
};

// 保存书签到服务器或本地存储
const saveBookmark = async () => {
  try {
    const bookmarkData = {
      bookId: currentBook.value.id,
      page: currentPage.value,
      title: `${currentBook.value.title} - 第${currentPage.value}页`,
      timestamp: new Date().toISOString()
    };
    
    // 始终保存到本地存储，确保至少有一份数据
    localStorage.setItem(`bookmark-${currentBook.value.id}`, JSON.stringify(bookmarkData));
    console.log('书签已保存到本地存储:', bookmarkData);
    
    try {
      // 设置较短的超时时间
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时
      
      // 尝试使用API保存书签
      const response = await axios.post(`${API_BASE_URL}/save-bookmark`, bookmarkData, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data && response.data.success) {
        console.log('书签已保存到服务器:', response.data);
      }
    } catch (apiError) {
      console.warn('保存到API失败，仅使用本地存储:', apiError);
    }
    
    alert.showSuccess('书签已保存!');
    
  } catch (error) {
    console.error('保存书签出错:', error);
    alert.showError('保存书签时出错');
  }
};

// 组件挂载时初始化
onMounted(async () => {
  try {
    // 设置worker路径
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../../node_modules/pdfjs-dist/build/pdf.worker.mjs';
    
    // 添加事件监听
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleWindowResize);
    
    // 加载默认PDF
    await loadPdf(currentBook.value.pdfUrl);
    
    // 加载所有书籍书签信息 (非阻塞)
    loadAllBookmarks().catch(err => {
      console.warn('加载所有书签时出错 (非阻塞):', err);
    });
    
  } catch (error) {
    console.error('组件初始化失败:', error);
    errorMessage.value = `初始化失败: ${error.message}`;
  }
});

// 组件卸载时清理
onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleWindowResize);
  
  // 安全地清理PDF文档
  if (pdfDocument) {
    try {
      pdfDocument.destroy();
    } catch (error) {
      console.warn('销毁PDF文档时出错，忽略:', error);
    }
    pdfDocument = null;
  }
});
</script>

<style scoped>
/* 简约平涂风格 */
.reader-page {
  display: flex;
  flex-direction: column;
  padding: 15px;
  min-height: 100vh;
  color: #e8e8e8;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  background-color: #1a1a1a;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  width: 80vw;
  opacity: 0.85;
}

.reader-header {
  position: relative;
  z-index: 10;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #262626;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 12px 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 书籍选择器 */
.book-selector {
  position: relative;
  z-index: 20;
}

.book-menu-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333333;
  border: 1px solid #444444;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.book-menu-btn:hover {
  background: #444444;
}

.book-menu-icon {
  font-size: 1.2rem;
}

.book-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 220px;
  max-height: 0;
  overflow: hidden;
  background: #333333;
  border-radius: 4px;
  margin-top: 5px;
  transition: max-height 0.3s, opacity 0.3s;
  opacity: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 30;
}

.book-selector:hover .book-dropdown {
  max-height: 300px;
  opacity: 1;
}

.book-list {
  padding: 8px 0;
}

.book-item {
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-item:hover {
  background-color: #444444;
}

.book-title {
  font-size: 0.95rem;
}

.app-title {
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0;
  font-weight: bold;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.reading-progress {
  font-size: 0.9rem;
  color: #999999;
}

/* 书签按钮 */
.bookmark-controls {
  display: flex;
  gap: 10px;
}

.bookmark-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  background: #333333;
  border: 1px solid #444444;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.bookmark-btn:hover {
  background: #444444;
}

.bookmark-icon {
  font-size: 1.2rem;
}

.reader-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
}

/* 内容面板 */
.content-panel {
  flex: 1;
  background: #262626;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 5px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.current-book-info {
  max-width: 30%;
}

.reading-title {
  font-size: 1.2rem;
  color: #ffffff;
  margin: 0 0 5px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-navigation {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333333;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #444444;
}

.nav-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #2a2a2a;
}

.page-input-container {
  display: flex;
  align-items: center;
  background: #333333;
  border-radius: 4px;
  padding: 5px 10px;
}

.page-input {
  width: 60px;
  border: none;
  background: transparent;
  color: #ffffff;
  text-align: right;
  font-size: 1rem;
  font-family: inherit;
  padding: 0;
}

.page-input:focus {
  outline: none;
}

.page-divider {
  margin: 0 5px;
  color: #999999;
}

.page-total {
  color: #999999;
  min-width: 20px;
}

.text-container {
  position: relative;
  flex: 1;
  background: #1e1e1e;
  border: 1px solid #333333;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 85vh;
}

.pages-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  max-width: 100%;
  max-height: 100%;
  padding: 10px;
  background-color: #292929;
}

.page-wrapper {
  position: relative;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.4);
  border-radius: 2px;
}

.pdf-canvas {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.reader-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}

.loading-container {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background: rgba(30, 30, 30, 0.9);
  z-index: 20;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #ffffff;
  font-size: 0.9rem;
}

.error-container {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background: rgba(30, 30, 30, 0.9);
  z-index: 20;
  overflow: auto;
}

.error-icon {
  font-size: 2rem;
  color: #e74c3c;
}

.error-text {
  color: #e74c3c;
  text-align: center;
  max-width: 80%;
  font-size: 1rem;
}

/* 快捷键提示 */
.shortcut-tip {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #999999;
  margin-top: 10px;
  flex-wrap: wrap;
  padding: 5px;
}

.key-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #333333;
  border: 1px solid #444444;
  border-radius: 3px;
  padding: 2px 6px;
  min-width: 20px;
  height: 18px;
  font-family: monospace;
  color: #ffffff;
  text-align: center;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-page {
    padding: 10px;
  }
  
  .reader-header {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }
  
  .header-left, .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .app-title {
    font-size: 1.3rem;
    max-width: 150px;
  }
  
  .page-navigation {
    width: 100%;
    justify-content: center;
  }
  
  .pages-container {
    flex-direction: column;
  }
}
</style>