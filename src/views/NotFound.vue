<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <div class="error-message">页面不见了</div>
      <p class="error-description">
        你要找的页面可能已被移动、删除或者从未存在过。
      </p>
      <router-link to="/" class="home-btn">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup>
// 不需要额外的逻辑
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
}

.not-found-content {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1;
  opacity: 0.8;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.error-message {
  font-size: 32px;
  color: white;
  margin: 20px 0;
  font-family: serif;
}

.error-description {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 30px;
}

.home-btn {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 24px;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .error-code {
    font-size: 80px;
  }
  
  .error-message {
    font-size: 24px;
  }
  
  .error-description {
    font-size: 16px;
  }
  
  .not-found-content {
    padding: 30px;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .error-code {
    font-size: 150px;
  }
  
  .error-message {
    font-size: 36px;
  }
  
  .not-found-content {
    max-width: 600px;
  }
}

@media (min-width: 1441px) {
  .error-code {
    font-size: 180px;
  }
  
  .error-message {
    font-size: 42px;
  }
  
  .error-description {
    font-size: 20px;
  }
  
  .not-found-content {
    max-width: 700px;
    padding: 50px;
  }
  
  .home-btn {
    padding: 12px 28px;
    font-size: 18px;
  }
}
</style> 