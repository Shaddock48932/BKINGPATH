<!-- 上传背景图片 -->
<script setup>
import { ref, onMounted } from 'vue'

const selectedImage = ref(null)

const handleFileChange = (event) => {
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
  }
}

// 组件加载时检查是否有保存的背景图
onMounted(() => {
  const savedBackground = localStorage.getItem('customBackground')
  if (savedBackground) {
    document.body.style.backgroundImage = `url(${savedBackground})`
    document.body.style.backgroundSize = 'contain'
    selectedImage.value = savedBackground
  }
})
</script>

<template>
  <div class="background-uploader">
    <label class="upload-btn" :class="{ 'has-image': selectedImage }">
      <input 
        type="file" 
        accept="image/*" 
        @change="handleFileChange"
        class="file-input"
      >
      <i class="fas fa-image"></i>
      {{ selectedImage ? '更换壁纸' : '上传壁纸' }}
    </label>
  </div>
</template>

<style scoped>
.background-uploader {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.upload-btn {
  font-family: serif;
  display: flex;
  align-items: center;
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

.upload-btn.has-image {
  color: rgba(255, 255, 255, 0.8);
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

.file-input {
  display: none;
}

@media (max-width: 768px) {
  .background-uploader {
    bottom: 15px;
    right: 15px;
  }

  .upload-btn {
    padding: 7px 14px;
    font-size: 13px;
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .background-uploader {
    bottom: 10px;
    right: 10px;
  }

  .upload-btn {
    padding: 6px 12px;
    font-size: 12px;
    gap: 5px;
  }
}

/* 中等屏幕（笔记本电脑） */
@media (min-width: 769px) and (max-width: 1024px) {
  .background-uploader {
    bottom: 25px;
    right: 25px;
  }

  .upload-btn {
    padding: 10px 20px;
    font-size: 16px;
    gap: 10px;
    border-radius: 22px;
  }
}

/* 大屏幕（桌面） */
@media (min-width: 1025px) and (max-width: 1440px) {
  .background-uploader {
    bottom: 35px;
    right: 35px;
  }

  .upload-btn {
    padding: 14px 28px;
    font-size: 18px;
    gap: 14px;
    border-radius: 25px;
  }
}

/* 超大屏幕（大型桌面） */
@media (min-width: 1441px) and (max-width: 1920px) {
  .background-uploader {
    bottom: 50px;
    right: 50px;
  }

  .upload-btn {
    padding: 16px 32px;
    font-size: 22px;
    gap: 16px;
    border-radius: 30px;
  }
}

/* 超大屏幕 4K */
@media (min-width: 1921px) and (max-width: 2560px) {
  .background-uploader {
    bottom: 65px;
    right: 65px;
  }

  .upload-btn {
    padding: 20px 40px;
    font-size: 26px;
    gap: 20px;
    border-radius: 35px;
  }
}

@media (min-width: 2561px) {
  .background-uploader {
    bottom: 80px;
    right: 80px;
  }

  .upload-btn {
    padding: 24px 48px;
    font-size: 30px;
    gap: 24px;
    border-radius: 40px;
  }
}

/* 添加按钮大小减少的媒体查询 */
@media (max-width: 1999px) {
  .background-uploader {
    bottom: 14px;
    right: 14px;
  }

  .upload-btn {
    padding: 7px 14px;
    font-size: 12px;
    gap: 6px;
    border-radius: 14px;
  }
}
</style> 