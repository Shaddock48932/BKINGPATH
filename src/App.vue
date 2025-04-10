<script setup>
import { ref, onMounted, watch, onBeforeUnmount, provide } from 'vue'
import { useRoute } from 'vue-router'
import WordCard from './components/WordCard.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import NoteBook from './components/NoteBook.vue'
import TodoList from './components/TodoList.vue'
import NavBar from './components/NavBar.vue'
import AlertContainer from './components/AlertContainer.vue'
import ShoppingMall from './components/ShoppingMall.vue'

// 引入当前路由
const route = useRoute()

// 导入音效
import nextSound from './assets/sound/next.mp3'
import buttonSound from './assets/sound/button2.mp3'
import touchSound from './assets/sound/touch.mp3'

// 音效音量设置
const soundVolume = ref(0.4) // 默认音量50%

// 金币系统
const coins = ref(0)
const coinAnimating = ref(false)
const isSaving = ref(false) // 保存状态
const serverError = ref(false) // 服务器错误状态

// 增加金币函数
const addCoins = async (amount) => {
  if(amount > 1){
    // 设置动画标记
    coinAnimating.value = true
  }
  
  // 增加金币
  coins.value += amount
  
  // 使用金币API保存数据
  try {
    isSaving.value = true;
    serverError.value = false;
    
    const response = await fetch('http://localhost:3031/api/save-coins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coins: coins.value })
    });
    
    if (!response.ok) {
      throw new Error('保存到服务器失败');
    }
    
    console.log('金币数据已成功保存到服务器');
    
  } catch (error) {
    console.error('保存金币数据失败:', error);
    serverError.value = true;
  } finally {
    isSaving.value = false;
    
    // 重置动画标记
    setTimeout(() => {
      coinAnimating.value = false
    }, 500)
  }
}

// 从服务器加载金币数据
const loadCoinsFromServer = async () => {
  try {
    // 尝试从金币API获取数据
    const response = await fetch('http://localhost:3031/api/get-coins');
    
    if (!response.ok) {
      throw new Error('获取金币数据失败');
    }
    
    const data = await response.json();
    
    if (data.success && data.data && typeof data.data.coins === 'number') {
      coins.value = data.data.coins;
      console.log('从服务器加载了金币数据:', coins.value);
    } else if (data.coins !== undefined) {
      coins.value = data.coins;
      console.log('从服务器加载了金币数据:', coins.value);
    } else {
      console.log('服务器中没有找到金币数据，初始化为0');
      coins.value = 0;
    }
    
    serverError.value = false;
    
  } catch (error) {
    console.error('加载金币数据失败:', error);
    serverError.value = true;
    coins.value = 0;
  }
}

// 可用的单词列表文件
const wordLists = [
  { name: '游戏词汇', file: './src/data/gamebase.json' },
  { name: '计算机专业词汇', file: './src/data/cs.json' },
  { name: '前端', file: './src/data/web.json' },
  { name: 'Java', file: './src/data/javause.json' },
  { name: '数据结构', file: './src/data/data_structure.json' },
  { name: '日常易错词', file: './src/data/dailyuse.json' },
  { name: 'UE常用词汇', file: './src/data/uebase.json' },
  { name: 'C++', file: './src/data/cplusplus.json' },
]

// 当前选择的单词列表
const currentList = ref(wordLists[0])
// 单词列表数据
const wordsList = ref([])
// 当前显示的单词索引
const currentIndex = ref(0)
// 获取当前单词数据
const currentWord = ref({ word: '', translation: '', tags: [] })
// 加载状态
const isLoading = ref(true)
// 错误信息
const errorMessage = ref('')
// 控制内容显示的过渡效果
const isContentVisible = ref(true)
// 用户输入
const userInput = ref('')
// 引用WordCard组件
const wordCardRef = ref(null)
// 记录上次Enter键按下的时间
const lastEnterTime = ref(0)
// 记录上次Shift键按下的时间
const lastShiftTime = ref(0)
// 记录上次Ctrl键按下的时间
const lastCtrlTime = ref(0)
// 音乐播放器引用
const musicPlayerRef = ref(null)

