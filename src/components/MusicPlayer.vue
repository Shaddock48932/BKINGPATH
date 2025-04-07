<!-- 音乐播放器 -->
<script setup>
import { ref, onMounted, onUnmounted, inject } from 'vue'
import callOfSilence from '../assets/music/Call of Silence.mp3'
import Sincerely from '../assets/music/Sincerely.mp3'
import Young from '../assets/music/Young and Beautiful.mp3'
import Radio from '../assets/music/radio.mp3'

// 注入音效函数
const playTouchSound = inject('playTouchSound')

const isPlaying = ref(false)
const isRotating = ref(false)
const showList = ref(false)
const currentAudio = ref(null)
const currentMusicName = ref('')
const clickTimer = ref(null)
const playerRef = ref(null)
const volume = ref(0.06) // 默认音量10%

// 音乐列表
const musicList = ref([
  { name: 'Call of Silence', url: callOfSilence },
  { name: 'Sincerely', url: Sincerely },
  { name: 'Young and Beautiful', url: Young },
  { name: 'Radio', url: Radio },
])

// 添加新音乐到列表
const addMusic = (name, url) => {
  // 检查是否已存在同名音乐
  const exists = musicList.value.some(music => music.name === name)
  if (exists) {
    return false
  }
  musicList.value.push({ name, url })
  return true
}

// 暴露方法给父组件
defineExpose({
  addMusic
})

const toggleList = () => {
  showList.value = !showList.value
}

const handleClick = () => {
  if (clickTimer.value === null) {
    clickTimer.value = setTimeout(() => {
      toggleList()
      clickTimer.value = null
    }, 200)
  }
}

const handleDoubleClick = () => {
  if (clickTimer.value !== null) {
    clearTimeout(clickTimer.value)
    clickTimer.value = null
  }
  isRotating.value = !isRotating.value
  togglePlay()
}

const fadeVolume = async (audio, start, end, duration = 1500) => {
  const steps = 30
  const stepTime = duration / steps
  const volumeStep = (end - start) / steps
  
  for (let i = 0; i <= steps; i++) {
    audio.volume = start + volumeStep * i
    await new Promise(resolve => setTimeout(resolve, stepTime))
  }
}

const togglePlay = async () => {
  if (!currentAudio.value && !isPlaying.value) {
    playMusic(musicList[0])
    return
  }
  
  if (isPlaying.value) {
    // 立即停止旋转
    isPlaying.value = false
    // 淡出
    await fadeVolume(currentAudio.value, currentAudio.value.volume, 0)
    currentAudio.value.pause()
  } else if (currentAudio.value) {
    currentAudio.value.volume = 0
    try {
      await currentAudio.value.play()
      // 淡入到当前设置的音量
      await fadeVolume(currentAudio.value, 0, volume.value)
      isPlaying.value = true
    } catch (error) {
      console.error('播放失败:', error)
    }
  }
}

const playMusic = async (music) => {
  try {
    // 立即隐藏列表
    showList.value = false
    
    // 如果当前有音频在播放，先淡出并停止
    if (currentAudio.value) {
      await fadeVolume(currentAudio.value, currentAudio.value.volume, 0)
      currentAudio.value.pause()
      currentAudio.value = null
    }
    
    // 创建新的音频实例
    const audio = new Audio(music.url)
    audio.loop = true
    audio.volume = 0
    
    // 设置事件监听
    audio.onplay = () => {
      isPlaying.value = true
      currentMusicName.value = music.name
      isRotating.value = true // 开始旋转
    }
    
    audio.onpause = () => {
      isPlaying.value = false
    }
    
    audio.onerror = (error) => {
      console.error('音频加载失败:', error)
      isPlaying.value = false
      currentMusicName.value = ''
      isRotating.value = false // 停止旋转
    }
    
    // 保存并播放
    currentAudio.value = audio
    await audio.play()
    // 淡入到当前设置的音量
    await fadeVolume(audio, 0, volume.value)
  } catch (error) {
    console.error('播放失败:', error)
    isPlaying.value = false
    currentMusicName.value = ''
    isRotating.value = false // 停止旋转
  }
}

