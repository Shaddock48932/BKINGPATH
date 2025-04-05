<script setup>
/**
 * WordCard.vue
 * 单词卡片组件，用于显示单词、翻译和发音功能
 */

import { ref, watch, onBeforeUnmount } from 'vue'

// 组件属性定义
const props = defineProps({
  // 要显示和播放的单词
  word: {
    type: String,
    required: true
  },
  // 单词的翻译
  translation: {
    type: String,
    required: true
  },
  // 语音合成使用的语言代码
  // 例如：'en-US' 美式英语, 'zh-CN' 中文, 'ja-JP' 日语
  lang: {
    type: String,
    default: 'en-US'
  },
  // 音量大小，范围 0-1
  volume: {
    type: Number,
    default: 1
  }
})

// 跟踪语音播放状态
const isPlaying = ref(false)
// 控制翻译显示状态
const showTranslation = ref(false)
// 音频实例
const audio = new Audio()
// 标记是否正在使用Web Speech
const isUsingSpeech = ref(false)
// 标记是否已经开始尝试播放有道音频
const isYoudaoAttempted = ref(false)
// 设置初始音量
audio.volume = props.volume

// 语音合成实例
const synth = window.speechSynthesis
// 可用的语音列表
const voices = ref([])

// 获取可用的语音列表
const loadVoices = () => {
  voices.value = synth.getVoices().filter(voice => voice.lang.startsWith('en'))
}

// 初始化语音列表
loadVoices()
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices
}

/**
 * 使用Web Speech API播放发音
 */
const playWebSpeech = async (text) => {
  // 创建语音合成话语
  const utterance = new SpeechSynthesisUtterance(text)
  
  // 设置语音参数
  utterance.lang = props.lang
  utterance.rate = 1.0  // 语速
  utterance.pitch = 1.0 // 音调
  
  // 如果有可用的英语语音，使用第一个
  if (voices.value.length > 0) {
    utterance.voice = voices.value[0]
  }

  // 播放语音
  synth.speak(utterance)
  isPlaying.value = true

  // 监听播放结束
  return new Promise((resolve) => {
    utterance.onend = () => {
      isPlaying.value = false
      resolve()
    }
    utterance.onerror = () => {
      isPlaying.value = false
      resolve()
    }
  })
}

/**
 * 播放单词发音
 */