// 音效对象
const nextAudio = new Audio(nextSound)
const buttonAudio = new Audio(buttonSound)
const touchAudio = new Audio(touchSound)

// 设置音效音量
nextAudio.volume = soundVolume.value
buttonAudio.volume = soundVolume.value
touchAudio.volume = soundVolume.value

// 调整音效音量的函数
const setSoundVolume = (volume) => {
  if (volume < 0) volume = 0
  if (volume > 1) volume = 1
  
  soundVolume.value = volume
  nextAudio.volume = volume
  buttonAudio.volume = volume
  touchAudio.volume = volume
  localStorage.setItem('soundVolume', volume.toString())
}

// 播放音效函数
const playNextSound = () => {
  const audio = new Audio(nextSound)
  audio.volume = soundVolume.value
  audio.play()
}

const playButtonSound = () => {
  const audio = new Audio(buttonSound)
  audio.volume = soundVolume.value
  audio.play()
}

const playTouchSound = () => {
  const audio = new Audio(touchSound)
  audio.volume = soundVolume.value
  audio.play()
}

// 将音效函数提供给子组件
provide('playNextSound', playNextSound)
provide('playButtonSound', playButtonSound)
provide('playTouchSound', playTouchSound)
provide('setSoundVolume', setSoundVolume)
provide('soundVolume', soundVolume)

// 将addCoins函数和金币数据提供给子组件
provide('addCoins', addCoins)
provide('coins', coins)

/**
 * 显示随机单词
 */
const showRandomWord = () => {
  if (wordsList.value.length <= 1) return
  
  let newIndex
  do {
    newIndex = Math.floor(Math.random() * wordsList.value.length)
  } while (newIndex === currentIndex.value)
  
  currentIndex.value = newIndex
  currentWord.value = wordsList.value[newIndex]
  userInput.value = '' // 清除输入框内容
}

/**
 * 加载单词列表数据
 */
const loadWordsList = async (listFile) => {
  isLoading.value = true
  errorMessage.value = ''
  
  // 先淡出当前内容
  isContentVisible.value = false
  
  // 清空用户输入
  userInput.value = ''
  
  // 等待淡出动画完成
  await new Promise(resolve => setTimeout(resolve, 300))
  
  try {
    const response = await fetch(listFile)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    wordsList.value = Array.isArray(data) ? data : []
    
    if (wordsList.value.length > 0) {
      currentIndex.value = Math.floor(Math.random() * wordsList.value.length)
      currentWord.value = wordsList.value[currentIndex.value]
    } else {
      errorMessage.value = '单词列表为空'
    }
  } catch (error) {
    console.error('Failed to load words:', error)
    errorMessage.value = '加载单词列表失败，请检查文件路径或格式是否正确'
    wordsList.value = []
  } finally {
    isLoading.value = false
    // 显示新内容
    isContentVisible.value = true
  }
}

// 监听单词列表切换
watch(() => currentList.value, (newList) => {
  loadWordsList(newList.file)
  playButtonSound() // 播放切换音效
})

// 监听用户输入
watch(() => userInput.value, (newValue) => {
  const input = document.querySelector('.userRepeat input')
  if (!input) return
  
  if (newValue === currentWord.value.word) {
    input.style.color = 'white'
    playTouchSound()
    // 正确输入单词时奖励金币
    addCoins(1)
  } else {
    input.style.color = '#ff6b6b'
  }
})

// 处理键盘事件的函数
const handleKeyPress = (event) => {
  // 如果当前路径是/reader，不在这里处理键盘事件
  if (route.path === '/reader' || event.isHandledByReader) {
    return
  }
  
  // Enter键 - 显示下一个词
  if (event.key === 'Enter') {
    // 如果用户正在输入，不响应Enter键
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
      return
    }
    
    const now = Date.now()
    if (now - lastEnterTime.value < 300) {
      return // 防止快速连续按Enter
    }
    lastEnterTime.value = now
    
    playNextSound()
    showRandomWord()
  }
}

