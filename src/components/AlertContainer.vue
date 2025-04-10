<template>
  <div class="alert-container">
    <custom-alert 
      v-for="alert in alertService.alerts" 
      :key="alert.id"
      :message="alert.message"
      :type="alert.type"
      :duration="alert.duration"
      :visible="alert.visible"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import alertService from '../utils/alertService';
import CustomAlert from './CustomAlert.vue';

// 将alertService暴露给模板
defineExpose({ alertService });
</script>

<style scoped>
.alert-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 16px;
}
</style> 