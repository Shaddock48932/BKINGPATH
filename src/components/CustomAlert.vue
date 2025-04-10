<template>
  <teleport to="body">
    <transition name="alert-fade">
      <div v-if="isVisible" class="custom-alert" :class="alertType">
        <div class="alert-icon">
          <i :class="iconClass"></i>
        </div>
        <div class="alert-content">{{ message }}</div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue';

// Props
const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  },
  visible: {
    type: Boolean,
    default: false
  }
});

// 状态
const isVisible = ref(props.visible);
let timer = null;

// 计算图标类名
const iconClass = computed(() => {
  switch (props.type) {
    case 'success': return 'fas fa-check-circle';
    case 'error': return 'fas fa-exclamation-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    default: return 'fas fa-info-circle';
  }
});

// 计算alert类型
const alertType = computed(() => {
  return `type-${props.type}`;
});

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  isVisible.value = newVal;
  if (newVal) {
    startTimer();
  } else {
    clearTimer();
  }
});

// 计时器函数
const startTimer = () => {
  clearTimer();
  if (props.duration > 0) {
    timer = setTimeout(() => {
      isVisible.value = false;
    }, props.duration);
  }
};

// 清除计时器
const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

// 组件初始化
if (props.visible) {
  startTimer();
}

// 组件销毁前清除计时器
onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style scoped>
.custom-alert {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 240px;
  max-width: 90%;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  border-radius: 12px;
  background: rgba(30, 30, 36, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  color: white;
  z-index: 9999;
  font-size: 16px;
  border-left: 4px solid rgba(255, 255, 255, 0.3);
}

.alert-icon {
  margin-right: 12px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-content {
  flex: 1;
  font-family: sans-serif;
}

/* 类型样式 */
.custom-alert.type-success {
  border-left-color: #4caf50;
}

.custom-alert.type-success .alert-icon {
  color: #4caf50;
}

.custom-alert.type-error {
  border-left-color: #f44336;
}

.custom-alert.type-error .alert-icon {
  color: #f44336;
}

.custom-alert.type-warning {
  border-left-color: #ff9800;
}

.custom-alert.type-warning .alert-icon {
  color: #ff9800;
}

.custom-alert.type-info {
  border-left-color: #2196f3;
}

.custom-alert.type-info .alert-icon {
  color: #2196f3;
}

/* 动画效果 */
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.3s ease;
}

.alert-fade-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.alert-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .custom-alert {
    width: 90%;
    padding: 12px 16px;
    font-size: 14px;
  }

  .alert-icon {
    font-size: 18px;
  }
}
</style> 