// 组件挂载时初始化
onMounted(() => {
  // 从本地存储加载音量设置
  const savedVolume = localStorage.getItem('soundVolume')
  if (savedVolume !== null) {
    setSoundVolume(parseFloat(savedVolume))
  }
  
  // 从服务器加载金币数据
  loadCoinsFromServer();
  
  // 添加音乐播放器切换事件监听
  window.addEventListener('toggle-music-player', toggleMusicPlayer)
  
  // 添加键盘事件监听器
  window.addEventListener('keydown', handleKeyPress)
  
  loadWordsList(currentList.value.file)
})

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('toggle-music-player', toggleMusicPlayer)
  window.removeEventListener('keydown', handleKeyPress)
})

// 控制音乐播放器的显示状态
const showMusicPlayer = ref(true)

// todolist相关状态
const todoClickTimer = ref(null)
const showTodoList = ref(false)
const isTodoRotating = ref(false)
const todoListRef = ref(null)

// shopping mall相关状态
const showShoppingMall = ref(false)
const shoppingMallRef = ref(null)

// 简化todolist点击处理逻辑
const handleTodoClick = () => {
  // 直接切换显示状态
  showTodoList.value = !showTodoList.value
}

// 处理商城图标点击
const handleShoppingClick = () => {
  // 切换显示状态
  showShoppingMall.value = !showShoppingMall.value
  console.log('商城面板状态:', showShoppingMall.value)
  playTouchSound()
}

const handleTodoDoubleClick = (e) => {
  // 双击时阻止触发单击事件
  e.stopPropagation()
  isTodoRotating.value = !isTodoRotating.value
  playTouchSound()
}

// 切换音乐播放器显示/隐藏
const toggleMusicPlayer = () => {
  showMusicPlayer.value = !showMusicPlayer.value
}
</script>

<template>
  <div class="app">
    <nav-bar />
    
    <div class="ceil-bar">
      <div class="money-box">
        <span class="coin-icon">💸</span>
        <span class="coin-count" :class="{ 'coin-animate': coinAnimating }">
          {{ coins }}
          <small v-if="isSaving" class="saving-indicator">
            <i class="saving-dot"></i>
          </small>
          <small v-if="serverError" class="error-indicator">!</small>
        </span>
      </div>
      <div class="todolist">
        <span 
          class="todolist-icon" 
          :class="{ 'rotating': isTodoRotating }"
          @mouseenter="playTouchSound" 
          @click="handleTodoClick"
          @dblclick="handleTodoDoubleClick($event)"
          title="待办事项"
        >📋</span>
      </div>
      <div class="shopping-mall">
        <span 
          class="shopping-mall-icon"
          @mouseenter="playTouchSound"
          @click="handleShoppingClick"
          title="购物商城"
        >🛒</span>
      </div>
    </div>

    <TodoList v-model:showTodoList="showTodoList" ref="todoListRef" />
    <NoteBook />
    <ShoppingMall v-model:showShoppingMall="showShoppingMall" ref="shoppingMallRef" />
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
    
    <div class="background-music">
      <music-player v-if="showMusicPlayer" ref="musicPlayerRef" />
    </div>
    
    <!-- 金币动画 -->
    <div class="coin-animation" v-if="coinAnimating">
      <div class="coin-icon">+1</div>
    </div>
    
    <!-- 服务器状态提示 -->
    <div class="server-status" v-if="serverError">
      <i class="fas fa-exclamation-triangle"></i> 服务器连接失败
    </div>
    
    <!-- 警告提示容器 -->
    <alert-container />
  </div>
</template>

<style>
/* 禁用浏览器自动填充弹框和相关样式 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px rgba(30, 30, 35, 0.9) inset !important;
  -webkit-text-fill-color: #e0e0e5 !important;
  transition: background-color 5000s ease-in-out 0s;
}

/* 禁用Chrome的自动填充蓝色背景 */
input:-webkit-autofill {
  background-clip: content-box !important;
}

