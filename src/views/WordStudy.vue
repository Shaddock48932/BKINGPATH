<template>
  <div class="word-study-page">
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, onBeforeUnmount, inject } from 'vue'
import WordCard from '../components/WordCard.vue'
import { useRoute } from 'vue-router'

// 获取当前路由
const route = useRoute()

// 注入父组件提供的方法和状态
const playNextSound = inject('playNextSound')
const playButtonSound = inject('playButtonSound')
const playTouchSound = inject('playTouchSound')
const addCoins = inject('addCoins')

// 可用的单词列表文件
const wordLists = [
{ name: 'UE常用词汇', file: './src/data/uebase.json' },
  { name: '游戏词汇', file: './src/data/gamebase.json' },
  { name: '计算机专业词汇', file: './src/data/cs.json' },
  { name: '前端', file: './src/data/web.json' },
  { name: 'Java', file: './src/data/javause.json' },
  { name: '数据结构', file: './src/data/data_structure.json' },
  { name: '日常易错词', file: './src/data/dailyuse.json' },

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

/**
 * 检查当前是否在单词学习页面
 * 主页面可能是 /, /word-study, 或空路径
 */
const isWordStudyActive = () => {
  // 主页面的路径可能是 / 或 /word-study 或空
  return route.path === '/' || 
         route.path === '/word-study' || 
         route.path === '' || 
         route.name === 'WordStudy' || 
         route.name === 'Home';
}

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

// 处理键盘事件
const handleKeyPress = (event) => {
  // 首先检查当前路由是否在单词学习页面（主页面）
  if (!isWordStudyActive()) {
    return
  }
  
  // 如果用户正在输入框中，只响应特定快捷键
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    // 如果用户在WordStudy页面的输入框中，允许Enter快捷键
    if (document.querySelector('.userRepeat input') === event.target) {
      if (event.key === 'Enter') {
        showRandomWord();
        event.preventDefault(); // 防止表单提交
        return;
      }
    }
    
    // 其他输入框不拦截按键
    return;
  }
  
  // 在单词学习页面非输入框情况下的快捷键处理
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

// 初始加载
onMounted(() => {
  loadWordsList(currentList.value.file)
  
  // 添加键盘事件监听，但在handleKeyPress内部检查路由
  window.addEventListener('keydown', handleKeyPress)
})

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.word-study-page {
  padding: 10px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
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
  color: white;
  font-family: serif;
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

.content-fade-enter-active,
.content-fade-leave-active {
  transition: all 0.3s ease;
}

.content-fade-enter-from,
.content-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
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

/* 响应式样式 */
@media (max-width: 768px) {
  .word-study-page {
    padding: 5px;
  }

  .list-btn {
    width: calc((100% - 12px) / 2);
  }

  .userRepeat input {
    max-width: 320px;
  }
}

@media (max-width: 480px) {
  .word-study-page {
    padding: 0px;
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
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .word-study-page {
    max-width: 1100px;
    padding: 0px;
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
    margin: 50px 0 40px;
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
    font-size: 20px;
    opacity: 0.7;
  }

  .tag, .count {
    font-size: 20px;
  }
}

@media (min-width: 1441px) and (max-width: 1920px) {
  .word-study-page {
    max-width: 1400px;
    padding: 0px;
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
    margin: 65px 0 50px;
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
    font-size: 16px;
    opacity: 0.6;
  }
}

/* 小于2000px的屏幕调整 */
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
  
  .list-btn {
    padding: 6px 11px;
    font-size: 16px;
    min-width: 67px;
    max-width: 136px;
  }
  
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
}
</style> 