/**
 * 显示控制台样式的错误信息
 * @param {string} message 错误信息
 */
export function showError(message) {
  // 定义控制台样式
  const styles = [
    'color: #0ea5e9',  // 使用之前的科技蓝色
    'background: #1e293b',  // 深色背景
    'padding: 4px 8px',
    'border-radius: 4px',
    'font-family: monospace',
    'font-size: 12px',
    'font-weight: bold'
  ].join(';');

  // 时间戳
  const timestamp = new Date().toLocaleTimeString();
  
  // 在控制台中显示样式化的错误信息
  console.log(`%c[${timestamp}] ⚠️ ${message}`, styles);
} 