/* 禁用浏览器记住密码的弹窗 */
input {
  /* 禁用自动完成 */
  autocomplete: "off";
  /* 禁用自动填充 */
  -webkit-autofill: "off";
}
/* 印记 */
.shopping-mall-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  outline: none;
  user-select: none;
  z-index: 2;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
  animation: rotate 15s linear infinite;
  animation-play-state: paused;
  opacity: 0.5;
  margin-left: 5px;
}
.shopping-mall:hover .shopping-mall-icon{
  opacity: 1;
}
/* 禁用Edge/IE的明黄色自动填充背景 */
input:-ms-input-placeholder {
  opacity: 1;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
}

.main-content {
  padding-left: 60px; /* 与导航栏宽度相同 */
  min-height: 80vh;
  width: 100%;
  margin-top: 30px;
  box-sizing: border-box;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .main-content {
    padding-left: 0;
    padding-bottom: 50px; /* 为底部导航留空间 */
    padding-top: 50px; /* 为顶部栏留出空间 */
  }
}

.ceil-bar{
  position: fixed;
  top: 20px;
  left: 5vw;
  width: 60vw;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: start;
  /* background: rgba(0, 0, 0, 0.5); */
  /* backdrop-filter: blur(10px); */
}
/* 金币盒样式 */
.money-box {
  z-index: 1000;
  width: 110px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  color: rgba(255, 255, 255, 0.9);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: 0 15px;
  margin: 0;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
  opacity: 0.7;
  transition: all 0.3s ease;
  cursor: pointer;
  /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); */
}

.money-box:hover {
  opacity: 1;
}

.coin-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
}

.coin-count {
  font-family: 'Arial', sans-serif;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  transition: transform 0.3s ease, text-shadow 0.3s ease;
  position: relative;
}

.saving-indicator {
  position: absolute;
  top: -2px;
  right: -10px;
  opacity: 0.8;
}

.saving-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #00ff00;
  animation: blink 0.8s infinite alternate;
}

.error-indicator {
  position: absolute;
  top: -2px;
  right: -8px;
  color: #ff5252;
  font-size: 0.8em;
  font-weight: bold;
}

.coin-animate {
  transform: scale(1.2);
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
}

.money-box::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
  animation: soft-breath 6s ease-in-out infinite;
  z-index: -1;
  filter: blur(3px);
  pointer-events: none;
}

.money-box::after {
  content: '';
  position: absolute;
  width: 140%;
  height: 140%;
  border-radius: 20px;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%);
  animation: soft-breath-outer 6s ease-in-out infinite 0.5s;
  z-index: -2;
  filter: blur(5px);
  pointer-events: none;
}

.money-box:hover {
  cursor: pointer;
  /* transform: translateY(-2px); */
}

