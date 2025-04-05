<script setup>
import { ref, onMounted, watch, onBeforeUnmount, provide } from 'vue'
import WordCard from './components/WordCard.vue'
import BackgroundUploader from './components/BackgroundUploader.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import NoteBook from './components/NoteBook.vue'
import TodoList from './components/TodoList.vue'

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
{ name: '游戏词汇', file: '../src/data/gamebase.json' },
  { name: '计算机专业词汇', file: '../src/data/cs.json' },
  { name: '前端', file: '../src/data/web.json' },
  { name: 'Java', file: '../src/data/javause.json' },
  { name: '数据结构', file: '../src/data/data_structure.json' },
  { name: '日常易错词', file: '../src/data/dailyuse.json' },
  { name: 'UE常用词汇', file: '../src/data/uebase.json' },
  { name: 'C++', file: '../src/data/cplusplus.json' },

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
  nextAudio.currentTime = 0
  nextAudio.play()
}

const playButtonSound = () => {
  buttonAudio.currentTime = 0
  buttonAudio.play()
}

const playTouchSound = () => {
  touchAudio.currentTime = 0
  touchAudio.play()
}

// 将音效函数提供给子组件
provide('playNextSound', playNextSound)
provide('playButtonSound', playButtonSound)
provide('playTouchSound', playTouchSound)
provide('setSoundVolume', setSoundVolume)
provide('soundVolume', soundVolume)

// 将addCoins函数提供给子组件
provide('addCoins', addCoins)

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
  playNextSound() // 播放下一个音效
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

// 初始加载
onMounted(() => {
  // 从本地存储加载音量设置
  const savedVolume = localStorage.getItem('soundVolume')
  if (savedVolume !== null) {
    setSoundVolume(parseFloat(savedVolume))
  }
  
  // 从服务器加载金币数据
  loadCoinsFromServer();
  
  loadWordsList(currentList.value.file)
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyPress)
})

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyPress)
})

// 处理键盘事件
const handleKeyPress = (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    // showRandomWord()
  } else if (event.key === 'Enter') {
    showRandomWord()
  } else if (event.key === 'Shift') {
    const now = Date.now()
    if (now - lastShiftTime.value < 300) { // 300毫秒内的双击
      // 触发WordCard组件的toggleTranslation方法
      wordCardRef.value?.toggleTranslation()
    }
    lastShiftTime.value = now
  } else if (event.key === 'Control') {
    const now = Date.now()
    if (now - lastCtrlTime.value < 300) { // 300毫秒内的双击
      // 触发WordCard组件的播放发音方法
      wordCardRef.value?.playPronunciation()
    }
    lastCtrlTime.value = now
  }
}

// 处理音乐上传
const handleMusicUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('audio/')) {
    alert('请上传音频文件')
    return
  }

  // 创建文件URL
  const url = URL.createObjectURL(file)
  // 获取文件名（去除扩展名）
  const name = file.name.replace(/\.[^/.]+$/, "")
  
  // 添加到音乐列表
  if (musicPlayerRef.value) {
    const added = musicPlayerRef.value.addMusic(name, url)
    if (!added) {
      alert('已存在同名音乐')
      URL.revokeObjectURL(url)
    }
  }

  // 清空input，允许重复上传同一文件
  event.target.value = ''
}

// todolist点击处理
const todoClickTimer = ref(null)
const showTodoList = ref(false)
const isTodoRotating = ref(false)
const todoListRef = ref(null)

// 简化todolist点击处理逻辑
const handleTodoClick = () => {
  // 直接切换显示状态
  showTodoList.value = !showTodoList.value
}

const handleTodoDoubleClick = (e) => {
  // 双击时阻止触发单击事件
  e.stopPropagation()
  isTodoRotating.value = !isTodoRotating.value
  playTouchSound()
}
</script>

<template>
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
  </div>
  
  <TodoList v-model:showTodoList="showTodoList" ref="todoListRef" />
  <NoteBook />
  <MusicPlayer ref="musicPlayerRef" />
  
  <div class="container">
    <Transition name="fade" mode="out-in">
      <template v-if="isLoading">
        <div class="loading" key="loading">
          <i class="fas fa-spinner fa-spin"></i> 加载中...
        </div>
      </template>
      <template v-else-if="errorMessage">
        <div class="error" key="error">
          <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
        </div>
      </template>
      <template v-else>
        <transition name="content-fade" mode="out-in">
          <div class="content" key="content" :class="{ 'visible': isContentVisible }">
            <div class="userRepeat">
              <button class="circle-btn" @click="showRandomWord" title="单击Enter"></button>
              <input 
                type="text" 
                v-model="userInput"
                placeholder="自由的代价是永远的警惕。——《C Primer Plus》" 
              />
              <button class="circle-btn" @click="showRandomWord" title="单击Enter"></button>
            </div>
            <div class="navigation">
              <WordCard 
                ref="wordCardRef"
                :word="currentWord.word"
                :translation="currentWord.translation"
                lang="en-US"
              />
            </div>
            <div class="progress">
              <span class="tag" v-if="currentWord.tags && currentWord.tags.length > 0">
                {{ currentWord.tags[0] }}
              </span>
              <span class="count">{{ currentIndex + 1 }} / {{ wordsList.length }}</span>
            </div>
          </div>
        </transition>
      </template>
    </Transition>
    <!-- 单词列表选择器 -->
    <div class="list-selector">
      <button 
        v-for="list in wordLists" 
        :key="list.file"
        class="list-btn"
        :class="{ 'active': currentList === list }"
        @click="currentList = list; playButtonSound()"
      >
        {{ list.name }}
      </button>
    </div>

    <!-- 按钮组 -->
    <div class="button-group">
      <!-- 音乐上传按钮 -->
      <label class="upload-btn upload-btn-music">
        <input 
          type="file" 
          accept="audio/*" 
          @change="handleMusicUpload"
          style="display: none;"
        />
        <i class="fas fa-music" style="color: rgba(255, 255, 255, 0.6);"></i> 添加小曲
      </label>
      <!-- 背景上传器 -->
      <BackgroundUploader />
    </div>
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

/* 禁用Edge/IE的明黄色自动填充背景 */
input:-ms-input-placeholder {
  opacity: 1;
}
</style>

<style scoped>
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
    padding: 15px 20px;
    font-size: 20px;
    border-radius: 25px;
  }

  .circle-btn {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .list-selector {
    margin: 40px 0 30px;
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
  margin: 32px 0 24px;
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

.list-btn {
  font-family: serif;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  width: calc((100% - 24px) / 3);
  min-width: 100px;
  max-width: 200px;
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
    font-size: 14px;
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
  gap: 10px;
  z-index: 100;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
  width: fit-content;
  text-shadow: rgba(0, 0, 0, 0) 0px 0px 0px;
  transform: translateY(0px);
  /* min-width: 120px; */
}
.upload-btn-music{
  margin-bottom: 50px;
  font-family: serif;
  height: 20px;
  opacity: 0.7;
  backdrop-filter: blur(8px);
}
.upload-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.upload-btn i {
  font-size: 16px;
}

@media (min-width: 1245px) {
  .button-group {
    right: 30px;
    bottom: 30px;
    gap: 15px;
  }

  .upload-btn {
    padding: 12px 24px;
    font-size: 16px;
  }

  .upload-btn i {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
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

@media (max-width: 480px) {
  .button-group {
    right: 10px;
    bottom: 10px;
  }
}

@keyframes blink {
  0% { opacity: 0.2; }
  100% { opacity: 1; }
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
</style>
