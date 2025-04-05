<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import WordCard from './components/WordCard.vue'
import BackgroundUploader from './components/BackgroundUploader.vue'
import MusicPlayer from './components/MusicPlayer.vue'

// 可用的单词列表文件
const wordLists = [
  { name: '计算机专业词汇', file: '../src/data/cs.json' },
  { name: '前端', file: '../src/data/web.json' },
  { name: 'Java', file: '../src/data/javause.json' },
  { name: '数据结构', file: '../src/data/data_structure.json' },
  { name: '日常易错词', file: '../src/data/dailyuse.json' },
  { name: 'UE常用词汇', file: '../src/data/uebase.json' },
  { name: 'C++', file: '../src/data/cplusplus.json' },
  { name: '游戏词汇', file: '../src/data/gamebase.json' },
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
})

// 监听用户输入
watch(() => userInput.value, (newValue) => {
  const input = document.querySelector('.userRepeat input')
  if (!input) return
  
  if (newValue === currentWord.value.word) {
    input.style.color = 'white'
  } else {
    input.style.color = '#ff6b6b'
  }
})

// 初始加载
onMounted(() => {
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
</script>

<template>
  <div class="container">
    <MusicPlayer ref="musicPlayerRef" />
    <Transition name="fade" mode="out-in">
      <div v-if="isLoading" class="loading" key="loading">
        <i class="fas fa-spinner fa-spin"></i> 加载中...
      </div>
      <div v-else-if="errorMessage" class="error" key="error">
        <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
      </div>
      <div v-else class="content" key="content" :class="{ 'visible': isContentVisible }">
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
    </Transition>

    <!-- 单词列表选择器 -->
    <div class="list-selector">
      <button 
        v-for="list in wordLists" 
        :key="list.file"
        class="list-btn"
        :class="{ 'active': currentList === list }"
        @click="currentList = list"
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
        <i class="fas fa-music"></i> 添加小曲
      </label>
      <!-- 背景上传器 -->
      <BackgroundUploader />
    </div>
  </div>
</template>

<style scoped>
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

</style>