@media (min-width: 1245px) {
  .money-box {
    width: 110px;
    height: 48px;
    font-size: 24px;
  }
  
  .coin-icon {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .money-box {
    left: 70px;
    top: 15px;
  }
}

@media (max-width: 480px) {
  .money-box {
    left: 60px;
    top: 10px;
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

@keyframes soft-breath {
  0% {
    opacity: 0.3;
    transform: scale(1);
    filter: brightness(0.8) blur(3px);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
    filter: brightness(1.2) blur(3px);
  }
  100% {
    opacity: 0.3;
    transform: scale(1);
    filter: brightness(0.8) blur(3px);
  }
}

@keyframes soft-breath-outer {
  0% {
    opacity: 0.2;
    transform: scale(1);
    filter: brightness(0.8) blur(5px);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3);
    filter: brightness(1.1) blur(5px);
  }
  100% {
    opacity: 0.2;
    transform: scale(1);
    filter: brightness(0.8) blur(5px);
  }
}

.container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 1245px) {
  .container {
    max-width: 1000px;
    padding: 30px;
  }

  .userRepeat {
    margin-bottom: 30px;
  }

  .userRepeat input {
    max-width: 450px;
    padding: 12px 20px;
    font-size: 18px;
    border-radius: 25px;
  }

  .circle-btn {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .list-selector {
    margin: 10px 0 30px;
    gap: 16px;
  }

  .list-btn {
    padding: 12px 24px;
    font-size: 16px;
    border-radius: 25px;
    opacity: 0.35;

    transition: opacity 0.2s ease-in-out;
  }

  .list-btn:hover {
    opacity: 1;
  }

  .progress {
    margin-top: 10px;
    font-size: 16px;
    opacity: 0.7;
  }

  

  .tag, .count {
    font-family:'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
    font-size: 16px;
  }
}

/* 列表选择器样式 */
.list-selector {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin: 10px 0 24px;
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

.list-btn {
  font-family: serif;
  padding: 8px 17px;
  border: none;
  border-radius: 19px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 17px;
  width: calc((100% - 24px) / 3);
  min-width: 96px;
  max-width: 193px;
  backdrop-filter: blur(4px);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.list-btn.active {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

.loading, .error {
  text-align: center;
  padding: 20px;
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.error {
  color: #ff6b6b;
}

.content {
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.content.visible {
  opacity: 1;
  transform: translateY(0);
}

.navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.random-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.progress {
  text-align: center;
  margin-top: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0.7;
}

.tag {
  /* background: rgba(255, 255, 255, 0.1); */
  color: white;
  font-family: serif;
  /* padding: 4px 12px; */
  /* border-radius: 16px; */
  font-size: 14px;
  backdrop-filter: blur(4px);
}

.count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-family:'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.userRepeat {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.userRepeat .circle-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
  padding: 0;
  margin: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  outline: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.userRepeat .circle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.userRepeat .circle-btn:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.15);
}

.userRepeat input {
  width: 100%;
  max-width: 400px;
  padding: 10px 15px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
  text-align: center;
  font-weight: 800;
}

.userRepeat input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

.userRepeat input::placeholder {
  font-family: serif;
  color: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .list-btn {
    width: calc((100% - 12px) / 2);
  }

  .userRepeat input {
    max-width: 350px;
  }
}

@media (max-width: 480px) {
  .list-btn {
    width: 100%;
    max-width: none;
  }

  .userRepeat {
    gap: 5px;
  }

  .userRepeat input {
    max-width: 220px;
    font-size: 12px;
  }

  .circle-btn {
    width: 32px;
    height: 32px;
  }
}

/* 功能按钮区域样式 */
.function-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.button-group {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  z-index: 100;
}

.upload-btn {
  font-family: serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 14px;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  opacity: 0.7;
  height: 20px;
}

.upload-btn::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  animation: btn-breath 4s ease-in-out infinite;
  z-index: -1;
  filter: blur(2px);
}

.upload-btn::after {
  content: '';
  position: absolute;
  width: 140%;
  height: 140%;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%);
  animation: btn-breath-outer 4s ease-in-out infinite 0.5s;
  z-index: -2;
  filter: blur(4px);
}

.upload-btn:hover {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  opacity: 1;
}

.upload-btn:active {
  transform: scale(0.95);
}

.upload-btn i {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.upload-btn:hover i {
  color: rgba(255, 255, 255, 0.95);
}

@keyframes btn-breath {
  0% {
    opacity: 0.3;
    transform: scale(1);
    filter: brightness(0.8) blur(2px);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
    filter: brightness(1.2) blur(2px);
  }
  100% {
    opacity: 0.3;
    transform: scale(1);
    filter: brightness(0.8) blur(2px);
  }
}

@keyframes btn-breath-outer {
  0% {
    opacity: 0.2;
    transform: scale(1);
    filter: brightness(0.8) blur(4px);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.15);
    filter: brightness(1.1) blur(4px);
  }
  100% {
    opacity: 0.2;
    transform: scale(1);
    filter: brightness(0.8) blur(4px);
  }
}

/* Media queries for button group */
@media (min-width: 1025px) and (max-width: 1440px) {
  .button-group {
    right: 35px;
    bottom: 35px;
    gap: 12px;
  }

  .upload-btn {
    padding: 10px 20px;
    font-size: 16px;
    border-radius: 22px;
  }

  .upload-btn i {
    font-size: 18px;
  }
}

@media (min-width: 1441px) and (max-width: 1920px) {
  .button-group {
    right: 50px;
    bottom: 50px;
    gap: 15px;
  }

  .upload-btn {
    padding: 12px 24px;
    font-size: 18px;
    border-radius: 25px;
  }

  .upload-btn i {
    font-size: 20px;
  }
}

@media (max-width: 1999px) {
  .button-group {
    right: 14px;
    bottom: 14px;
    gap: 8px;
  }

  .upload-btn {
    padding: 7px 14px;
    font-size: 12px;
    border-radius: 14px;
  }

  .upload-btn i {
    font-size: 14px;
  }
}

.todolist {
  /* position: absolute; */
  /* left: 90px; */
  /* margin-top: 0px; */
  margin-left: 20px;
  z-index: 1000;
}

.todolist-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  outline: none;
  user-select: none;
  z-index: 2;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
  animation: rotate 15s linear infinite;
  animation-play-state: paused;
  opacity: 0.5;
}

.todolist-icon:hover {
  opacity: 1;
}

.todolist-icon::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
  animation: soft-breath 6s ease-in-out infinite;
  z-index: -1;
  filter: blur(3px);
  pointer-events: none;
}

.todolist-icon::after {
  content: '';
  position: absolute;
  width: 140%;
  height: 140%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%);
  animation: soft-breath-outer 6s ease-in-out infinite 0.5s;
  z-index: -2;
  filter: blur(5px);
  pointer-events: none;
}

