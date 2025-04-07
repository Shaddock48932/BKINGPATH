<template>
  <div class="settings-page">
    <div class="settings-container">
      <div class="settings-section">
        <h2 class="section-title">音量设置</h2>
        <div class="setting-item">
          <label for="volume-slider">单词发音音量</label>
          <input 
            type="range" 
            id="volume-slider" 
            min="0" 
            max="1" 
            step="0.1" 
            v-model="volume"
            @change="saveVolume"
          />
          <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
        </div>
        
        <div class="setting-item">
          <label for="bgm-volume-slider">背景音乐音量</label>
          <input 
            type="range" 
            id="bgm-volume-slider" 
            min="0" 
            max="1" 
            step="0.1" 
            v-model="bgmVolume"
            @change="saveBgmVolume"
          />
          <span class="volume-value">{{ Math.round(bgmVolume * 100) }}%</span>
        </div>
      </div>
      
      <div class="settings-section">
        <h2 class="section-title">背景设置</h2>
        <div class="setting-item">
          <label>自定义背景</label>
          <label class="upload-btn">
            <input 
              type="file" 
              accept="image/*" 
              @change="handleBackgroundUpload"
              class="file-input"
            >
            <i class="fas fa-image"></i>
            {{ selectedImage ? '更换壁纸' : '上传壁纸' }}
          </label>
        </div>
        
        <!-- <div class="setting-item">
          <button @click="resetBackground" class="reset-btn">恢复默认背景</button>
        </div> -->
      </div>
      
      <div class="settings-section">
        <h2 class="section-title">音乐设置</h2>
        <div class="setting-item">
          <label>添加背景音乐</label>
          <label class="upload-btn">
            <input 
              type="file" 
              accept="audio/*" 
              @change="handleMusicUpload"
              class="file-input"
            >
            <i class="fas fa-music"></i>
            添加小曲
          </label>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'

// 注入音效和音量方法
const setSoundVolume = inject('setSoundVolume')
const soundVolume = inject('soundVolume')
const playButtonSound = inject('playButtonSound')

// 音量设置
const volume = ref(1)
const bgmVolume = ref(0.5)

// 背景图片相关
const selectedImage = ref(null)

// 其他设置
const autoPlay = ref(false)
const autoTranslation = ref(false)

// 加载设置
onMounted(() => {
  // 从localStorage加载设置
  const savedVolume = localStorage.getItem('wordVolume')
  if (savedVolume !== null) {
    volume.value = parseFloat(savedVolume)
  }
  
  const savedBgmVolume = localStorage.getItem('bgmVolume')
  if (savedBgmVolume !== null) {
    bgmVolume.value = parseFloat(savedBgmVolume)
  }
  
  const savedSettings = localStorage.getItem('studySettings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    autoPlay.value = settings.autoPlay ?? false
    autoTranslation.value = settings.autoTranslation ?? false
  }
  
  // 检查是否有保存的背景图
  const savedBackground = localStorage.getItem('customBackground')
  if (savedBackground) {
    selectedImage.value = savedBackground
  }
})

// 保存音量设置
const saveVolume = () => {
  localStorage.setItem('wordVolume', volume.value.toString())
  // 更新全局音效音量
  setSoundVolume(volume.value)
  playButtonSound()
}

// 保存背景音乐音量
const saveBgmVolume = () => {
  localStorage.setItem('bgmVolume', bgmVolume.value.toString())
  playButtonSound()
}

// 保存其他设置
const saveSettings = () => {
  const settings = {
    autoPlay: autoPlay.value,
    autoTranslation: autoTranslation.value
  }
  localStorage.setItem('studySettings', JSON.stringify(settings))
  playButtonSound()
}

// 上传背景图片
const handleBackgroundUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedImage.value = e.target.result
      document.body.style.backgroundImage = `url(${e.target.result})`
      document.body.style.backgroundSize = 'contain'
      // 保存到 localStorage
      localStorage.setItem('customBackground', e.target.result)
    }
    reader.readAsDataURL(file)
    playButtonSound()
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

  try {
    // 创建文件URL
    const url = URL.createObjectURL(file)
    // 获取文件名（去除扩展名）
    const name = file.name.replace(/\.[^/.]+$/, "")
    
    // 添加到音乐列表
    const musicList = JSON.parse(localStorage.getItem('musicList') || '[]')
    
    // 检查是否已存在同名音乐
    if (musicList.some(item => item.name === name)) {
      alert('已存在同名音乐')
      URL.revokeObjectURL(url)
      return
    }
    
    // 添加到列表
    musicList.push({ name, url })
    localStorage.setItem('musicList', JSON.stringify(musicList))
    
    // 播放提示音
    playButtonSound()
    
    // 提示用户添加成功
    alert(`已添加音乐：${name}`)
  } catch (error) {
    console.error('添加音乐失败:', error)
    alert('添加音乐失败')
  }

  // 清空input，允许重复上传同一文件
  event.target.value = ''
}

// 重置背景
const resetBackground = () => {
  localStorage.removeItem('customBackground')
  document.body.style.backgroundImage = 'url(./src/assets/initialbgc.png)'
  document.body.style.backgroundSize = 'contain'
  selectedImage.value = null
  playButtonSound()
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px 20px;
  min-height: 80vh;
  color: white;
}

.page-title {
  font-family: serif;
  font-size: 28px;
  /* margin-bottom: 30px; */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.settings-container {
  width: 100%;
  max-width: 600px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
}

.settings-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  margin-bottom: 15px;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 15px;
}

.setting-item label {
  flex: 1;
  font-size: 16px;
}

.setting-item input[type="range"] {
  flex: 2;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.setting-item input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

.volume-value {
  min-width: 50px;
  text-align: right;
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox input {
  margin-right: 10px;
  width: 18px;
  height: 18px;
}

.reset-btn {
  background: rgba(255, 68, 68, 0.2);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: rgba(255, 68, 68, 0.4);
  transform: translateY(-1px);
}

/* 上传按钮样式 */
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
}

.upload-btn:hover {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
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

.file-input {
  display: none;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .settings-container {
    padding: 15px;
  }
  
  .page-title {
    font-size: 24px;
    /* margin-bottom: 20px; */
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .setting-item input[type="range"] {
    width: 100%;
  }
  
  .volume-value {
    align-self: flex-end;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .page-title {
    font-size: 32px;
  }
  
  .settings-container {
    max-width: 700px;
  }
}

@media (min-width: 1441px) {
  .page-title {
    font-size: 36px;
  }
  
  .settings-container {
    max-width: 800px;
    padding: 30px;
  }
  
  .section-title {
    font-size: 22px;
  }
  
  .setting-item label {
    font-size: 18px;
  }
}
</style> 