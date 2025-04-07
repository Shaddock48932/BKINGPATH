<script setup>
/**
 * WordCard.vue
 * 单词卡片组件，用于显示单词、翻译和发音功能
 */

import { ref, watch, onBeforeUnmount } from 'vue'
import { showError } from '../utils/errorNotification'

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
const currentAudio = ref(null)
// 标记是否正在使用Web Speech
const isUsingSpeech = ref(false)
// 标记是否已经开始尝试播放有道音频
const isYoudaoAttempted = ref(false)
// 语音合成实例
const currentSynth = ref(window.speechSynthesis)

// 可用的语音列表
const voices = ref([])

// 获取可用的语音列表
const loadVoices = () => {
  voices.value = currentSynth.value.getVoices().filter(voice => voice.lang.startsWith('en'))
}

// 初始化语音列表
loadVoices()
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices
}

/**
 * 停止所有当前正在播放的音频
 */
const stopAllAudio = () => {
  // 停止有道音频
  if (currentAudio.value) {
    currentAudio.value.pause();
    currentAudio.value.currentTime = 0;
    currentAudio.value = null;
  }
  
  // 停止Web Speech
  if (currentSynth.value) {
    currentSynth.value.cancel();
  }
  
  // 重置状态
  isPlaying.value = false;
  isUsingSpeech.value = false;
  isYoudaoAttempted.value = false;
}

/**
 * 使用Web Speech API播放发音
 */
const playWebSpeech = async (text) => {
  if (isUsingSpeech.value) return;
  
  try {
    isUsingSpeech.value = true;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 设置语音参数
    utterance.lang = props.lang;
    utterance.rate = 1.0;  // 语速
    utterance.pitch = 1.0; // 音调
    
    // 如果有可用的英语语音，使用第一个
    if (voices.value.length > 0) {
      utterance.voice = voices.value[0];
    }

    // 确保停止之前的语音合成
    currentSynth.value.cancel();
    
    // 监听播放结束和错误
    utterance.onend = () => {
      isPlaying.value = false;
      isUsingSpeech.value = false;
      isYoudaoAttempted.value = false;
    };
    
    utterance.onerror = () => {
      showError('Web Speech播放失败。');
      isPlaying.value = false;
      isUsingSpeech.value = false;
      isYoudaoAttempted.value = false;
    };
    
    currentSynth.value.speak(utterance);
    isPlaying.value = true;
  } catch (error) {
    showError('播放失败，正在尝试Web Speech API音源。');
    if (!isUsingSpeech.value) {
      await playWebSpeech(props.word);
    }
  }
};

/**
 * 播放单词发音
 */
