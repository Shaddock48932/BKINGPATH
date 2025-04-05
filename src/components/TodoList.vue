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
          :class="{ 'completed': todo.completed }"
        >
          <div class="todo-checkbox" @click="toggleTodo(index)">
            <span v-if="todo.completed">✓</span>
          </div>
          <div class="todo-content">
            <div class="todo-text">{{ todo.text }}</div>
            <div v-if="todo.completed" class="todo-complete-date">{{ formatDate(todo.completedAt) }}</div>
            <div v-if="!todo.completed" class="todo-reward">奖励: {{ todo.reward }}币</div>
          </div>
          <div class="todo-delete" @click="deleteTodo(index)">✖</div>
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
      completedAt: null
    };
    
    todos.value.push(newTodoItem);
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
  const wasCompleted = todo.completed;
  
  // 切换完成状态
  todo.completed = !wasCompleted;
  
  // 如果从未完成变为完成
  if (!wasCompleted && todo.completed) {
    todo.completedAt = Date.now();
    
    // 增加金币奖励
    if (addCoins) {
      addCoins(todo.reward);
    }
  } else if (wasCompleted && !todo.completed) {
    // 如果从完成变为未完成，清除完成时间
    todo.completedAt = null;
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
      todos.value = result.data.todos;
      console.log('从服务器加载了待办事项数据:', todos.value.length);
      syncStatus.value = 'success';
    } else if (Array.isArray(result)) {
      todos.value = result;
      console.log('从服务器加载了待办事项数据:', todos.value.length);
      syncStatus.value = 'success';
    } else {
      console.log('服务器中没有找到待办事项数据，初始化为空列表');
      todos.value = [];
      syncStatus.value = 'error';
      
      // 尝试从本地备份恢复
      const backupData = localStorage.getItem('todos-backup');
      if (backupData) {
        try {
          const backupTodos = JSON.parse(backupData);
          if (Array.isArray(backupTodos) && backupTodos.length > 0) {
            todos.value = backupTodos;
            console.log('从本地备份恢复了待办事项数据:', backupTodos.length);
          }
        } catch (error) {
          console.error('解析本地备份数据失败', error);
        }
      }
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
          todos.value = backupTodos;
          console.log('从本地备份恢复了待办事项数据');
        }
      } catch (error) {
        console.error('解析本地备份数据失败', error);
        todos.value = [];
      }
    } else {
      // 如果没有本地备份，尝试从旧的localStorage加载
      try {
        const oldData = localStorage.getItem('todos');
        if (oldData) {
          const oldTodos = JSON.parse(oldData);
          if (Array.isArray(oldTodos)) {
            todos.value = oldTodos;
            console.log('从旧的localStorage恢复了待办事项数据');
            // 立即保存到服务器
            saveTodosToServer();
          }
        }
      } catch (error) {
        console.error('解析旧的localStorage数据失败', error);
        todos.value = [];
      }
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
</script>

<style scoped>
.todolist-panel {
  position: fixed;
  top: 70px;
  left: 90px;
  width: 320px;
  height: 400px;
  background: rgba(20, 20, 22, 0.88);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 3px solid #3c3c44;
  box-shadow:
    5px 5px 0 rgba(0, 0, 0, 0.2),
    inset 0 0 20px rgba(80, 80, 90, 0.2);
  font-family: 'Comic Sans MS', cursive, sans-serif;
  opacity: 0.95;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  touch-callout: none;
  z-index: 1000;
  transform: rotate(-0.5deg);
}

.todolist-panel-enter-active {
  animation: clipSectorIn 0.35s ease-out;
}

.todolist-panel-leave-active {
  animation: shatter-out 0.3s ease-in forwards;
}

.todolist-header {
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, rgba(50, 50, 60, 0.9) 0%, rgba(40, 40, 45, 0.9) 100%);
  border-bottom: 3px solid #1a1a1e;
  position: relative;
}

.todolist-header::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 3px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255, 255, 255, 0.1) 5px,
    rgba(255, 255, 255, 0.1) 10px
  );
}

