<!-- TodoList组件 -->
<template>
  <transition name="todolist-panel">
    <div class="todolist-panel" ref="panel" v-show="showTodoList" @click.stop @copy.prevent @contextmenu.prevent>
      <div class="todolist-header">
        <h3>待办事项</h3>
        <div class="sync-status" v-if="syncStatus !== 'idle'">
          <span class="sync-message" :class="syncStatus"></span>
        </div>
        <button class="close-btn" @click="closeTodoList">
          <span>✖</span>
        </button>
      </div>
      
      <div class="todos-list" ref="todosList">
        <div 
          v-for="(todo, index) in todos" 
          :key="todo.id || index"
          class="todo-item"
          :class="{ 
            'completed': todo.completed && !todo.repeatable,
            'repeatable': todo.repeatable 
          }"
        >
          <div class="todo-content">
            <div class="todo-text">{{ todo.text }}</div>
            <div v-if="todo.completed && !todo.repeatable" class="todo-complete-date">
              {{ formatDate(todo.completedAt) }}
            </div>
            <div v-else-if="todo.repeatable" class="todo-repeat-info">
              <span class="execution-count">已执行: {{ todo.executionCount }}次</span>
              <span v-if="todo.lastExecuted" class="last-executed">
                最后执行: {{ formatDate(todo.lastExecuted) }}
              </span>
            </div>
            <div v-if="!todo.completed || todo.repeatable" class="todo-reward">奖励: {{ todo.reward }}币</div>
          </div>
          <div class="todo-actions">
            <button v-if="todo.repeatable" class="execute-btn" @click="executeRepeatableTask(todo)">
              <span class="execute-icon">▶</span>
            </button>
            <div v-else class="todo-checkbox" @click="toggleTodo(index)">
              <span v-if="todo.completed">✓</span>
            </div>
            <div v-if="!todo.repeatable" class="todo-delete" @click="deleteTodo(index)">✖</div>
          </div>
        </div>
        <div v-if="todos.length === 0" class="empty-list">
          暂无待办事项
        </div>
      </div>
      
      <div class="todo-input-area">
        <input 
          type="text" 
          class="todo-input" 
          v-model="newTodo" 
          placeholder="添加新的待办事项"
          @keydown.enter="addTodo"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-disable-autofill
        />
        <div class="reward-input-container">
          <span class="reward-icon">💰</span>
          <input 
            type="number" 
            class="todo-reward-input" 
            v-model="newReward" 
            placeholder=""
            min="1"
            max="100"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-disable-autofill
          />
        </div>
        <button class="send-btn" @click.stop="addTodo">+</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, inject } from 'vue'

// 注入音效函数
const playTouchSound = inject('playTouchSound')
const playButtonSound = inject('playButtonSound')

// 定义props接收父组件传递的数据
const props = defineProps({
  showTodoList: {
    type: Boolean,
    default: false
  }
})

// 定义emit用于向父组件发送事件
const emit = defineEmits(['update:showTodoList'])

// 预定义的可重复任务
const repeatableTasks = [
  {
    id: 'repeat_1',
    text: '六级阅读',
    reward: 50,
    repeatable: true,
    executionCount: 0,
    lastExecuted: null
  },
  {
    id: 'repeat_2',
    text: 'leetcode简单难度题目',
    reward: 30,
    repeatable: true,
    executionCount: 0,
    lastExecuted: null
  },
  {
    id: 'repeat_3',
    text: 'leetcode中等难度题目',
    reward: 50,
    repeatable: true,
    executionCount: 0,
    lastExecuted: null
  },
  {
    id: 'repeat_4',
    text: 'leetcode困难难度题目',
    reward: 100,
    repeatable: true,
    executionCount: 0,
    lastExecuted: null
  },
  {
    id: 'repeat_5',
    text: '吸收一个算法小视频',
    reward: 20,
    repeatable: true,
    executionCount: 0,
    lastExecuted: null
  }
]

// 待办事项列表
const todos = ref([])
const newTodo = ref('')
const newReward = ref(1) // 默认奖励1个金币
const todosList = ref(null)
const panel = ref(null)
const syncStatus = ref('idle') // 'idle', 'syncing', 'success', 'error'
const syncTimeout = ref(null)

