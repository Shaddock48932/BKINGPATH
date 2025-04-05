/**
 * 恢复情思数据工具
 * 当检测到数据被篡改或删除时，使用此工具恢复原始数据
 */

import { encryptedData, dataSignature } from '../data/encrypted-feelings.js'
import { decryptData, verifySignature } from './encryption.js'

/**
 * 检查情思数据的完整性
 * @returns {boolean} 数据是否完整
 */
export function checkFeelingsIntegrity() {
  try {
    // 解密数据
    const decryptedData = decryptData(encryptedData)
    
    // 解析JSON
    const parsedData = JSON.parse(decryptedData)
    
    // 验证数据签名
    return verifySignature(parsedData, dataSignature)
  } catch (error) {
    console.error('检查情思数据完整性失败', error)
    return false
  }
}

/**
 * 重置用户添加的情思数据
 * 这将清除所有用户添加的情思
 */
export function resetUserFeelings() {
  try {
    localStorage.removeItem('encrypted-user-feelings')
    localStorage.removeItem('user-feelings-signature')
    return true
  } catch (error) {
    console.error('重置用户情思数据失败', error)
    return false
  }
}

/**
 * 检查并恢复系统默认情思数据
 * 此函数不会改变储存的数据，只是验证默认情思数据是否可用
 * @returns {Object[]} 恢复的基础情思数据数组，如果恢复失败则返回空数组
 */
export function restoreBaseFeelings() {
  try {
    // 解密数据
    const decryptedData = decryptData(encryptedData)
    
    // 解析JSON
    const parsedData = JSON.parse(decryptedData)
    
    // 验证数据签名
    if (verifySignature(parsedData, dataSignature)) {
      return parsedData
    } else {
      console.error('情思数据签名验证失败，无法恢复')
      return []
    }
  } catch (error) {
    console.error('恢复基础情思数据失败', error)
    return []
  }
} 