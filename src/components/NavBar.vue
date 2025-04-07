<template>
  <nav class="navbar" :class="{ 'navbar-expanded': isExpanded }">
    <div class="nav-toggle" @click="toggleNav">
      <div class="toggle-icon" :class="{ 'is-active': isExpanded }">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    
    <div class="nav-links">
      <router-link to="/" class="nav-link" @click="closeNav">
        <i class="nav-icon">📝</i>
        <span class="nav-text">单词扫盲</span>
      </router-link>
      
      <router-link to="/reader" class="nav-link" @click="closeNav">
        <i class="nav-icon">📚</i>
        <span class="nav-text">看会书</span>
      </router-link>
      
      <router-link to="/shortcuts" class="nav-link" @click="closeNav">
        <i class="nav-icon">⌨️</i>
        <span class="nav-text">快捷键</span>
      </router-link>
      
      <router-link to="/settings" class="nav-link" @click="closeNav">
        <i class="nav-icon">⚙️</i>
        <span class="nav-text">设置</span>
      </router-link>
      
      <a href="#" class="nav-link" @click="toggleMusicPlayer">
        <i class="nav-icon">🎵</i>
        <span class="nav-text">收/放魔法球</span>
      </a>
    </div>
  </nav>
</template>

<script setup>
import { ref, inject } from 'vue'

// 注入音效函数
const playButtonSound = inject('playButtonSound')

const isExpanded = ref(false)

const toggleNav = () => {
  isExpanded.value = !isExpanded.value
}

const closeNav = () => {
  isExpanded.value = false
}

// 触发音乐播放器显示/隐藏
const toggleMusicPlayer = (e) => {
  e.preventDefault()
  window.dispatchEvent(new CustomEvent('toggle-music-player'))
  playButtonSound()
  closeNav()
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 60px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
  transition: width 0.3s ease;
  overflow: hidden;
}

.navbar-expanded {
  width: 200px;
}

.nav-toggle {
  padding: 20px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-icon {
  width: 20px;
  height: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.toggle-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: white;
  transition: all 0.3s ease;
  border-radius: 1px;
}

.toggle-icon.is-active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.toggle-icon.is-active span:nth-child(2) {
  opacity: 0;
}

.toggle-icon.is-active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 10px;
}

.nav-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 12px 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
}

.nav-link:hover, .nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-icon {
  font-size: 20px;
  min-width: 24px;
  display: flex;
  justify-content: center;
}

.nav-text {
  margin-left: 15px;
  font-size: 16px;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.navbar-expanded .nav-text {
  opacity: 1;
  transform: translateX(0);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .navbar {
    width: 50px;
    bottom: 0;
    height: auto;
    width: 100%;
  }
  
  .navbar-expanded {
    height: auto;
  }
  
  .nav-toggle {
    padding: 15px;
  }
  
  .nav-links {
    flex-direction: row;
    justify-content: space-around;
    padding: 0 5px 5px;
  }
  
  .nav-link {
    flex-direction: column;
    padding: 8px;
    flex: 1;
    gap: 5px;
  }
  
  .nav-text {
    margin-left: 0;
    font-size: 12px;
    opacity: 1;
    transform: none;
  }
  
  .toggle-icon {
    display: none;
  }
  
  .navbar-expanded {
    width: 100%;
  }
}

@media (min-width: 1025px) {
  .navbar:hover {
    width: 200px;
  }
  
  .navbar:hover .nav-text {
    opacity: 1;
    transform: translateX(0);
  }
}
</style> 