// 格式化日期显示
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  
  // 如果是今天
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // 如果是昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // 其他日期
  return `${date.getMonth()+1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 关闭面板
const closeTodoList = () => {
  emit('update:showTodoList', false)
}

// 外部点击关闭面板
const handleOutsideClick = (e) => {
  // 检查是否点击了todolist按钮
  const todolistBtn = document.querySelector('.todolist-icon');
  if (todolistBtn && (todolistBtn === e.target || todolistBtn.contains(e.target))) {
    return; // 如果点击了todolist按钮，在App.vue中处理
  }
  
  // 检查是否点击了发送按钮或其子元素
  const sendBtn = document.querySelector('.send-btn');
  if (sendBtn && (sendBtn === e.target || sendBtn.contains(e.target))) {
    return; // 如果点击了发送按钮，不关闭面板
  }
  
  // 检查是否点击了input-area或其子元素
  const inputArea = document.querySelector('.todo-input-area');
  if (inputArea && (inputArea === e.target || inputArea.contains(e.target))) {
    return; // 如果点击了输入区域，不关闭面板
  }
  
  // 检查点击是否在面板之外
  if (panel.value && !panel.value.contains(e.target) && props.showTodoList) {
    closeTodoList();
  }
}

// 注入addCoins函数
const addCoins = inject('addCoins', null)

// 添加待办事项
const addTodo = () => {
  if (newTodo.value.trim()) {
    // 验证奖励值
    let reward = parseInt(newReward.value);
    if (isNaN(reward) || reward < 1) {
      reward = 1; // 默认最小奖励为1
    } else if (reward > 100) {
      reward = 100; // 最大奖励为100
    }
    
    const newTodoItem = {
      id: Date.now(),
      text: newTodo.value.trim(),
      completed: false,
      timestamp: Date.now(),
      reward: reward,
      completedAt: null,
      repeatable: false
    };
    
    todos.value.push(newTodoItem);
    
    // 重新排序，确保可重复任务在顶部
    todos.value.sort((a, b) => {
      if (a.repeatable && !b.repeatable) return -1;
      if (!a.repeatable && b.repeatable) return 1;
      return 0;
    });
    
    newTodo.value = '';
    
    // 保存到服务器
    saveTodosToServer();
    
    // 滚动到底部
    setTimeout(() => {
      if (todosList.value) {
        todosList.value.scrollTop = todosList.value.scrollHeight;
      }
    }, 0);
  }
}

// 切换待办事项状态
const toggleTodo = (index) => {
  const todo = todos.value[index];
  
  if (todo.repeatable) {
    // 如果是可重复任务，只增加执行次数和奖励金币，不标记为完成
    todo.executionCount++;
    todo.lastExecuted = Date.now();
    
    // 增加金币奖励
    if (addCoins) {
      addCoins(todo.reward);
    }
  } else {
    // 普通任务的处理逻辑
    const wasCompleted = todo.completed;
    todo.completed = !wasCompleted;
    
    if (!wasCompleted && todo.completed) {
      todo.completedAt = Date.now();
      
      // 增加金币奖励
      if (addCoins) {
        addCoins(todo.reward);
      }
    } else if (wasCompleted && !todo.completed) {
      todo.completedAt = null;
    }
  }
  
  saveTodosToServer();
}

// 删除待办事项
const deleteTodo = (index) => {
  todos.value.splice(index, 1);
  saveTodosToServer();
}

// 同步待办事项到服务器
const saveTodosToServer = async () => {
  try {
    // 设置同步状态
    syncStatus.value = 'syncing';
    
    // 发送到服务器
    const response = await fetch('http://localhost:3031/api/save-todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todos: todos.value })
    });
    
    const result = await response.json();
    
    if (result.success) {
      syncStatus.value = 'success';
      
      // 同时保存到localStorage作为备份
      localStorage.setItem('todos-backup', JSON.stringify(todos.value));
    } else {
      throw new Error(result.message || '同步失败');
    }
  } catch (error) {
    console.error('同步待办事项数据失败:', error);
    syncStatus.value = 'error';
    
    // 同步失败时，保存到localStorage作为备份
    localStorage.setItem('todos-backup', JSON.stringify(todos.value));
  } finally {
    // 3秒后清除状态
    if (syncTimeout.value) {
      clearTimeout(syncTimeout.value);
    }
    syncTimeout.value = setTimeout(() => {
      syncStatus.value = 'idle';
    }, 3000);
  }
}

// 从服务器加载待办事项
const loadTodosFromServer = async () => {
  try {
    syncStatus.value = 'syncing';
    
    // 尝试从服务器API获取数据
    const response = await fetch('http://localhost:3031/api/get-todos');
    
    if (!response.ok) {
      throw new Error('获取待办事项数据失败');
    }
    
    const result = await response.json();
    
    if (result.success && result.data && Array.isArray(result.data.todos)) {
      // 合并预定义的可重复任务和从服务器获取的任务
      // 识别哪些任务已经存在（可能已更新），哪些是全新的
      const serverTodos = result.data.todos;
      
      // 处理可重复任务：如果服务器上有，使用服务器版本；否则使用预定义版本
      const mergedTodos = [];
      
      // 创建一个已存在ID的Set用于快速查找
      const existingIds = new Set();
      
      // 添加服务器上的所有任务，并记录ID
      serverTodos.forEach(task => {
        mergedTodos.push(task);
        existingIds.add(task.id);
      });
      
      // 添加预定义的可重复任务，但仅添加服务器上不存在的
      repeatableTasks.forEach(predefinedTask => {
        if (!existingIds.has(predefinedTask.id)) {
          mergedTodos.push(predefinedTask);
        }
      });
      
      // 对合并后的任务进行排序，使可重复任务始终置顶
      mergedTodos.sort((a, b) => {
        // 如果a是可重复任务而b不是，a排在前面
        if (a.repeatable && !b.repeatable) return -1;
        // 如果b是可重复任务而a不是，b排在前面
        if (!a.repeatable && b.repeatable) return 1;
        // 如果两者都是可重复任务或都不是，维持原有顺序
        return 0;
      });
      
      todos.value = mergedTodos;
      console.log('从服务器加载了待办事项数据:', todos.value.length);
      syncStatus.value = 'success';
      
      // 同时保存到localStorage作为备份
      localStorage.setItem('todos-backup', JSON.stringify(todos.value));
    } else if (Array.isArray(result)) {
      // 直接处理简单数组响应
      // 合并预定义的可重复任务和从服务器获取的任务
      const serverTodos = result;
      
      // 处理可重复任务：如果服务器上有，使用服务器版本；否则使用预定义版本
      const mergedTodos = [];
      
      // 创建一个已存在ID的Set用于快速查找
      const existingIds = new Set();
      
      // 添加服务器上的所有任务，并记录ID
      serverTodos.forEach(task => {
        mergedTodos.push(task);
        existingIds.add(task.id);
      });
      
      // 添加预定义的可重复任务，但仅添加服务器上不存在的
      repeatableTasks.forEach(predefinedTask => {
        if (!existingIds.has(predefinedTask.id)) {
          mergedTodos.push(predefinedTask);
        }
      });
      
      // 对合并后的任务进行排序，使可重复任务始终置顶
      mergedTodos.sort((a, b) => {
        // 如果a是可重复任务而b不是，a排在前面
        if (a.repeatable && !b.repeatable) return -1;
        // 如果b是可重复任务而a不是，b排在前面
        if (!a.repeatable && b.repeatable) return 1;
        // 如果两者都是可重复任务或都不是，维持原有顺序
        return 0;
      });
      
      todos.value = mergedTodos;
      console.log('从服务器加载了待办事项数据:', todos.value.length);
      syncStatus.value = 'success';
      
      // 同时保存到localStorage作为备份
      localStorage.setItem('todos-backup', JSON.stringify(todos.value));
    } else {
      console.log('服务器中没有找到待办事项数据，初始化默认任务');
      
      // 尝试从本地备份恢复
      const backupData = localStorage.getItem('todos-backup');
      if (backupData) {
        try {
          const backupTodos = JSON.parse(backupData);
          if (Array.isArray(backupTodos) && backupTodos.length > 0) {
            // 对备份的任务进行排序，使可重复任务始终置顶
            backupTodos.sort((a, b) => {
              if (a.repeatable && !b.repeatable) return -1;
              if (!a.repeatable && b.repeatable) return 1;
              return 0;
            });
            
            todos.value = backupTodos;
            console.log('从本地备份恢复了待办事项数据:', backupTodos.length);
            
            // 立即保存到服务器以同步备份数据
            saveTodosToServer();
            return;
          }
        } catch (error) {
          console.error('解析本地备份数据失败', error);
        }
      }
      
      // 如果没有备份，初始化为预定义的可重复任务
      todos.value = [...repeatableTasks];
      saveTodosToServer(); // 保存预定义任务到服务器
      syncStatus.value = 'success';
    }
  } catch (error) {
    console.error('加载待办事项数据失败:', error);
    syncStatus.value = 'error';
    
    // 尝试从本地备份恢复
    const backupData = localStorage.getItem('todos-backup');
    if (backupData) {
      try {
        const backupTodos = JSON.parse(backupData);
        if (Array.isArray(backupTodos)) {
          // 对备份的任务进行排序，使可重复任务始终置顶
          backupTodos.sort((a, b) => {
            if (a.repeatable && !b.repeatable) return -1;
            if (!a.repeatable && b.repeatable) return 1;
            return 0;
          });
          
          todos.value = backupTodos;
          console.log('从本地备份恢复了待办事项数据');
        }
      } catch (error) {
        console.error('解析本地备份数据失败', error);
        todos.value = [...repeatableTasks];
      }
    } else {
      todos.value = [...repeatableTasks];
    }
  } finally {
    if (syncTimeout.value) {
      clearTimeout(syncTimeout.value);
    }
    syncTimeout.value = setTimeout(() => {
      syncStatus.value = 'idle';
    }, 3000);
  }
}

// 组件挂载时加载待办事项
onMounted(() => {
  loadTodosFromServer();
  
  // 添加全局点击事件监听
  document.addEventListener('click', handleOutsideClick);
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  // 移除全局点击事件监听
  document.removeEventListener('click', handleOutsideClick);
  
  // 清除定时器
  if (syncTimeout.value) {
    clearTimeout(syncTimeout.value);
  }
})

// 监听面板显示状态，当打开时滚动到底部并刷新数据
watch(() => props.showTodoList, (newValue) => {
  if (newValue) {
    // 当面板打开时，从服务器刷新数据
    loadTodosFromServer();
    
    setTimeout(() => {
      if (todosList.value) {
        todosList.value.scrollTop = todosList.value.scrollHeight;
      }
    }, 50); // 给一点延迟确保渲染完成
  }
})

// 暴露方法给父组件
defineExpose({
  closeTodoList
})

const executeRepeatableTask = (task) => {
  if (!task.repeatable) return;
  
  // 更新执行次数和最后执行时间
  task.executionCount = (task.executionCount || 0) + 1;
  task.lastExecuted = Date.now();
  
  // 增加金币奖励
  if (addCoins) {
    addCoins(task.reward);
  }
  
  // 保存到服务器
  saveTodosToServer();
  
  // 显示通知消息
  const successMessage = document.createElement('div');
  successMessage.className = 'execute-success';
  successMessage.textContent = `成功执行: ${task.text}`;
  document.body.appendChild(successMessage);
  
  // 3秒后移除提示
  setTimeout(() => {
    successMessage.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(successMessage);
    }, 500);
  }, 2500);
};
</script>

<style scoped>
.todolist-panel {
  position: fixed;
  top: 70px;
  left: 90px;
  width: 340px;
  height: 420px;
  background: linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(22, 27, 34, 0.95) 100%);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(88, 166, 255, 0.2);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.4),
    0 1px 8px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(88, 166, 255, 0.1);
  font-family: 'Comic Sans MS', cursive, sans-serif;
  opacity: 0.98;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  touch-callout: none;
  z-index: 1000;
  /* transform: rotate(-0.5deg); */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.todolist-panel:hover {
  /* transform: rotate(0deg) translateY(-5px); */
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.45),
    0 1px 10px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(88, 166, 255, 0.2);
}

.todolist-panel-enter-active {
  animation: clipSectorIn 0.35s ease-out;
}

.todolist-panel-leave-active {
  animation: shatter-out 0.3s ease-in forwards;
}

.todolist-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(22, 27, 34, 0.95) 100%);
  border-bottom: 1px solid rgba(88, 166, 255, 0.2);
  position: relative;
}

.todolist-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, 
    rgba(88, 166, 255, 0) 0%, 
    rgba(88, 166, 255, 0.3) 50%, 
    rgba(88, 166, 255, 0) 100%);
}

.todolist-header h3 {
  margin: 0;
  color: #58a6ff;
  font-size: 18px;
  letter-spacing: 1px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.close-btn {
  width: 28px;
  height: 28px;
  background: rgba(88, 166, 255, 0.1);
  border: 1px solid rgba(88, 166, 255, 0.3);
  color: #58a6ff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  transform: rotate(2deg);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.close-btn:hover {
  background: rgba(88, 166, 255, 0.3);
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.todos-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: rgba(13, 17, 23, 0.7);
  background-image: 
    linear-gradient(rgba(88, 166, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(88, 166, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

.todo-item {
  cursor: pointer;
  margin-bottom: 8px;
  background: rgba(22, 27, 34, 0.7);
  border-radius: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(88, 166, 255, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  display: flex;
  align-items: center;
  transform: rotate(0.5deg);
  position: relative;
  overflow: hidden;
  min-height: 36px;
}

.todo-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #58a6ff, #1f6feb);
  opacity: 0.7;
}

.todo-item:nth-child(odd) {
  transform: rotate(-0.5deg);
}

.todo-item:hover {
  background: rgba(22, 27, 34, 0.9);
  border-color: rgba(88, 166, 255, 0.4);
  transform: translateX(3px) rotate(0.8deg);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.25);
}

.todo-item:nth-child(odd):hover {
  transform: translateX(3px) rotate(-0.8deg);
}

.todo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  gap: 4px;
}

.todo-text {
  color: #c9d1d9;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  width: 100%;
}

.todo-repeat-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(88, 166, 255, 0.8);
  width: 100%;
  justify-content: center;
}

.todo-reward {
  font-size: 12px;
  color: #58a6ff;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  width: 100%;
}

.todo-complete-date {
  font-size: 12px;
  color: #7ee787;
  margin-top: 0;
  font-style: italic;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  display: inline-block;
  margin-left: 8px;
}

.todo-delete {
  color: rgba(200, 200, 210, 0.6);
  cursor: pointer;
  font-size: 12px;
  padding: 0 3px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.todo-delete:hover {
  color: #f85149;
  transform: scale(1.2);
}

.todo-item.completed {
  background: rgba(13, 17, 23, 0.7);
  border: 1px dashed rgba(88, 166, 255, 0.2);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.todo-item.completed .todo-checkbox {
  background: rgba(88, 166, 255, 0.2);
  border-color: rgba(88, 166, 255, 0.4);
}

.todo-item.completed .todo-checkbox::after {
  opacity: 1;
  background: linear-gradient(135deg, rgba(88, 166, 255, 0.4), rgba(31, 111, 235, 0.4));
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: rgba(139, 148, 158, 0.6);
}

.empty-list {
  text-align: center;
  color: rgba(139, 148, 158, 0.6);
  padding: 40px 0;
  font-style: italic;
  font-size: 16px;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.empty-list::before {
  content: '📝';
  display: block;
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.7;
}

.todo-input-area {
  padding: 16px;
  background: linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(22, 27, 34, 0.95) 100%);
  border-top: 1px solid rgba(88, 166, 255, 0.2);
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-around;
  position: relative;
}

.todo-input-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, 
    rgba(88, 166, 255, 0) 0%, 
    rgba(88, 166, 255, 0.3) 50%, 
    rgba(88, 166, 255, 0) 100%);
}

.reward-input-container {
  width: 60px;
  position: relative;
  display: flex;
  align-items: center;
}

.reward-icon {
  position: absolute;
  left: 10px;
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.todo-input {
  background: rgba(13, 17, 23, 0.8);
  border: 1px solid rgba(88, 166, 255, 0.3);
  border-radius: 10px;
  padding: 8px 12px;
  color: #c9d1d9;
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  transform: rotate(-0.3deg);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  width: 120px;
}

.todo-reward-input {
  background: rgba(13, 17, 23, 0.8);
  border: 1px solid rgba(88, 166, 255, 0.3);
  border-radius: 10px;
  padding: 8px 8px 8px 30px;
  color: #58a6ff;
  font-size: 14px;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  font-weight: bold;
  transition: all 0.3s ease;
  text-align: center;
  /* 隐藏上下调节按钮 - Chrome, Safari, Edge, Opera */
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;
  width: 40px;
  transform: rotate(0.5deg);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 隐藏上下调节按钮 - Firefox */
.todo-reward-input::-webkit-outer-spin-button,
.todo-reward-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.todo-input:focus,
.todo-reward-input:focus {
  outline: none;
  border-color: rgba(88, 166, 255, 0.5);
  box-shadow: 0 0 10px rgba(88, 166, 255, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.2);
  transform: rotate(0deg);
}

.todo-input::placeholder {
  color: rgba(139, 148, 158, 0.6);
  font-style: italic;
}

.todo-reward-input::placeholder {
  color: rgba(88, 166, 255, 0.6);
  font-style: italic;
}

.send-btn {
  background: linear-gradient(135deg, #58a6ff, #1f6feb);
  border: 1px solid rgba(88, 166, 255, 0.3);
  border-radius: 10px;
  height: 36px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  transform: rotate(1deg);
  font-weight: bold;
  margin-left: 10px;
  width: 36px;
  position: relative;
  overflow: hidden;
}

.send-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.send-btn:hover {
  transform: translateY(-3px) rotate(3deg);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.25);
  background: linear-gradient(135deg, #79b8ff, #2188ff);
}

.send-btn:hover::after {
  opacity: 1;
}

.send-btn:active {
  transform: translateY(1px) rotate(0deg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.todos-list::-webkit-scrollbar {
  width: 8px;
}

.todos-list::-webkit-scrollbar-track {
  background: rgba(13, 17, 23, 0.2);
  border-radius: 10px;
  margin: 4px 0;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
}

.todos-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(88, 166, 255, 0.6), rgba(31, 111, 235, 0.7));
  border-radius: 10px;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border: 2px solid rgba(13, 17, 23, 0.2);
}

.todos-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(88, 166, 255, 0.8), rgba(31, 111, 235, 0.9));
  box-shadow: 0 0 5px rgba(88, 166, 255, 0.5);
}

/* Firefox滚动条样式 */
.todos-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 166, 255, 0.7) rgba(13, 17, 23, 0.3);
}

.sync-status {
  position: absolute;
  top: 10px;
  right: 45px;
  font-size: 11px;
}

.sync-message {
  padding: 3px 10px;
  border-radius: 12px;
  animation: fadeIn 0.3s ease;
  font-style: italic;
  display: inline-block;
}

.sync-message.syncing::before {
  content: '同步中...';
  color: #58a6ff;
}

.sync-message.success::before {
  content: '已保存';
  color: #7ee787;
}

.sync-message.error::before {
  content: '同步失败';
  color: #f85149;
}

.sync-message.syncing {
  background: rgba(88, 166, 255, 0.1);
  border: 1px dashed rgba(88, 166, 255, 0.4);
  animation: pulse 1.5s infinite;
}

.sync-message.success {
  background: rgba(126, 231, 135, 0.1);
  border: 1px dashed rgba(126, 231, 135, 0.4);
}

.sync-message.error {
  background: rgba(248, 81, 73, 0.1);
  border: 1px dashed rgba(248, 81, 73, 0.4);
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes clipSectorIn {
  0% {
    opacity: 0;
    clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
  }
  
  50% {
    opacity: 0.6;
    clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
  }

  100% {
    opacity: 1;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}

@keyframes shatter-out {
  0% {
    transform: translateY(0);
    opacity: 1;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }

  50% {
    transform: translateY(-10px);
    opacity: 0.6;
    clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
  }

  100% {
    transform: translateY(-20px);
    opacity: 0;
    clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
  }
}

@media (max-width: 768px) {
  .todolist-panel {
    width: 90%;
    max-width: 400px;
    left: 5%;
    top: 80px;
  }
}

@media (max-width: 480px) {
  .todolist-panel {
    width: 95%;
    max-width: 350px;
    left: 2.5%;
    top: 70px;
  }
}

/* 中等屏幕（笔记本电脑） */
@media (min-width: 769px) and (max-width: 1024px) {
  .todolist-panel {
    width: 380px;
    height: 420px;
    top: 75px;
    left: 95px;
  }
  
  .todolist-header h3 {
    font-size: 20px;
  }
  
  .close-btn {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }
  
  .todo-item {
    font-size: 15px;
    padding: 14px 16px;
  }
  
  .todo-checkbox {
    width: 26px;
    height: 26px;
  }
  
  .todo-text {
    font-size: 16px;
  }
  
  .todo-input, .todo-reward-input {
    font-size: 15px;
    padding: 10px 14px;
  }
  
  .reward-icon {
    font-size: 15px;
  }
  
  .send-btn {
    height: 40px;
    width: 40px;
    font-size: 16px;
  }
  
  .empty-list {
    font-size: 17px;
  }
  
  .empty-list::before {
    font-size: 36px;
  }
}

/* 大屏幕（桌面） */
@media (min-width: 1025px) and (max-width: 1440px) {
  .todolist-panel {
    width: 400px;
    height: 450px;
    top: 90px;
    left: 120px;
    border-radius: 18px;
  }
  
  .todolist-header {
    padding: 18px 22px;
  }
  
  .todolist-header h3 {
    font-size: 22px;
    letter-spacing: 1.5px;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
    border-radius: 10px;
  }
  
  .todos-list {
    padding: 20px;
    background-size: 25px 25px;
  }
  
  .todo-item {
    font-size: 16px;
    padding: 16px 18px;
    margin-bottom: 16px;
    border-radius: 14px;
  }
  
  .todo-checkbox {
    width: 28px;
    height: 28px;
    margin-right: 16px;
    border-radius: 10px;
  }
  
  .todo-text {
    font-size: 18px;
  }
  
  .todo-reward {
    font-size: 14px;
    /* margin-top: 6px; */
  }
  
  .todo-complete-date {
    font-size: 14px;
    margin-top: 6px;
  }
  
  .todo-delete {
    font-size: 16px;
    padding: 0 7px;
  }
  
  .todo-input-area {
    padding: 18px 22px;
    gap: 12px;
  }
  
  .todo-input {
    font-size: 16px;
    padding: 10px 15px;
    border-radius: 12px;
    width: 160px;
  }
  
  .todo-reward-input {
    font-size: 18px;
    padding: 10px 10px 10px 36px;
    border-radius: 12px;
    width: 45px;
  }
  
  .reward-icon {
    font-size: 18px;
    left: 12px;
  }
  
  .send-btn {
    height: 45px;
    width: 45px;
    font-size: 18px;
    border-radius: 12px;
  }
  
  .empty-list {
    font-size: 18px;
    padding: 50px 0;
  }
  
  .empty-list::before {
    font-size: 42px;
    margin-bottom: 15px;
  }
  
  .sync-status {
    right: 50px;
    font-size: 12px;
  }
  
  .sync-message {
    padding: 3px 12px;
    border-radius: 14px;
  }
  
  .todos-list::-webkit-scrollbar {
    width: 10px;
  }
}

/* 超大屏幕（大型桌面） */
@media (min-width: 1441px) and (max-width: 1920px) {
  .todolist-panel {
    width: 420px;
    height: 500px;
    top: 110px;
    left: 150px;
    border-radius: 20px;
  }
  
  .todolist-header {
    padding: 20px 25px;
  }
  
  .todolist-header h3 {
    font-size: 24px;
    letter-spacing: 2px;
  }
  
  .close-btn {
    width: 36px;
    height: 36px;
    font-size: 20px;
    border-radius: 12px;
  }
  
  .todos-list {
    padding: 25px;
    background-size: 30px 30px;
  }
  
  .todo-item {
    font-size: 18px;
    padding: 18px 20px;
    margin-bottom: 20px;
    border-radius: 16px;
  }
  
  .todo-checkbox {
    width: 32px;
    height: 32px;
    margin-right: 20px;
    border-radius: 12px;
  }
  
  .todo-text {
    font-size: 20px;
  }
  
  .todo-reward {
    font-size: 16px;
    /* margin-top: 8px; */
  }
  
  .todo-complete-date {
    font-size: 16px;
    margin-top: 8px;
  }
  
  .todo-delete {
    font-size: 18px;
    padding: 0 8px;
  }
  
  .todo-input-area {
    padding: 20px 25px;
    gap: 15px;
  }
  
  .todo-input {
    font-size: 18px;
    padding: 12px 18px;
    border-radius: 14px;
    width: 180px;
  }
  
  .todo-reward-input {
    font-size: 20px;
    padding: 12px 12px 12px 42px;
    border-radius: 14px;
    width: 50px;
  }
  
  .reward-icon {
    font-size: 20px;
    left: 14px;
  }
  
  .send-btn {
    height: 50px;
    width: 50px;
    font-size: 20px;
    border-radius: 14px;
  }
  
  .empty-list {
    font-size: 20px;
    padding: 60px 0;
  }
  
  .empty-list::before {
    font-size: 48px;
    margin-bottom: 18px;
  }
  
  .sync-status {
    right: 60px;
    font-size: 14px;
  }
  
  .sync-message {
    padding: 4px 14px;
    border-radius: 16px;
  }
  
  .todos-list::-webkit-scrollbar {
    width: 12px;
  }
}

/* 超大屏幕 4K */
@media (min-width: 1921px) and (max-width: 2560px) {
  .todolist-panel {
    width: 460px;
    height: 600px;
    top: 140px;
    left: 180px;
    border-radius: 24px;
  }
  
  .todolist-header {
    padding: 24px 30px;
  }
  
  .todolist-header h3 {
    font-size: 28px;
    letter-spacing: 2.5px;
  }
  
  .close-btn {
    width: 42px;
    height: 42px;
    font-size: 24px;
    border-radius: 14px;
  }
  
  .todos-list {
    padding: 30px;
    background-size: 35px 35px;
  }
  
  .todo-item {
    font-size: 20px;
    padding: 22px 24px;
    margin-bottom: 24px;
    border-radius: 18px;
  }
  
  .todo-checkbox {
    width: 38px;
    height: 38px;
    margin-right: 24px;
    border-radius: 14px;
  }
  
  .todo-text {
    font-size: 24px;
  }
  
  .todo-reward {
    font-size: 18px;
    /* margin-top: 10px; */
  }
  
  .todo-complete-date {
    font-size: 18px;
    margin-top: 10px;
  }
  
  .todo-delete {
    font-size: 20px;
    padding: 0 10px;
  }
  
  .todo-input-area {
    padding: 24px 30px;
    gap: 18px;
  }
  
  .todo-input {
    font-size: 20px;
    padding: 15px 22px;
    border-radius: 16px;
    width: 220px;
  }
  
  .todo-reward-input {
    font-size: 22px;
    padding: 15px 15px 15px 48px;
    border-radius: 16px;
    width: 60px;
  }
  
  .reward-icon {
    font-size: 22px;
    left: 16px;
  }
  
  .send-btn {
    height: 60px;
    width: 60px;
    font-size: 24px;
    border-radius: 16px;
  }
  
  .empty-list {
    font-size: 24px;
    padding: 70px 0;
  }
  
  .empty-list::before {
    font-size: 54px;
    margin-bottom: 22px;
  }
  
  .sync-status {
    right: 70px;
    font-size: 16px;
  }
  
  .sync-message {
    padding: 5px 16px;
    border-radius: 18px;
  }
  
  .todos-list::-webkit-scrollbar {
    width: 14px;
  }
}

.todo-item.repeatable {
  background: rgba(22, 27, 34, 0.8);
  border: 1px solid rgba(88, 166, 255, 0.3);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
  padding: 8px 12px;
  margin-bottom: 6px;
  height: auto;
  min-height: 36px;
}

.todo-item.repeatable:hover {
  background: rgba(22, 27, 34, 0.9);
  border-color: rgba(88, 166, 255, 0.5);
  transform: translateX(3px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3);
}

.todo-item.repeatable .todo-text {
  font-size: 14px;
  margin-bottom: 0;
  width: 100%;
}

.execution-count {
  font-weight: bold;
  color: #58a6ff;
}

.last-executed {
  color: rgba(88, 166, 255, 0.6);
  font-style: italic;
}

.todo-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.execute-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(88, 166, 255, 0.4);
  background: rgba(88, 166, 255, 0.1);
  color: #58a6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.execute-btn:hover {
  background: rgba(88, 166, 255, 0.2);
  transform: scale(1.1);
  box-shadow: 0 0 8px rgba(88, 166, 255, 0.3);
}

.execute-icon {
  font-size: 10px;
  line-height: 1;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(88, 166, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  background: rgba(22, 27, 34, 0.8);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  font-size: 10px;
}

.todo-checkbox:hover {
  background: rgba(22, 27, 34, 0.9);
  transform: scale(1.1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 5px rgba(88, 166, 255, 0.3);
}

.todo-delete {
  color: rgba(200, 200, 210, 0.6);
  cursor: pointer;
  font-size: 12px;
  padding: 0 3px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.todo-delete:hover {
  color: #f85149;
  transform: scale(1.2);
}
</style> 