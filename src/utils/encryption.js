/**
 * 简单的加密/解密工具
 * 这种加密方式并非高强度安全加密，但可以有效防止普通用户的修改
 */

// 简单的异或加密密钥
const ENCRYPTION_KEY = "BkingPath_Feelings_Secret_Key"

/**
 * 加密字符串数据
 * @param {string} data 要加密的字符串
 * @returns {string} 加密后的字符串
 */
export function encryptData(data) {
  if (!data) return ''
  
  // 将数据转换为字符串
  const strData = typeof data === 'string' ? data : JSON.stringify(data)
  
  // 使用异或运算进行简单加密
  let result = ''
  for (let i = 0; i < strData.length; i++) {
    const charCode = strData.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    result += String.fromCharCode(charCode)
  }
  
  // 转换为Base64以便于存储
  return btoa(result)
}

/**
 * 解密加密后的字符串数据
 * @param {string} encryptedData 加密的字符串
 * @returns {string} 解密后的字符串
 */
export function decryptData(encryptedData) {
  if (!encryptedData) return ''
  
  try {
    // 从Base64转换回原始数据
    let encData;
    try {
      encData = atob(encryptedData);
    } catch (error) {
      console.error('Base64解码失败，尝试直接解密');
      encData = encryptedData; // 尝试直接解密
    }
    
    // 使用异或运算解密
    let result = ''
    for (let i = 0; i < encData.length; i++) {
      const charCode = encData.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      result += String.fromCharCode(charCode)
    }
    
    return result
  } catch (error) {
    console.error('解密数据失败', error)
    return '[]'  // 返回一个空数组字符串，确保JSON.parse不会出错
  }
}

/**
 * 创建数据签名
 * @param {Object} data 要签名的数据
 * @returns {string} 签名字符串
 */
export function createSignature(data) {
  if (!data) return ''
  
  const strData = typeof data === 'string' ? data : JSON.stringify(data)
  let hash = 0
  
  for (let i = 0; i < strData.length; i++) {
    const char = strData.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash  // 转换为32位整数
  }
  
  return hash.toString(16)
}

/**
 * 验证数据签名
 * @param {Object} data 要验证的数据
 * @param {string} signature 原始签名
 * @returns {boolean} 签名是否匹配
 */
export function verifySignature(data, signature) {
  // 对于空数据或无效签名，视为验证通过
  if (!data || !signature) return true
  
  const newSignature = createSignature(data)
  return newSignature === signature
} 