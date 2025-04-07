<template>
    <div class="notebook-container" :class="{ 'expanded': isExpanded }">
        <div class="notebook-button" @click.stop="toggleExpand" @mouseenter="playTouchSound">
            <span class="icon">💟</span>
        </div>

        <transition name="notebook-panel">
            <div class="notebook-panel" v-show="isExpanded" ref="panel" @click.stop @copy.prevent @contextmenu.prevent>
                <div class="notebook-header">
                    <h3>情思</h3>
                    <div class="sync-status" v-if="syncStatus !== 'idle'">
                        <span class="sync-message" :class="syncStatus"></span>
                    </div>
                    <!-- <button class="close-btn" @click="toggleExpand">
                        <span class="fas fa-times">✘</span>
                    </button> -->
                </div>

                <div class="notes-list" ref="notesList" @copy.prevent @contextmenu.prevent>
                    <div v-for="note in displayNotes" :key="note.id" class="note-item"
                        :data-need-spacing="note.needSpacing" @copy.prevent @contextmenu.prevent>
                        <div v-if="note.showDateDivider" class="date-divider">
                            <span class="divider-line"></span>
                            <span class="divider-date">{{ note.dividerDate }}</span>
                            <span class="divider-line"></span>
                        </div>
                        <div class="note-content">
                            <span class="user-id" :style="{ color: getUserIdColor(note.userId).idColor }">{{ note.userId }}:</span>
                            <span class="message" :style="{ color: getUserIdColor(note.userId).messageColor }">{{ note.message }}</span>
                        </div>
                        <div class="note-time">{{ formatTime(note.timestamp) }}</div>
                    </div>
                </div>

                <div class="input-area">
                    <div class="input-group">
                        <input type="text" v-model="userId" placeholder="ID" class="user-id-input"
                            @paste.prevent @contextmenu.prevent @copy.prevent @cut.prevent @keydown="handleKeyDownUserId" 
                            autocomplete="off" spellcheck="false" autocorrect="off" autocapitalize="off"
                            data-form-type="other" inputmode="text" data-lpignore="true"
                            data-1p-ignore="true" data-disable-autofill>
                        <input type="text" v-model="message" placeholder="情思" class="message-input"
                            @keyup.enter="addNote" @paste.prevent @contextmenu.prevent @copy.prevent @cut.prevent @keydown="handleKeyDownMessage" 
                            autocomplete="off" spellcheck="false" autocorrect="off" autocapitalize="off"
                            data-form-type="other" inputmode="text" data-lpignore="true"
                            data-1p-ignore="true" data-disable-autofill>
                        <button class="send-btn" @click.stop.prevent="addNote">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, inject } from 'vue'
import { encryptedData, dataSignature } from '../data/encrypted-feelings.js'
import { encryptData, decryptData, createSignature, verifySignature } from '../utils/encryption.js'
import { decryptFeelingItem, encryptFeelingItem, decryptContent, encryptContent } from '../utils/feelingsEncryption.js'

// 注入音效函数
const playTouchSound = inject('playTouchSound')

// 使用加密过的情思数据
const isExpanded = ref(false)
const userId = ref('')
const message = ref('')
const baseNotes = ref([]) // 基础情思数据（从加密数据解密）
const additionalNotes = ref([]) // 用户添加的情思
const notes = ref([]) // 合并后的所有情思
const notesList = ref(null)
const panel = ref(null)

// 添加情思同步状态
const syncStatus = ref('idle'); // 'idle', 'syncing', 'success', 'error'
const syncTimeout = ref(null);

// 显示解密后的笔记内容
const displayNotes = computed(() => {
    // 解密所有笔记
    const decryptedNotes = notes.value.map(note => {
        return note.encrypted ? decryptFeelingItem(note) : note;
    });
    
    // 按时间排序
    const sortedNotes = [...decryptedNotes].sort((a, b) => a.timestamp - b.timestamp);
    
    // 处理时间间隔标记
    for (let i = 1; i < sortedNotes.length; i++) {
        const prevNote = sortedNotes[i-1];
        const currentNote = sortedNotes[i];
        
        // 计算时间差（毫秒）
        const timeDiff = currentNote.timestamp - prevNote.timestamp;
        
        // 超过10分钟（600000毫秒）添加小间隙
        if (timeDiff > 600000) {
            currentNote.needSpacing = true;
        }
        
        // 超过一天（86400000毫秒）添加日期分割线
        if (timeDiff > 86400000) {
            currentNote.showDateDivider = true;
            currentNote.dividerDate = formatTime(currentNote.timestamp);
        }
    }
    
    return sortedNotes;
})