.todolist-icon:active {
  transform: scale(0.9);
}

@media (min-width: 1245px) {
  .todolist-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .todolist {
    left: 70px;
    top: 15px;
  }
}

@media (max-width: 480px) {
  .todolist {
    left: 55px;
    top: 10px;
  }
  
  .todolist-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

/* 响应式布局 */
/* 超小屏幕（手机） */
@media (max-width: 480px) {
  .container {
    padding: 10px;
  }

  .list-btn {
    width: 100%;
    max-width: none;
  }

  .userRepeat {
    gap: 5px;
  }

  .userRepeat input {
    max-width: 220px;
    font-size: 12px;
  }

  .circle-btn {
    width: 32px;
    height: 32px;
  }
  
  .todolist {
    left: 55px;
    top: 10px;
  }
  
  .todolist-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
  
  .button-group {
    right: 10px;
    bottom: 10px;
  }
}

/* 小屏幕（平板） */
@media (min-width: 481px) and (max-width: 768px) {
  .container {
    padding: 15px;
  }

  .list-btn {
    width: calc((100% - 12px) / 2);
  }

  .userRepeat input {
    max-width: 320px;
  }
  
  .todolist {
    left: 70px;
    top: 15px;
  }
  
  .button-group {
    right: 15px;
    bottom: 15px;
    gap: 8px;
  }

  .upload-btn {
    padding: 8px 16px;
    font-size: 14px;
    min-width: 100px;
  }
}

/* 中等屏幕（笔记本电脑） */
@media (min-width: 769px) and (max-width: 1024px) {
  .container {
    max-width: 800px;
    padding: 20px;
  }
  
  .userRepeat input {
    max-width: 380px;
  }
  
  .list-selector {
    margin: 10px 0 20px;
  }
  
  .list-btn {
    padding: 7px 13px;
    font-size: 10px;
  }
}

/* 大屏幕（桌面） */
@media (min-width: 1025px) and (max-width: 1440px) {
  .container {
    max-width: 1100px;
    padding: 35px;
  }

  .userRepeat {
    margin-bottom: 45px;
  }

  .userRepeat input {
    max-width: 600px;
    padding: 17px 30px;
    font-size: 20px;
    border-radius: 28px;
  }

  .circle-btn {
    width: 60px;
    height: 60px;
    font-size: 26px;
    border-radius: 30px;
  }
  
  .list-selector {
    margin: 10px 0 40px;
    gap: 20px;
  }
  
  .list-btn {
    padding: 11px 20px;
    font-size: 16px;
    border-radius: 20px;
    min-width: 107px;
  }
  
  .progress {
    margin-top: 20px;
    font-size: 16px;
    opacity: 0.7;
  }

  .tag, .count {
    font-size: 18px;
  }
  
  .money-box {
    width: 150px;
    height: 60px;
    font-size: 28px;
    border-radius: 30px;
  }
  
  .coin-icon {
    font-size: 28px;
  }
  
  .todolist-icon {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }
  
  .button-group {
    right: 35px;
    bottom: 35px;
    gap: 18px;
  }

  .upload-btn {
    padding: 16px 28px;
    font-size: 14px;
  }
}

/* 超大屏幕（大型桌面） */
@media (min-width: 1441px) and (max-width: 1920px) {
  .container {
    max-width: 1400px;
    padding: 50px;
  }

  .userRepeat {
    margin-bottom: 50px;
  }

  .userRepeat input {
    max-width: 720px;
    padding: 21px 36px;
    font-size: 26px;
    border-radius: 36px;
  }

  .circle-btn {
    width: 72px;
    height: 72px;
    font-size: 30px;
    border-radius: 36px;
  }

  .list-selector {
    margin: 10px 0 50px;
    gap: 25px;
  }

  .list-btn {
    padding: 14px 25px;
    font-size: 17px;
    border-radius: 28px;
    min-width: 125px;
    opacity: 0.4;
  }
  
  .list-btn:hover {
    opacity: 1;
  }

  .progress {
    margin-top: 22px;
    font-size: 16px;
    opacity: 0.7;
  }

  .tag, .count {
    font-size: 18px;
  }
  
  .money-box {
    width: 180px;
    height: 70px;
    font-size: 34px;
    border-radius: 35px;
  }
  
  .coin-icon {
    font-size: 34px;
  }
  
  .todolist-icon {
    width: 70px;
    height: 70px;
    font-size: 34px;
  }
  
  .button-group {
    right: 50px;
    bottom: 50px;
    gap: 22px;
  }

  .upload-btn {
    padding: 20px 40px;
    font-size: 14px;
    border-radius: 30px;
  }

  .upload-btn i {
    font-size: 14px;
  }
}

/* 超大屏幕 4K */
@media (min-width: 1921px) and (max-width: 2560px) {
  .container {
    max-width: 1800px;
    padding: 60px;
  }

  .userRepeat {
    margin-bottom: 65px;
  }

  .userRepeat input {
    max-width: 900px;
    padding: 27px 45px;
    font-size: 30px;
    border-radius: 45px;
  }

  .circle-btn {
    width: 90px;
    height: 90px;
    font-size: 38px;
    border-radius: 45px;
  }

  .list-selector {
    margin: 10px 0 65px;
    gap: 30px;
  }

  .list-btn {
    padding: 16px 30px;
    font-size: 18px;
    border-radius: 31px;
    min-width: 145px;
    opacity: 0.4;
  }
  
  .list-btn:hover {
    opacity: 1;
  }

  .progress {
    margin-top: 28px;
    font-size: 16px;
    opacity: 0.7;
  }

  .tag, .count {
    font-size: 18px;
  }
  
  .money-box {
    width: 200px;
    height: 80px;
    font-size: 38px;
    border-radius: 40px;
  }
  
  .coin-icon {
    font-size: 38px;
  }
  
  .todolist-icon {
    width: 85px;
    height: 85px;
    font-size: 42px;
  }
  
  .button-group {
    right: 65px;
    bottom: 65px;
    gap: 32px;
  }

  .upload-btn {
    padding: 24px 48px;
    font-size: 16px;
    border-radius: 40px;
  }

  .upload-btn i {
    font-size: 16px;
  }
}

/* 超出2K */
@media (min-width: 2561px) {
  .container {
    max-width: 1400px;
    padding: 50px;
  }

  .userRepeat {
    margin-bottom: 50px;
  }

  .userRepeat input {
    max-width: 650px;
    padding: 19px 30px;
    font-size: 22px;
    border-radius: 35px;
  }

  .circle-btn {
    width: 64px;
    height: 64px;
    font-size: 28px;
    border-radius: 32px;
  }

  .list-selector {
    margin: 10px 0 50px;
    gap: 25px;
  }

  .list-btn {
    padding: 25px 49px;
    font-size: 28px;
    border-radius: 48px;
    min-width: 193px;
  }

  .progress {
    margin-top: 20px;
    font-size: 16px;
    opacity: 0.7;
  }

  .tag, .count {
    font-size: 20px;
  }
  
  .money-box {
    width: 150px;
    height: 60px;
    font-size: 30px;
    border-radius: 30px;
  }
  
  .coin-icon {
    font-size: 30px;
  }
  
  .todolist-icon {
    width: 64px;
    height: 64px;
    font-size: 32px;
  }
  
  .button-group {
    right: 50px;
    bottom: 50px;
    gap: 25px;
  }

  .upload-btn {
    padding: 18px 36px;
    font-size: 16px;
    border-radius: 30px;
  }

  .upload-btn i {
    font-size: 17px;
  }
}

/* 添加userRepeat和navigation高度减少的媒体查询 */
@media (max-width: 1999px) {
  .userRepeat {
    margin-bottom: 14px;
  }
  
  .userRepeat input {
    padding: 7px 10px;
  }
  
  .userRepeat .circle-btn {
    width: 25px;
    height: 25px;
    border-radius: 13px;
  }
  
  .navigation {
    gap: 14px;
  }
  
  /* 大屏幕（桌面） */
  @media (min-width: 1025px) and (max-width: 1440px) {
    .userRepeat {
      margin-bottom: 32px;
    }

    .userRepeat input {
      padding: 14px 21px;
      font-size: 16px;
    }

    .circle-btn {
      width: 42px;
      height: 42px;
      border-radius: 21px;
      font-size: 18px;
    }
  }
  
  /* 超大屏幕（大型桌面） */
  @media (min-width: 1441px) and (max-width: 1920px) {
    .userRepeat {
      margin-bottom: 35px;
    }

    .userRepeat input {
      padding: 13px 25px;
      font-size: 18px;
    }

    .circle-btn {
      width: 50px;
      height: 50px;
      border-radius: 25px;
      font-size: 21px;
    }
  }

  @media (min-width: 1910px) and (max-width: 2560px) {
    .main-content {
      margin-top: 80px;
    }
  }

  /* 添加按钮大小减少的媒体查询 */
  .ceil-bar {
    padding: 7px;
  }

  .ceil-bar .button-group button {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }

  .button-group {
    gap: 7px;
  }

  .button-group button {
    width: 28px;
    height: 28px;
    font-size: 11px;
    padding: 4px;
  }

  .circle-btn {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }

  .list-btn {
    padding: 6px 11px;
    font-size: 16px;
    min-width: 67px;
    max-width: 136px;
  }
}

.todolist-icon, .shopping-mall-icon {
  width: 60px;
  height: 60px;
  font-size: 28px;
  
}

/* 超大屏幕（大型桌面） */
@media (min-width: 1441px) and (max-width: 1920px) {
  .todolist-icon, .shopping-mall-icon {
    width: 70px;
    height: 70px;
    font-size: 34px;
  }
}

/* 超大屏幕 4K */
@media (min-width: 1921px) and (max-width: 2560px) {
  .todolist-icon, .shopping-mall-icon {
    width: 85px;
    height: 85px;
    font-size: 42px;
  }
}

/* 超出2K */
@media (min-width: 2561px) {
  .todolist-icon, .shopping-mall-icon {
    width: 64px;
    height: 64px;
    font-size: 32px;
  }
}
</style>
