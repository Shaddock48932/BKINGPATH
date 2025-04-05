/**
 * 情思内容加密/解密工具
 * 
 * 这个工具用于对情思内容进行简单加密，防止用户通过搜索找到原始内容
 * 注意：这不是强安全加密，只是为了防止简单的文本搜索
 */

// 加密密钥
const CONTENT_KEY = "BkingPath_Content_Key";

/**
 * 加密情思内容
 * @param {string} content 要加密的内容
 * @returns {string} 加密后的内容
 */
export function encryptContent(content) {
  if (!content) return '';
  
  // 先将内容转为 UTF-8 编码
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // 加密字节
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    // 使用 XOR 加密每个字节
    const byte = data[i] ^ CONTENT_KEY.charCodeAt(i % CONTENT_KEY.length);
    // 将字节转为两位十六进制字符串
    encrypted += byte.toString(16).padStart(2, '0');
  }
  
  return encrypted;
}

/**
 * 解密情思内容
 * @param {string} encryptedContent 加密的内容
 * @returns {string} 解密后的原始内容
 */
export function decryptContent(encryptedContent) {
  if (!encryptedContent) return '';
  
  try {
    // 将十六进制字符串转为字节数组
    const bytes = new Uint8Array(encryptedContent.length / 2);
    for (let i = 0; i < encryptedContent.length; i += 2) {
      const byte = parseInt(encryptedContent.substring(i, i + 2), 16);
      bytes[i/2] = byte ^ CONTENT_KEY.charCodeAt((i/2) % CONTENT_KEY.length);
    }
    
    // 将解密后的字节数组转回字符串
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch (error) {
    console.error('解密情思内容失败', error);
    return '[解密失败]';
  }
}

/**
 * 加密情思数据对象
 * @param {Object} feelingItem 情思数据对象 
 * @returns {Object} 加密后的情思数据对象
 */
export function encryptFeelingItem(feelingItem) {
  if (!feelingItem) return null;
  
  return {
    ...feelingItem,
    userId: encryptContent(feelingItem.userId),
    message: encryptContent(feelingItem.message),
    encrypted: true // 标记为已加密
  };
}

/**
 * 解密情思数据对象
 * @param {Object} encryptedItem 加密的情思数据对象
 * @returns {Object} 解密后的情思数据对象
 */
export function decryptFeelingItem(encryptedItem) {
  if (!encryptedItem) return null;
  if (!encryptedItem.encrypted) return encryptedItem; // 如果未加密则原样返回
  
  return {
    ...encryptedItem,
    userId: decryptContent(encryptedItem.userId),
    message: decryptContent(encryptedItem.message),
    encrypted: false // 标记为已解密
  };
}

/**
 * 加密整个情思数据数组
 * @param {Array} feelingsArray 情思数据数组
 * @returns {Array} 加密后的情思数据数组
 */
export function encryptFeelingsArray(feelingsArray) {
  if (!Array.isArray(feelingsArray)) return [];
  
  return feelingsArray.map(item => encryptFeelingItem(item));
}

/**
 * 解密整个情思数据数组
 * @param {Array} encryptedArray 加密的情思数据数组
 * @returns {Array} 解密后的情思数据数组
 */
export function decryptFeelingsArray(encryptedArray) {
  if (!Array.isArray(encryptedArray)) return [];
  
  return encryptedArray.map(item => decryptFeelingItem(item));
} 