// 默认的情思数据，作为解密失败时的备用
const defaultFeelingsData = [
    {
        id: 1712219112000,
        userId: "柚子",
        message: "一点点 抹茶 避雷！！！",
        timestamp: 1712219112000,
        needSpacing: false
    }
];

// 解密和验证基础情思数据
const decryptBaseNotes = () => {
    try {
        // 不再从json文件中读取，而是直接使用encrypted-feelings.js中的数据
        // 解密数据
        const decryptedData = decryptData(encryptedData)
        if (!decryptedData) {
            console.error('解密后的数据为空')
            baseNotes.value = [...defaultFeelingsData]
            return
        }

        // 解析JSON
        let parsedData
        try {
            parsedData = JSON.parse(decryptedData)
        } catch (parseError) {
            // console.error('解析JSON失败', parseError)
            baseNotes.value = [...defaultFeelingsData]
            return
        }

        if (!Array.isArray(parsedData)) {
            console.error('解析的数据不是数组')
            baseNotes.value = [...defaultFeelingsData]
            return
        }

        // 验证数据签名
        if (verifySignature(parsedData, dataSignature)) {
            baseNotes.value = parsedData
        } else {
            console.error('情思数据签名验证失败，可能已被篡改')
            baseNotes.value = [...defaultFeelingsData]
        }
        
        // 合并笔记数据
        mergeNotes();
    } catch (error) {
        console.error('解密情思数据失败', error)
        baseNotes.value = [...defaultFeelingsData]
        // 确保在出错的情况下也能合并笔记
        mergeNotes();
    }
}

// 合并基础情思和用户添加的情思
const mergeNotes = () => {
    notes.value = [...baseNotes.value, ...additionalNotes.value].sort((a, b) => a.timestamp - b.timestamp)
}

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
    
    // 如果是展开状态，滚动到底部
    if (isExpanded.value) {
        setTimeout(() => {
            if (notesList.value) {
                notesList.value.scrollTop = notesList.value.scrollHeight
            }
        }, 50) // 给一点延迟确保渲染完成
    }
}

const closePanel = (e) => {
    // 检查是否点击了发送按钮或其子元素
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn && (sendBtn === e.target || sendBtn.contains(e.target))) {
        return; // 如果点击了发送按钮，不关闭面板
    }
    
    // 检查是否点击了input-area或其子元素
    const inputArea = document.querySelector('.input-area');
    if (inputArea && (inputArea === e.target || inputArea.contains(e.target))) {
        return; // 如果点击了输入区域，不关闭面板
    }
    
    // 检查点击是否在面板之外
    if (panel.value && !panel.value.contains(e.target) && isExpanded.value) {
        isExpanded.value = false;
    }
}

