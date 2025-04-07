<template>
  <div class="feelings-page">
    <h1 class="page-title">情思记录</h1>
    
    <div class="notebook-container">
      <!-- 复用现有的NoteBook组件 -->
      <note-book />
    </div>
  </div>
</template>

<script setup>
import NoteBook from '../components/NoteBook.vue'
</script>

<style scoped>
.feelings-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  min-height: 100vh;
}

.page-title {
  color: white;
  font-family: serif;
  font-size: 28px;
  margin-bottom: 30px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.notebook-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: center;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
    margin-bottom: 20px;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .page-title {
    font-size: 32px;
  }
}

@media (min-width: 1441px) {
  .page-title {
    font-size: 36px;
  }
}
</style> 