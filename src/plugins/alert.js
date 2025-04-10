import AlertContainer from '../components/AlertContainer.vue';
import alertService from '../utils/alertService';

export default {
  install(app) {
    // 注册全局组件
    app.component('AlertContainer', AlertContainer);
    
    // 添加全局属性
    app.config.globalProperties.$alert = alertService;
    
    // 提供全局注入
    app.provide('alert', alertService);
  }
}; 