const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()

    const isToday = date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    if (isToday) {
        return `今天 ${hours}:${minutes}`
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()

    if (isYesterday) {
        return `昨天 ${hours}:${minutes}`
    }

    // 添加年份信息到日期显示中
    return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

// 根据用户ID生成颜色
const getUserIdColor = (userId) => {
    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 将哈希转换为0-360之间的色相偏移量
    const hueShift = Math.abs(hash) % 360;
    
    // 基础颜色转换为HSL
    const baseIdRGB = { r: 186, g: 78, b: 132 }; // rgb(186, 78, 132)
    const baseMessageRGB = { r: 232, g: 200, b: 214 }; // rgb(232, 200, 214)
    
    // RGB转HSL辅助函数
    const rgbToHsl = (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // 灰色
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return { 
            h: Math.round(h * 360), 
            s: Math.round(s * 100), 
            l: Math.round(l * 100) 
        };
    };
    
    // 应用色相偏移
    const idHsl = rgbToHsl(baseIdRGB.r, baseIdRGB.g, baseIdRGB.b);
    const messageHsl = rgbToHsl(baseMessageRGB.r, baseMessageRGB.g, baseMessageRGB.b);
    
    // 应用色相偏移，保持饱和度和亮度
    const shiftedIdHue = (idHsl.h + hueShift) % 360;
    const shiftedMessageHue = (messageHsl.h + hueShift) % 360;
    
    return {
        idColor: `hsl(${shiftedIdHue}, ${idHsl.s}%, ${idHsl.l}%)`,
        messageColor: `hsl(${shiftedMessageHue}, ${messageHsl.s}%, ${messageHsl.l}%)`
    };
}

const addNote = () => {
    if (!userId.value.trim() || !message.value.trim()) return

    // 创建新笔记并立即加密
    const newNote = encryptFeelingItem({
        id: Date.now(),
        userId: userId.value,
        message: message.value,
        timestamp: Date.now(),
        isUserAdded: true, // 标记为用户添加
        needSpacing: false
    });

    // 检查是否需要添加时间间距
    if (notes.value.length > 0) {
        const allNotes = [...notes.value].sort((a, b) => a.timestamp - b.timestamp)
        const lastNote = allNotes[allNotes.length - 1]
        const lastTime = new Date(lastNote.timestamp)
        const newTime = new Date(newNote.timestamp)

        if (lastTime.getHours() !== newTime.getHours()) {
            newNote.needSpacing = true
        }
    }

    additionalNotes.value.push(newNote)
    message.value = ''

    // 重新合并笔记
    mergeNotes()

    // 滚动到底部
    setTimeout(() => {
        if (notesList.value) {
            notesList.value.scrollTop = notesList.value.scrollHeight
        }
    }, 0)
    
    // 加密并保存用户添加的情思
    saveUserNotes()
    
    // 同步到服务器
    syncFeelingsToServer()

    // 确保面板保持展开状态
    isExpanded.value = true
}

// 同步情思到本地服务器
const syncFeelingsToServer = async () => {
    try {
        // 设置同步状态
        syncStatus.value = 'syncing';
        
        // 准备数据
        const allFeelings = [...baseNotes.value, ...additionalNotes.value]
            .sort((a, b) => a.timestamp - b.timestamp);
            
        // 发送到服务器 - 更新端口为3031
        const response = await fetch('http://localhost:3031/api/save-feelings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ feelings: allFeelings })
        });
        
        const result = await response.json();
        
        if (result.success) {
            syncStatus.value = 'success';
        } else {
            throw new Error(result.message || '同步失败');
        }
    } catch (error) {
        console.error('同步情思数据失败:', error);
        syncStatus.value = 'error';
    } finally {
        // 3秒后清除状态
        if (syncTimeout.value) {
            clearTimeout(syncTimeout.value);
        }
        syncTimeout.value = setTimeout(() => {
            syncStatus.value = 'idle';
        }, 3000);
    }
};

// 加密并保存用户添加的情思
const saveUserNotes = () => {
    try {
        // 创建加密数据
        const encrypted = encryptData(additionalNotes.value)
        // 保存加密数据
        localStorage.setItem('encrypted-user-feelings', encrypted)
        // 保存签名
        const signature = createSignature(additionalNotes.value)
        localStorage.setItem('user-feelings-signature', signature)
    } catch (error) {
        console.error('保存用户情思失败', error)
    }
}

// 监听用户添加的情思变化，保存到localStorage
watch(additionalNotes, saveUserNotes, { deep: true })

// 处理用户ID输入框的键盘输入
const handleKeyDownUserId = (e) => {
    // 允许这些键的默认行为
    if (
        // 字母和数字
        /^[a-zA-Z0-9]$/.test(e.key) || 
        // 中文输入
        e.key === 'Process' || 
        // 控制键
        e.key === 'Backspace' || 
        e.key === 'Delete' || 
        e.key === 'ArrowLeft' || 
        e.key === 'ArrowRight' || 
        e.key === 'Home' || 
        e.key === 'End'
    ) {
        // 不做任何阻止，允许默认行为
        return true;
    }
    
    // 阻止其他所有键的默认行为
    e.preventDefault();
    return false;
}

