<template>
  <div class="shortcut-help-page">
    <div class="shortcut-container">
      <h1 class="page-title">快捷键指南</h1>
      
      <div class="shortcut-table-container">
        <table class="shortcut-table">
          <thead>
            <tr>
              <th>功能</th>
              <th>快捷键</th>
              <th>描述</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(shortcut, index) in shortcuts" :key="index">
              <td>{{ shortcut.feature }}</td>
              <td>
                <div class="key-combination">
                  <span v-for="(key, keyIndex) in shortcut.keys" :key="keyIndex" class="key">
                    {{ key }}
                  </span>
                </div>
              </td>
              <td>{{ shortcut.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue';

// 注入音效函数
const playButtonSound = inject('playButtonSound');

// 页面标题和描述
const title = "单词学习应用快捷键指南 | 提高学习效率的键盘快捷键";
const description = "了解所有可用的键盘快捷键和操作技巧，提高单词学习的效率。";

// 设置页面标题和元描述（用于SEO优化）
onMounted(() => {
  document.title = title;
  
  // 添加或更新meta描述
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  metaDescription.content = description;
  
  // 播放页面加载音效
  playButtonSound();
});

// 快捷键列表
const shortcuts = ref([
  {
    feature: '切换单词',
    keys: ['Enter'],
    description: '显示下一个随机单词'
  },
  {
    feature: '显示/隐藏翻译',
    keys: ['Shift', 'Shift'],
    description: '双击Shift键切换单词翻译的显示状态'
  },
  {
    feature: '播放发音',
    keys: ['Ctrl', 'Ctrl'],
    description: '双击Ctrl键播放当前单词的发音'
  },
  {
    feature: '导航操作',
    keys: ['点击图标'],
    description: '通过导航栏切换到不同页面'
  },
  {
    feature: '快速输入',
    keys: ['Tab'],
    description: '在单词输入框中，按Tab快速聚焦输入框'
  },
  {
    feature: '音乐控制',
    keys: ['双击音乐图标'],
    description: '播放/暂停背景音乐'
  },
  {
    feature: '任务列表',
    keys: ['点击任务图标'],
    description: '显示/隐藏待办事项列表'
  },
  {
    feature: '全屏切换',
    keys: ['F11'],
    description: '切换浏览器全屏模式（由浏览器支持）'
  }
]);
</script>

<style scoped>
.shortcut-help-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  min-height: 80vh;
  color: white;
}

.shortcut-container {
  width: 100%;
  max-width: 800px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.page-title {
  font-family: serif;
  font-size: 28px;
  margin-bottom: 30px;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.shortcut-table-container {
  overflow-x: auto;
  margin-top: 20px;
}

.shortcut-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.shortcut-table th,
.shortcut-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.shortcut-table th {
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.05);
  font-size: 18px;
}

.shortcut-table tr:last-child td {
  border-bottom: none;
}

.shortcut-table tr:hover td {
  background-color: rgba(255, 255, 255, 0.05);
}

.key-combination {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.key {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 4px 10px;
  font-family: monospace;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 22px;
  text-align: center;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .shortcut-container {
    padding: 20px;
  }
  
  .page-title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .shortcut-table th,
  .shortcut-table td {
    padding: 10px;
    font-size: 14px;
  }
  
  .key {
    padding: 2px 6px;
    font-size: 12px;
  }
  
  .shortcut-table {
    display: block;
    width: 100%;
  }
  
  .shortcut-table th {
    position: sticky;
    top: 0;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .page-title {
    font-size: 32px;
  }
  
  .shortcut-container {
    max-width: 900px;
  }
}

@media (min-width: 1441px) {
  .page-title {
    font-size: 36px;
  }
  
  .shortcut-container {
    max-width: 1000px;
    padding: 40px;
  }
  
  .shortcut-table th {
    font-size: 22px;
  }
  
  .shortcut-table td {
    font-size: 18px;
  }
  
  .key {
    font-size: 16px;
    padding: 6px 12px;
  }
}
</style> 