const playPronunciation = async () => {
  if (isPlaying.value) {
    audio.pause()
    synth.cancel() // 停止语音合成
    audio.currentTime = 0
    isPlaying.value = false
    isUsingSpeech.value = false
    isYoudaoAttempted.value = false
    return
  }

  try {
    // 标记开始尝试播放有道音频
    isYoudaoAttempted.value = true
    // 首先尝试使用有道词典API
    audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(props.word)}&type=2`
    await audio.play()
  } catch (error) {
    // 只有在没有使用Web Speech的情况下才尝试使用它
    if (!isUsingSpeech.value) {
      console.error('有道API播放失败，尝试使用Web Speech:', error)
      try {
        isUsingSpeech.value = true
        // 使用Web Speech API作为备用
        await playWebSpeech(props.word)
      } catch (speechError) {
        console.error('Web Speech播放失败:', speechError)
        isPlaying.value = false
        isUsingSpeech.value = false
      }
    }
  } finally {
    isYoudaoAttempted.value = false
  }
}

// 设置音频事件监听
audio.onplay = () => {
  isPlaying.value = true
  isUsingSpeech.value = false // 确保使用有道API时不会触发Web Speech
}

audio.onended = () => {
  isPlaying.value = false
  isUsingSpeech.value = false
  audio.currentTime = 0
}

audio.onerror = async (error) => {
  // 只有在已经尝试过有道API且没有使用Web Speech的情况下才尝试使用Web Speech
  if (isYoudaoAttempted.value && !isUsingSpeech.value) {
    console.error('有道获取失败，尝试使用Web Speech:', {
      error,
      src: audio.src,
      errorCode: audio.error?.code,
      errorMessage: audio.error?.message
    })
    
    try {
      isUsingSpeech.value = true
      await playWebSpeech(props.word)
    } catch (speechError) {
      console.error('Web Speech播放失败:', speechError)
      isPlaying.value = false
      isUsingSpeech.value = false
    }
  }
}

/**
 * 切换翻译显示状态
 */
const toggleTranslation = () => {
  showTranslation.value = !showTranslation.value
}

// 设置音量的方法
const setVolume = (value) => {
  const vol = Math.max(0, Math.min(1, value)) // 确保音量在 0-1 之间
  audio.volume = vol
}

// 暴露方法给父组件
defineExpose({
  toggleTranslation,
  setVolume,
  playPronunciation
})

// 监听单词变化，自动播放新单词的语音
watch(() => props.word, (newWord, oldWord) => {
  if (newWord && newWord !== oldWord) {
    // 重置所有状态
    audio.pause()
    audio.currentTime = 0
    isPlaying.value = false
    // // showTranslation.value = false
    // 短暂延迟后播放，让视觉变化先完成
    playPronunciation()
  }
}, { immediate: true })

// 监听音量属性变化
watch(() => props.volume, (newVolume) => {
  setVolume(newVolume)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  audio.pause()
  synth.cancel() // 停止所有语音合成
  audio.src = ''
  isPlaying.value = false
  isUsingSpeech.value = false
  isYoudaoAttempted.value = false
})
</script>

<template>
  <!-- 单词卡片容器 -->
  <div class="word-card">
    <div class="content-wrapper" @dblclick="toggleTranslation">
      <!-- 显示单词文本 -->
      <div class="word">{{ props.word }}</div>
      <!-- 翻译文本，根据状态显示/隐藏 -->
      <div class="translation" :class="{ 'show': showTranslation }">
        {{ props.translation }}
      </div>
    </div>
    <div class="buttons-wrapper">
      <!-- 发音按钮：播放时显示停止图标 -->
      <button class="btn" @click="playPronunciation" :class="{ 'playing': isPlaying }"
        :title="isPlaying ? '双击Ctrl' : '双击Ctrl'">
        <i :class="isPlaying ? 'fas fa-stop' : 'fas fa-volume-up'">音</i>
      </button>
      <!-- 显示翻译按钮 -->
      <button class="btn" @click="toggleTranslation" :class="{ 'active': showTranslation }" title="双击Shift">
        <i class="fas fa-language">{{ showTranslation ? '显' : '隐' }}</i>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 按钮样式重置 */
button {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  line-height: normal;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  outline: none;
}

button::-moz-focus-inner {
  border: 0;
}

/* 卡片容器样式 */
.word-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  margin: 10px auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s;
  min-height: 100px;
}

.content-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* 单词文本样式 */
.word {
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
  font-size: 32px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  word-break: break-word;
}

/* 翻译文本样式 */
.translation {
  font-weight: 300;
  font-size: 18px;
  color: #666;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-top: 8px;
  position: relative;
  pointer-events: none;
  word-break: break-word;
}

.translation.show {
  opacity: 1;
  pointer-events: auto;
}

/* 按钮容器 */
.buttons-wrapper {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 按钮基础样式 */
.btn {
  width: 36px;
  height: 36px;
  border: 1px solid #666;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  background: transparent;
  transition: all 0.2s ease;
  font-size: 16px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
}

/* 播放按钮状态 */
.btn.playing {
  color: #dba944;
}

.btn.playing:hover {
  background: rgba(244, 67, 54, 0.1);
}

/* 翻译按钮状态 */
.btn.active {}

.btn.active:hover {
  background: rgba(33, 150, 243, 0.1);
}

@media (max-width: 768px) {
  .word-card {
    padding: 20px;
    margin: 5px auto;
  }

  .word {
    font-size: 28px;
  }

  .translation {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .word-card {
    padding: 16px;
    gap: 16px;
  }

  .word {
    font-size: 24px;
  }

  .translation {
    font-size: 14px;
  }

  .btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}

@media (min-width: 1245px) {
  .word-card {
    max-width: 600px;
    padding: 25px;
    gap: 20px;
  }

  .content-wrapper {
    gap: 12px;
    padding: 12px;
    min-height: 130px;
  }

  .word {
    font-size: 42px;
  }

  .translation {
    font-size: 22px;
    margin-top: 8px;
  }

  .buttons-wrapper {
    gap: 20px;
  }

  .btn {
    width: 44px;
    height: 44px;
    font-size: 18px;
    border-radius: 10px;
  }
}
</style>