const handleOutsideClick = (event) => {
  if (playerRef.value && !playerRef.value.contains(event.target) && showList.value) {
    showList.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div class="music-player" ref="playerRef">
    <button 
      class="music-btn" 
      :class="{ 'rotating': isRotating }"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @mouseenter="playTouchSound"
      :title="currentMusicName || '点击显示音乐列表'"
    >
      🎵
    </button>
    
    <div class="music-list" v-if="showList">
      <button 
        v-for="music in musicList" 
        :key="music.url"
        class="music-item"
        :class="{ 'active': currentMusicName === music.name }"
        @click="playMusic(music)"
      >
        {{ music.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  top: 100px;
  left: 100px;
  z-index: 1000;
}

.music-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  padding: 0;
  margin: 0;
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
.music-btn:hover {
  opacity: 1;
}

.music-btn::before {
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

.music-btn::after {
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

.music-btn:active {
  transform: scale(0.9);
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

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation-play-state: running;
}

.rotating::before {
  animation: soft-breath 6s ease-in-out infinite, soft-glow 6s ease-in-out infinite;
}

.rotating::after {
  animation: soft-breath-outer 6s ease-in-out infinite 0.5s, soft-glow-outer 6s ease-in-out infinite 0.5s;
}

@keyframes soft-glow {
  0% {
    box-shadow: 0 0 15px rgba(255,255,255,0.2);
  }
  50% {
    box-shadow: 0 0 25px rgba(255,255,255,0.4);
  }
  100% {
    box-shadow: 0 0 15px rgba(255,255,255,0.2);
  }
}

@keyframes soft-glow-outer {
  0% {
    box-shadow: 0 0 20px rgba(255,255,255,0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(255,255,255,0.25);
  }
  100% {
    box-shadow: 0 0 20px rgba(255,255,255,0.1);
  }
}

.music-list {
  position: absolute;
  top: 50px;
  left: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
}

.music-item {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  transition: all 0.2s;
}

.music-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.music-item.active {
  background: rgba(255, 255, 255, 0.2);
  position: relative;
}

.music-item.active::before {
  content: '▶';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
}

.music-item.active {
  padding-left: 24px;
}

@media (min-width: 1245px) {
  .music-btn {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
  
  .music-list {
    min-width: 180px;
  }
  
  .music-item {
    padding: 10px 20px;
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .music-player {
    top: 100px;
    left: 100px;
  }
}

@media (max-width: 480px) {
  .music-player {
    top: 100px;
    left: 100px;
  }
  
  .music-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

/* 中等屏幕（笔记本电脑） */
@media (min-width: 769px) and (max-width: 1024px) {
  .music-player {
    top: 100px;
    left: 100px;
  }
  
  .music-btn {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
  
  .music-list {
    min-width: 180px;
    top: 55px;
  }
  
  .music-item {
    padding: 10px 18px;
    font-size: 15px;
  }
}

/* 大屏幕（桌面） */
@media (min-width: 1025px) and (max-width: 1440px) {
  .music-player {
    top: 100px;
    left: 100px;
  }
  
  .music-btn {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }
  
  .music-list {
    min-width: 220px;
    top: 70px;
    padding: 12px;
    gap: 10px;
    border-radius: 15px;
  }
  
  .music-item {
    padding: 12px 22px;
    font-size: 18px;
    border-radius: 10px;
  }
  
  .music-item.active::before {
    font-size: 14px;
    left: 8px;
  }
  
  .music-item.active {
    padding-left: 30px;
  }
}

/* 超大屏幕（大型桌面） */
@media (min-width: 1441px) and (max-width: 1920px) {
  .music-player {
    top: 100px;
    left: 100px;
  }
  
  .music-btn {
    width: 70px;
    height: 70px;
    font-size: 34px;
  }
  
  .music-list {
    min-width: 260px;
    top: 85px;
    padding: 15px;
    gap: 12px;
    border-radius: 18px;
  }
  
  .music-item {
    padding: 15px 26px;
    font-size: 22px;
    border-radius: 12px;
  }
  
  .music-item.active::before {
    font-size: 16px;
    left: 10px;
  }
  
  .music-item.active {
    padding-left: 36px;
  }
}

/* 超大屏幕 4K */
@media (min-width: 1921px) and (max-width: 2560px) {
  .music-player {
    top: 100px;
    left: 100px;
  }
  
  .music-btn {
    width: 85px;
    height: 85px;
    font-size: 42px;
  }
  
  .music-list {
    min-width: 320px;
    top: 100px;
    padding: 18px;
    gap: 15px;
    border-radius: 22px;
  }
  
  .music-item {
    padding: 18px 32px;
    font-size: 26px;
    border-radius: 15px;
  }
  
  .music-item.active::before {
    font-size: 18px;
    left: 12px;
  }
  
  .music-item.active {
    padding-left: 42px;
  }
}
</style> 