.todolist-header h3 {
  margin: 0;
  color: #e9e9ef;
  font-size: 18px;
  letter-spacing: 1px;
  font-weight: bold;
  text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.close-btn {
  width: 24px;
  height: 24px;
  background: #484855;
  border: 2px solid #5a5a65;
  color: #e0e0e5;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.2s ease;
  transform: rotate(2deg);
}

.close-btn:hover {
  background: #5a5a65;
  transform: scale(1.1) rotate(5deg);
}

.todos-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: rgba(25, 25, 30, 0.7);
  background-image: 
    linear-gradient(rgba(50, 50, 60, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(50, 50, 60, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

.todo-item {
  cursor: pointer;
  margin-bottom: 12px;
  background: rgba(35, 35, 40, 0.8);
  border-radius: 8px;
  padding: 10px 12px;
  border: 2px solid rgba(80, 80, 90, 0.4);
  transition: all 0.3s ease;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
  font-size: 14px;
  display: flex;
  align-items: center;
  transform: rotate(0.5deg);
}

.todo-item:nth-child(odd) {
  transform: rotate(-0.5deg);
}

.todo-item:hover {
  background: rgba(45, 45, 50, 0.95);
  border-color: rgba(100, 100, 110, 0.5);
  transform: translateX(3px) rotate(0.8deg);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.25);
}

.todo-item:nth-child(odd):hover {
  transform: translateX(3px) rotate(-0.8deg);
}

.todo-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid rgba(120, 120, 130, 0.5);
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  transform: rotate(-2deg);
  background: rgba(40, 40, 45, 0.6);
}

.todo-checkbox:hover {
  background: rgba(60, 60, 65, 0.6);
  transform: scale(1.1) rotate(2deg);
}

.todo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.todo-text {
  color: rgba(240, 240, 245, 0.9);
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
}

.todo-reward {
  font-size: 12px;
  color: rgba(255, 215, 0, 0.8);
  margin-top: 4px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
}

.todo-complete-date {
  font-size: 12px;
  color: rgba(100, 200, 140, 0.8);
  margin-top: 4px;
  font-style: italic;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
}

.todo-delete {
  color: rgba(200, 200, 210, 0.5);
  cursor: pointer;
  font-size: 14px;
  padding: 0 5px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.todo-delete:hover {
  color: rgba(255, 100, 100, 0.9);
  transform: scale(1.2) rotate(15deg);
}

.todo-item.completed {
  background: rgba(30, 30, 35, 0.7);
  border: 2px dashed rgba(80, 80, 90, 0.3);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.todo-item.completed .todo-checkbox {
  background: rgba(80, 130, 120, 0.6);
  border-color: rgba(80, 130, 120, 0.8);
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: rgba(150, 150, 160, 0.5);
}

.empty-list {
  text-align: center;
  color: rgba(180, 180, 190, 0.5);
  padding: 30px 0;
  font-style: italic;
  font-size: 16px;
  line-height: 1.5;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.empty-list::before {
  content: '📝';
  display: block;
  font-size: 30px;
  margin-bottom: 10px;
  opacity: 0.7;
}

.todo-input-area {
  padding: 12px 15px;
  background: rgba(25, 25, 30, 0.9);
  border-top: 3px solid #1a1a1e;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-around;
  position: relative;
}

.todo-input-area::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 0;
  width: 100%;
  height: 3px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255, 255, 255, 0.1) 5px,
    rgba(255, 255, 255, 0.1) 10px
  );
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
  background: rgba(50, 50, 55, 0.8);
  border: 2px solid rgba(90, 90, 100, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  color: #e9e9ef;
  font-size: 14px;
  transition: all 0.3s ease;
  width: 160px;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  transform: rotate(-0.3deg);
  box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.2);
  width: 115px;
}

.todo-reward-input {
  background: rgba(50, 50, 55, 0.8);
  border: 2px solid rgba(90, 90, 100, 0.4);
  border-radius: 8px;
  padding: 8px 8px 8px 30px;
  color: #FFD700;
  font-size: 16px;
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
  box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.2);
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
  border-color: rgba(130, 130, 150, 0.6);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1), inset 2px 2px 5px rgba(0, 0, 0, 0.2);
  transform: rotate(0deg);
}

.todo-input::placeholder {
  color: rgba(170, 170, 180, 0.5);
  font-style: italic;
}

.todo-reward-input::placeholder {
  color: rgba(255, 215, 0, 0.5);
  font-style: italic;
}

.send-btn {
  background: linear-gradient(45deg, rgba(70, 70, 80, 0.9), rgba(50, 50, 60, 0.9));
  border: 2px solid #3a3a45;
  border-radius: 8px;
  height: 36px;
  color: #e9e9ef;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  /* font-size: 24px; */
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
  transform: rotate(1deg);
  font-weight: bold;
  margin-left: 15px;
  width: 20px;
}

.send-btn:hover {
  transform: translateY(-3px) rotate(3deg);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.25);
  background: linear-gradient(45deg, rgba(80, 80, 90, 0.9), rgba(60, 60, 70, 0.9));
}

.send-btn:active {
  transform: translateY(1px) rotate(0deg);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25);
}

.todos-list::-webkit-scrollbar {
  width: 8px;
}

.todos-list::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.2);
  border-radius: 10px;
  margin: 4px 0;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
}

.todos-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(80, 80, 90, 0.6), rgba(60, 60, 70, 0.7));
  border-radius: 10px;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border: 2px solid rgba(30, 30, 35, 0.2);
}

.todos-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(90, 90, 100, 0.8), rgba(70, 70, 80, 0.9));
  box-shadow: 0 0 5px rgba(80, 80, 90, 0.5);
}

/* Firefox滚动条样式 */
.todos-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(80, 80, 90, 0.7) rgba(30, 30, 35, 0.3);
}

.sync-status {
  position: absolute;
  top: 10px;
  right: 45px;
  font-size: 11px;
}

.sync-message {
  padding: 2px 8px;
  border-radius: 10px;
  animation: fadeIn 0.3s ease;
  font-style: italic;
  display: inline-block;
}

.sync-message.syncing::before {
  content: '同步中...';
  color: #add8e6;
}

.sync-message.success::before {
  content: '已保存';
  color: #90ee90;
}

.sync-message.error::before {
  content: '同步失败';
  color: #ffb6c1;
}

.sync-message.syncing {
  background: rgba(100, 149, 237, 0.2);
  border: 1px dashed rgba(100, 149, 237, 0.4);
  animation: pulse 1.5s infinite;
}

.sync-message.success {
  background: rgba(50, 205, 50, 0.2);
  border: 1px dashed rgba(50, 205, 50, 0.4);
}

.sync-message.error {
  background: rgba(220, 20, 60, 0.2);
  border: 1px dashed rgba(220, 20, 60, 0.4);
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
    transform: translateY(-20px);
    opacity: 0;
    clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
  }
  
  50% {
    transform: translateY(-10px);
    opacity: 0.6;
    clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
  }

  100% {
    transform: translateY(0);
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
    width: 290px;
  }
}

@media (max-width: 480px) {
  .todolist-panel {
    width: 270px;
  }
}
</style> 