const playPronunciation = async () => {
  // 如果正在播放，停止所有音频
  if (isPlaying.value) {
    stopAllAudio();
    return;
  }

  try {
    // 标记开始尝试播放有道音频
    isYoudaoAttempted.value = true;
    
    // 创建新的音频实例
    const audio = new Audio();
    audio.volume = props.volume;
    
    // 设置音频事件
    audio.onplay = () => {
      isPlaying.value = true;
      isUsingSpeech.value = false;
    };
    
    audio.onended = () => {
      isPlaying.value = false;
      isUsingSpeech.value = false;
      if (audio === currentAudio.value) {
        currentAudio.value = null;
      }
    };
    
    audio.onerror = async () => {
      if (isYoudaoAttempted.value && !isUsingSpeech.value) {
        showError('有道发音获取失败，正在尝试使用Web Speech');
        await playWebSpeech(props.word);
      }
    };
    
    // 设置音频源并播放
    audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(props.word)}&type=2`;
    currentAudio.value = audio;
    await audio.play();
    
  } catch (error) {
    showError('播放失败，正在尝试备用发音源');
    if (!isUsingSpeech.value) {
      await playWebSpeech(props.word);
    }
  } finally {
    isYoudaoAttempted.value = false;
  }
};

/**
 * 切换翻译显示状态
 */
const toggleTranslation = () => {
  showTranslation.value = !showTranslation.value
}

// 设置音量的方法
const setVolume = (value) => {
  const vol = Math.max(0, Math.min(1, value)) // 确保音量在 0-1 之间
  if (currentAudio.value) {
    currentAudio.value.volume = vol;
  }
}

// 暴露方法给父组件
defineExpose({
  toggleTranslation,
  setVolume,
  playPronunciation
})

// 监听单词变化
watch(() => props.word, (newWord, oldWord) => {
  if (newWord && newWord !== oldWord) {
    // 停止所有当前播放的音频
    stopAllAudio();
    // 短暂延迟后播放新单词，让视觉变化先完成
    setTimeout(() => {
      playPronunciation();
    }, 100);
  }
}, { immediate: true });

// 监听音量属性变化
watch(() => props.volume, (newVolume) => {
  setVolume(newVolume)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  stopAllAudio();
});
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
  transition: 0.3s ease-in-out;
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
  border: 1px solid #cfcfcf;
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

/* 中等屏幕（笔记本电脑） */
@media (min-width: 769px) and (max-width: 1024px) {
  .word-card {
    max-width: 500px;
    padding: 22px;
    gap: 18px;
  }

  .content-wrapper {
    gap: 11px;
    padding: 11px;
    min-height: 115px;
  }

  .word {
    font-size: 38px;
  }

  .translation {
    font-size: 19px;
    margin-top: 8px;
  }

  .buttons-wrapper {
    gap: 18px;
  }

  .btn {
    width: 40px;
    height: 40px;
    font-size: 17px;
    border-radius: 9px;
  }
}

/* 大屏幕（桌面） */
@media (min-width: 1025px) and (max-width: 1440px) {
  .word-card {
    max-width: 720px;
    padding: 30px;
    gap: 24px;
    border-radius: 16px;
  }

  .content-wrapper {
    gap: 15px;
    padding: 15px;
    min-height: 150px;
    border-radius: 12px;
  }

  .word {
    font-size: 50px;
  }

  .translation {
    font-size: 24px;
    margin-top: 12px;
  }

  .buttons-wrapper {
    gap: 24px;
  }

  .btn {
    width: 54px;
    height: 54px;
    font-size: 24px;
    border-radius: 12px;
    border-width: 2px;
  }
}

/* 超大屏幕（大型桌面） */
@media (min-width: 1441px) and (max-width: 1920px) {
  .word-card {
    max-width: 900px;
    padding: 36px;
    gap: 30px;
    border-radius: 20px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  }

  .content-wrapper {
    gap: 18px;
    padding: 18px;
    min-height: 180px;
    border-radius: 15px;
  }

  .word {
    font-size: 60px;
  }

  .translation {
    font-size: 28px;
    margin-top: 15px;
  }

  .buttons-wrapper {
    gap: 30px;
  }

  .btn {
    width: 64px;
    height: 64px;
    font-size: 28px;
    border-radius: 15px;
    border-width: 2px;
  }
}

/* 超大屏幕 4K */
@media (min-width: 1921px) and (max-width: 2560px) {
  .word-card {
    max-width: 1200px;
    padding: 45px;
    gap: 36px;
    border-radius: 24px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .content-wrapper {
    gap: 22px;
    padding: 22px;
    min-height: 220px;
    border-radius: 18px;
  }

  .word {
    font-size: 72px;
  }

  .translation {
    font-size: 34px;
    margin-top: 18px;
  }

  .buttons-wrapper {
    gap: 36px;
  }

  .btn {
    width: 80px;
    height: 80px;
    font-size: 34px;
    border-radius: 18px;
    border-width: 2.5px;
  }
}

/* 添加word-card高度减少的媒体查询 */
@media (max-width: 1999px) {
  .word-card {
    padding: 14px;
    gap: 10px;
  }

  .content-wrapper {
    gap: 7px;
    padding: 7px;
    min-height: 70px;
  }

  .word {
    font-size: 22px;
  }

  .translation {
    font-size: 13px;
    margin-top: 6px;
  }

  .buttons-wrapper {
    gap: 11px;
  }

  .btn {
    width: 26px;
    height: 26px;
    font-size: 11px;
  }
  
  /* 大屏幕（桌面） */
  @media (min-width: 1025px) and (max-width: 1440px) {
    .word-card {
      max-width: 504px;
      padding: 21px;
      gap: 17px;
    }

    .content-wrapper {
      gap: 10px;
      padding: 10px;
      min-height: 105px;
    }

    .word {
      font-size: 35px;
    }

    .translation {
      font-size: 17px;
      margin-top: 8px;
    }

    .buttons-wrapper {
      gap: 17px;
    }

    .btn {
      width: 38px;
      height: 38px;
      font-size: 17px;
    }
  }

  /* 超大屏幕（大型桌面） */
  @media (min-width: 1441px) and (max-width: 1920px) {
    .word-card {
      max-width: 630px;
      padding: 25px;
      gap: 21px;
    }

    .content-wrapper {
      gap: 13px;
      padding: 13px;
      min-height: 126px;
    }

    .word {
      font-size: 42px;
    }

    .translation {
      font-size: 20px;
      margin-top: 10px;
    }

    .buttons-wrapper {
      gap: 21px;
    }

    .btn {
      width: 45px;
      height: 45px;
      font-size: 20px;
    }
  }

  /* 添加按钮大小减少的媒体查询 */
  .word-card .button-group button {
    width: 28px;
    height: 28px;
    font-size: 11px;
    padding: 4px;
  }

  .word-card .button-group {
    gap: 7px;
  }

  .word-card .circle-btn {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
}
</style>