import { ref, reactive } from 'vue';

// 当前显示的提示
const alerts = reactive([]);
let alertId = 0;

/**
 * 显示一个自定义提示
 * @param {string} message 提示内容
 * @param {string} type 提示类型：success, error, info, warning
 * @param {number} duration 显示时长(毫秒)，默认3000ms
 * @returns {number} 提示ID
 */
function showAlert(message, type = 'info', duration = 3000) {
  const id = ++alertId;
  
  // 添加新提示
  alerts.push({
    id,
    message,
    type,
    duration,
    visible: true
  });
  
  // 设置自动移除
  if (duration > 0) {
    setTimeout(() => {
      removeAlert(id);
    }, duration);
  }
  
  return id;
}

/**
 * 移除指定ID的提示
 * @param {number} id 提示ID
 */
function removeAlert(id) {
  const index = alerts.findIndex(alert => alert.id === id);
  if (index !== -1) {
    alerts.splice(index, 1);
  }
}

/**
 * 快捷方法：显示成功提示
 * @param {string} message 提示内容
 * @param {number} duration 显示时长(毫秒)，默认3000ms
 * @returns {number} 提示ID
 */
function showSuccess(message, duration = 3000) {
  return showAlert(message, 'success', duration);
}

/**
 * 快捷方法：显示错误提示
 * @param {string} message 提示内容
 * @param {number} duration 显示时长(毫秒)，默认3000ms
 * @returns {number} 提示ID
 */
function showError(message, duration = 3000) {
  return showAlert(message, 'error', duration);
}

/**
 * 快捷方法：显示警告提示
 * @param {string} message 提示内容
 * @param {number} duration 显示时长(毫秒)，默认3000ms
 * @returns {number} 提示ID
 */
function showWarning(message, duration = 3000) {
  return showAlert(message, 'warning', duration);
}

/**
 * 快捷方法：显示信息提示
 * @param {string} message 提示内容
 * @param {number} duration 显示时长(毫秒)，默认3000ms
 * @returns {number} 提示ID
 */
function showInfo(message, duration = 3000) {
  return showAlert(message, 'info', duration);
}

/**
 * 移除所有提示
 */
function clearAlerts() {
  alerts.splice(0, alerts.length);
}

export default {
  alerts,
  showAlert,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  removeAlert,
  clearAlerts
}; 