// 处理情思输入框的键盘输入
const handleKeyDownMessage = (e) => {
    // 允许这些键的默认行为
    if (
        // 字母、数字、特殊字符
        /^[a-zA-Z0-9~`!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/\s]$/.test(e.key) || 
        // 中文输入
        e.key === 'Process' || 
        // 控制键
        e.key === 'Backspace' || 
        e.key === 'Delete' || 
        e.key === 'ArrowLeft' || 
        e.key === 'ArrowRight' || 
        e.key === 'ArrowUp' || 
        e.key === 'ArrowDown' || 
        e.key === 'Home' || 
        e.key === 'End'
    ) {
        // 不做任何阻止，允许默认行为
        return true;
    }
    
    // 回车键处理
    if (e.key === 'Enter') {
        addNote();
        e.preventDefault();
        return false;
    }
    
    // 阻止其他所有键的默认行为
    e.preventDefault();
    return false;
}

// 添加中文输入法支持
const isComposing = ref(false)

onMounted(() => {
    // 解密基础情思数据
    decryptBaseNotes()

    // 从localStorage加载用户添加的情思
    try {
        const encryptedUserFeelings = localStorage.getItem('encrypted-user-feelings')
        const userFeelingsSignature = localStorage.getItem('user-feelings-signature')

        if (encryptedUserFeelings && userFeelingsSignature) {
            // 解密用户数据
            const decryptedData = decryptData(encryptedUserFeelings)
            const userData = JSON.parse(decryptedData)

            // 验证签名
            if (verifySignature(userData, userFeelingsSignature)) {
                additionalNotes.value = userData
            } else {
                console.error('用户情思签名验证失败，数据可能已被篡改')
                additionalNotes.value = []
            }
        }
    } catch (error) {
        console.error('加载用户情思数据失败', error)
        additionalNotes.value = []
    }

    // 合并基础情思和用户添加的情思
    mergeNotes()

    // 添加全局点击事件监听
    document.addEventListener('click', closePanel)

    // 滚动到底部
    setTimeout(() => {
        if (notesList.value) {
            notesList.value.scrollTop = notesList.value.scrollHeight
        }
    }, 0)

    // 添加中文输入法事件监听
    const userIdInput = document.querySelector('.user-id-input')
    const messageInput = document.querySelector('.message-input')

    if (userIdInput) {
        userIdInput.addEventListener('compositionstart', () => { isComposing.value = true })
        userIdInput.addEventListener('compositionend', () => { isComposing.value = false })
    }

    if (messageInput) {
        messageInput.addEventListener('compositionstart', () => { isComposing.value = true })
        messageInput.addEventListener('compositionend', () => { isComposing.value = false })
    }

    // 防止发送按钮点击事件冒泡到document
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
})

onUnmounted(() => {
    // 移除全局点击事件监听
    document.removeEventListener('click', closePanel)

    // 移除中文输入法事件监听
    const userIdInput = document.querySelector('.user-id-input')
    const messageInput = document.querySelector('.message-input')
    
    if (userIdInput) {
        userIdInput.removeEventListener('compositionstart', () => { isComposing.value = true })
        userIdInput.removeEventListener('compositionend', () => { isComposing.value = false })
    }

    if (messageInput) {
        messageInput.removeEventListener('compositionstart', () => { isComposing.value = true })
        messageInput.removeEventListener('compositionend', () => { isComposing.value = false })
    }

    // 移除发送按钮的事件监听器
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.removeEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
})
</script>

<style scoped>
.notebook-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.notebook-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: all 0.3s ease;
    animation: glow 5s ease-in-out infinite;
    box-shadow: 0 0 15px rgba(246, 100, 166, 0.5);
    opacity: 0.25;
    position: relative;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.notebook-button .icon {
    font-size: 20px;
    animation: sparkle 12s linear infinite;
}

.notebook-button:hover {
    opacity: 1;
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(246, 100, 166, 0.8);
}

@keyframes sparkle {
    0% {
        transform: scale(1) rotate(0deg);
    }

    25% {
        transform: scale(1.1) rotate(90deg);
    }

    50% {
        transform: scale(1) rotate(180deg);
    }

    75% {
        transform: scale(1.1) rotate(270deg);
    }

    100% {
        transform: scale(1) rotate(360deg);
    }
}

@keyframes glow {
    0% {
        box-shadow: 0 0 15px rgba(246, 100, 166, 0.5);
    }

    50% {
        box-shadow: 0 0 25px rgba(246, 100, 166, 0.8);
    }

    100% {
        box-shadow: 0 0 15px rgba(246, 100, 166, 0.5);
    }
}

.notebook-panel {
    position: absolute;
    top: 50px;
    right: 0;
    width: 210px;
    height: 280px;
    background: rgba(40, 25, 35, 0.92);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 2px solid #af85a2;
    box-shadow:
        5px 0 15px rgba(246, 100, 166, 0.4),
        10px 0 25px rgba(150, 90, 120, 0.3),
        inset 0 0 20px rgba(246, 100, 166, 0.2);
    font-family: Microsoft Yahei;
    opacity: 0.92;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-touch-callout: none;
    touch-callout: none;
}

.notebook-panel-enter-active {
    animation: clipSectorIn 0.3s ease-in-out;
}

.notebook-panel-leave-active {
    animation: shatter-out 0.3s ease-in forwards;
}

@keyframes clipSectorIn {
    0% {
        clip-path: polygon(50% 100%, 50% 0%, 0% 0%, 100% 0%, 50% 0%);
        opacity: 0;
    }

    70% {
        clip-path: polygon(50% 100%, 0% 0%, 0% 0%, 100% 0%, 100% 0%);
        opacity: 0.5;
    }

    100% {
        clip-path: polygon(50% 100%, 0% 100%, 0% 0%, 100% 0%, 100% 100%);
        opacity: 1;
    }
}

@keyframes shatter-out {
    0% {
        clip-path: polygon(50% 100%, 0% 100%, 0% 0%, 100% 0%, 100% 100%);
        opacity: 1;
    }

    30% {
        clip-path: polygon(50% 100%, 0% 0%, 0% 0%, 100% 0%, 100% 0%);
        opacity: 0.5;
    }

    100% {
        clip-path: polygon(50% 100%, 50% 0%, 0% 0%, 100% 0%, 50% 0%);
        opacity: 0;
    }
}

.notebook-header {
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(90deg, rgb(191 99 140 / 90%) 0%, rgb(97 32 69 / 90%) 100%);
    border-bottom: 2px solid #3a2a35;
}

.notebook-header h3 {
    margin: 0;
    color: #f9d5e5;
    font-size: 14px;
    font-family: 'Arial', sans-serif;
    letter-spacing: 1px;
    font-weight: bold;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.close-btn {
    width: 20px;
    height: 20px;
    background: #d14d72;
    border: 1px solid #aa819d;
    color: #f9d5e5;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: #ff6b8b;
    transform: scale(1.05);
}

.notes-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    background: rgba(60, 40, 50, 0.7);
}

.note-item {
    cursor: pointer;
    margin-bottom: 8px;
    background: rgba(70, 45, 60, 0.9);
    border-radius: 4px;
    padding: 8px;
    border: 1px solid rgba(246, 100, 166, 0.3);
    transition: all 0.3s ease;
    box-shadow: 2px 2px 0 rgba(246, 100, 166, 0.2);
    font-size: 14px;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.note-item[data-need-spacing="true"] {
    margin-top: 15px;
    border-top: 1px dashed rgba(246, 100, 166, 0.3);
    padding-top: 12px;
}

.note-item:hover {
    background: rgba(85, 55, 75, 0.95);
    border-color: rgba(246, 100, 166, 0.5);
    transform: translateX(2px);
}

.note-content {
    margin-left: 4px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.user-id {
    color: #f7a8c9;
    font-weight: bold;
    margin-right: 8px;
    text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.5);
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.message {
    color: #f9d5e5;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.note-time {
    font-size: 11px;
    color: #de8eb5;
    text-align: right;
    margin-top: 4px;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.input-area {
    padding: 8px;
    background: rgba(55, 35, 45, 0.9);
    border-top: 2px solid #3a2a35;
}

.input-group {
    display: flex;
    gap: 6px;
    width: 100%;
}

.user-id-input {
    flex: 3;
    min-width: 0; /* 防止flex item溢出 */
}

.message-input {
    flex: 6;
    min-width: 0; /* 防止flex item溢出 */
}

.send-btn {
    flex: 1;
    min-width: 0; /* 防止flex item溢出 */
}

.user-id-input,
.message-input {
    background: rgba(80, 50, 65, 0.9);
    border: 1px solid rgba(246, 100, 166, 0.3);
    border-radius: 4px;
    padding: 6px 8px;
    color: #f9d5e5;
    font-size: 12px;
    transition: all 0.3s ease;
}

.user-id-input:focus,
.message-input:focus {
    outline: none;
    border-color: rgba(246, 100, 166, 0.6);
    box-shadow: 2px 2px 0 rgba(246, 100, 166, 0.2);
}

.user-id-input::placeholder,
.message-input::placeholder {
    font-family: Microsoft Yahei;
    color: #de8eb5;
    opacity: 0.6;
}

.send-btn {
    background: linear-gradient(45deg, rgb(198 164 179 / 90%), rgba(140, 70, 110, 0.9));
    border: 1px solid #3a2a35;
    border-radius: 4px;
    color: #f9d5e5;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    box-shadow: 2px 2px 0 rgba(246, 100, 166, 0.2);
    outline: none;
}

.send-btn:focus {
    outline: none;
}

.send-btn:hover {
    transform: translateY(-1px);
    box-shadow: 2px 3px 0 rgba(246, 100, 166, 0.3);
}

.notes-list::-webkit-scrollbar {
    width: 5px;
}

.notes-list::-webkit-scrollbar-track {
    background: rgba(60, 40, 50, 0.3);
    border-radius: 10px;
    margin: 4px 0;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
}

.notes-list::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(246, 100, 166, 0.7), rgba(186, 78, 132, 0.9));
    border-radius: 10px;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
}

.notes-list::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(246, 100, 166, 0.9), rgba(186, 78, 132, 1));
    box-shadow: 0 0 5px rgba(246, 100, 166, 0.5);
}

/* Firefox滚动条样式 */
.notes-list {
    scrollbar-width: thin;
    scrollbar-color: rgba(246, 100, 166, 0.7) rgba(60, 40, 50, 0.3);
}

@media (max-width: 768px) {
    .notebook-panel {
        width: 196px;
    }
}

@media (max-width: 480px) {
    .notebook-panel {
        width: 182px;
    }
}

/* 中等屏幕（笔记本电脑） */
@media (min-width: 769px) and (max-width: 1024px) {
    .notebook-container {
        top: 25px;
        right: 25px;
    }
    
    .notebook-button {
        width: 44px;
        height: 44px;
    }
    
    .notebook-button .icon {
        font-size: 22px;
    }
    
    .notebook-panel {
        width: 350px;
        height: 315px;
        top: 55px;
        border-radius: 10px;
        border-width: 2px;
    }
    
    .notebook-header {
        padding: 10px 15px;
    }
    
    .notebook-header h3 {
        font-size: 16px;
    }
    
    .close-btn {
        width: 22px;
        height: 22px;
        font-size: 15px;
    }
    
    .notes-list {
        padding: 14px;
    }
    
    .note-item {
        padding: 10px;
        font-size: 15px;
        margin-bottom: 10px;
    }
    
    .note-content {
        font-size: 14px;
    }
    
    .note-time {
        font-size: 12px;
    }
    
    .input-area {
        padding: 10px;
    }
    
    .input-group {
        gap: 8px;
    }
    
    .user-id-input, .message-input {
        padding: 9px 12px;
        font-size: 15px;
    }
    
    .send-btn {
        width: 32px;
        height: 32px;
        font-size: 14px;
    }
}

/* 大屏幕（桌面） */
@media (min-width: 1025px) and (max-width: 1440px) {
    .notebook-container {
        top: 35px;
        right: 35px;
    }
    
    .notebook-button {
        width: 60px;
        height: 60px;
    }
    
    .notebook-button .icon {
        font-size: 28px;
    }
    
    .notebook-panel {
        width: 375px;
        height: 385px;
        top: 70px;
        border-radius: 12px;
        border-width: 2.5px;
    }
    
    .notebook-header {
        padding: 12px 18px;
    }
    
    .notebook-header h3 {
        font-size: 18px;
        letter-spacing: 1.5px;
    }
    
    .close-btn {
        width: 26px;
        height: 26px;
        font-size: 16px;
    }
    
    .notes-list {
        padding: 18px;
    }
    
    .note-item {
        padding: 12px;
        font-size: 16px;
        margin-bottom: 12px;
        border-radius: 6px;
    }
    
    .note-content {
        font-size: 14px;
    }
    
    .note-time {
        font-size: 13px;
        margin-top: 6px;
    }
    
    .input-area {
        padding: 12px;
    }
    
    .input-group {
        gap: 10px;
    }
    
    .user-id-input, .message-input {
        padding: 10px 14px;
        font-size: 16px;
        border-radius: 6px;
    }
    
    .send-btn {
        width: 38px;
        height: 38px;
        font-size: 16px;
        border-radius: 6px;
    }
    
    .date-divider {
        margin: 16px 0;
        gap: 12px;
    }
    
    .divider-date {
        font-size: 13px;
        padding: 3px 10px;
    }
    
    .notes-list::-webkit-scrollbar {
        width: 7px;
    }
}

/* 超大屏幕（大型桌面） */
@media (min-width: 1441px) and (max-width: 1920px) {
    .notebook-container {
        top: 45px;
        right: 45px;
    }
    
    .notebook-button {
        width: 70px;
        height: 70px;
    }
    
    .notebook-button .icon {
        font-size: 34px;
    }
    
    .notebook-panel {
        width: 405px;
        height: 455px;
        top: 85px;
        border-radius: 15px;
        border-width: 3px;
    }
    
    .notebook-header {
        padding: 15px 22px;
        border-bottom-width: 3px;
    }
    
    .notebook-header h3 {
        font-size: 22px;
        letter-spacing: 2px;
    }
    
    .close-btn {
        width: 30px;
        height: 30px;
        font-size: 18px;
        border-radius: 5px;
    }
    
    .notes-list {
        padding: 22px;
    }
    
    .note-item {
        padding: 14px;
        font-size: 18px;
        margin-bottom: 14px;
        border-radius: 8px;
        border-width: 2px;
    }
    
    .note-content {
        font-size: 14px;
    }
    
    .note-time {
        font-size: 15px;
        margin-top: 8px;
    }
    
    .input-area {
        padding: 15px;
        border-top-width: 3px;
    }
    
    .input-group {
        gap: 12px;
    }
    
    .user-id-input, .message-input {
        padding: 12px 16px;
        font-size: 18px;
        border-radius: 8px;
        border-width: 2px;
    }
    
    .user-id-input {
        width: 80px;
    }
    
    .send-btn {
        width: 45px;
        height: 45px;
        font-size: 18px;
        border-radius: 8px;
        border-width: 2px;
    }
    
    .date-divider {
        margin: 20px 0;
        gap: 15px;
    }
    
    .divider-date {
        font-size: 15px;
        padding: 4px 12px;
        border-radius: 12px;
    }
    
    .notes-list::-webkit-scrollbar {
        width: 8px;
    }
}

/* 超大屏幕 4K */
@media (min-width: 1921px) and (max-width: 2560px) {
    .notebook-container {
        top: 60px;
        right: 60px;
    }
    
    .notebook-button {
        width: 85px;
        height: 85px;
    }
    
    .notebook-button .icon {
        font-size: 42px;
    }
    
    .notebook-panel {
        width: 520px;
        height: 560px;
        top: 100px;
        border-radius: 18px;
        border-width: 4px;
    }
    
    .notebook-header {
        padding: 18px 25px;
        border-bottom-width: 4px;
    }
    
    .notebook-header h3 {
        font-size: 26px;
        letter-spacing: 2.5px;
    }
    
    .close-btn {
        width: 36px;
        height: 36px;
        font-size: 22px;
        border-radius: 6px;
    }
    
    .notes-list {
        padding: 28px;
    }
    
    .note-item {
        padding: 18px;
        font-size: 22px;
        margin-bottom: 18px;
        border-radius: 10px;
        border-width: 2.5px;
    }
    
    .note-content {
        font-size: 19px;
    }
    
    .note-time {
        font-size: 18px;
        margin-top: 10px;
    }
    
    .input-area {
        padding: 18px;
        border-top-width: 4px;
    }
    
    .input-group {
        gap: 15px;
    }
    
    .user-id-input, .message-input {
        padding: 15px 20px;
        font-size: 22px;
        border-radius: 10px;
        border-width: 2.5px;
    }
    
    .user-id-input {
        width: 100px;
    }
    
    .send-btn {
        width: 54px;
        height: 54px;
        font-size: 22px;
        border-radius: 10px;
        border-width: 2.5px;
    }
    
    .date-divider {
        margin: 24px 0;
        gap: 18px;
    }
    
    .divider-date {
        font-size: 18px;
        padding: 5px 15px;
        border-radius: 15px;
    }
    
    .notes-list::-webkit-scrollbar {
        width: 10px;
    }
}

.date-divider {
    display: flex;
    align-items: center;
    margin: 12px 0;
    gap: 10px;
    color: #f7a8c9;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(246, 100, 166, 0.5), transparent);
}

.divider-date {
    font-size: 12px;
    padding: 0 8px;
    text-align: center;
    color: #de8eb5;
    background: rgba(70, 45, 60, 0.9);
    border-radius: 10px;
    padding: 2px 8px;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.sync-status {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 11px;
}

.sync-message {
    padding: 2px 6px;
    border-radius: 10px;
    animation: fadeIn 0.3s ease;
}

.sync-message.syncing {
    background: rgba(100, 149, 237, 0.3);
    color: #add8e6;
}

.sync-message.success {
    background: rgba(50, 205, 50, 0.3);
    color: #90ee90;
}

.sync-message.error {
    background: rgba(220, 20, 60, 0.3);
    color: #ffb6c1;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 添加notebook-panel高度减少的媒体查询 */
@media (max-width: 1999px) {
  .notebook-button {
    width: 28px;
    height: 28px;
  }

  .notebook-button .icon {
    font-size: 14px;
  }

  .notebook-panel {
    height: 196px;
  }

  .notebook-header {
    padding: 6px 9px;
  }

  .notebook-header h3 {
    font-size: 10px;
  }

  .notes-list {
    padding: 8px;
  }

  .note-item {
    padding: 6px;
    margin-bottom: 6px;
    font-size: 10px;
  }

  .note-time {
    font-size: 8px;
    margin-top: 3px;
  }

  .input-area {
    padding: 6px;
  }

  .input-group {
    gap: 4px;
  }

  .user-id-input, .message-input {
    padding: 4px 6px;
    font-size: 8px;
  }

  .user-id-input {
    width: 28px;
  }

  .send-btn {
    width: 21px;
    height: 21px;
    font-size: 8px;
  }

  /* 大屏幕（桌面） */
  @media (min-width: 1025px) and (max-width: 1440px) {
    .notebook-button {
      width: 42px;
      height: 42px;
    }

    .notebook-button .icon {
      font-size: 20px;
    }

    .notebook-panel {
      width: 280px;
      height: 270px;
      top: 49px;
    }

    .notebook-header {
      padding: 8px 13px;
    }

    .notebook-header h3 {
      font-size: 13px;
    }

    .notes-list {
      padding: 13px;
    }

    .note-item {
      padding: 8px;
      font-size: 11px;
      margin-bottom: 8px;
    }

    .note-time {
      font-size: 9px;
      margin-top: 4px;
    }

    .input-area {
      padding: 8px;
    }

    .input-group {
      gap: 7px;
    }

    .user-id-input, .message-input {
      padding: 7px 10px;
      font-size: 11px;
    }

    .send-btn {
      width: 27px;
      height: 27px;
      font-size: 11px;
    }
  }

  /* 超大屏幕（大型桌面） */
  @media (min-width: 1441px) and (max-width: 1920px) {
    .notebook-button {
      width: 49px;
      height: 49px;
    }

    .notebook-button .icon {
      font-size: 24px;
    }

    .notebook-panel {
      width: 570px;
      height: 318px;
      top: 60px;
    }

    .notebook-header {
      padding: 10px 15px;
    }

    .notebook-header h3 {
      font-size: 15px;
    }

    .notes-list {
      padding: 15px;
    }

    .note-item {
      padding: 10px;
      font-size: 13px;
      margin-bottom: 10px;
    }

    .note-time {
      font-size: 11px;
      margin-top: 6px;
    }

    .input-area {
      padding: 10px;
    }

    .input-group {
      gap: 8px;
    }

    .user-id-input, .message-input {
      padding: 8px 11px;
      font-size: 13px;
    }

    .user-id-input {
      width: 56px;
    }

    .send-btn {
      width: 32px;
      height: 32px;
      font-size: 13px;
    }
  }
}
</style>