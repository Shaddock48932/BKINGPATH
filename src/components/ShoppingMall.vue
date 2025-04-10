<!-- ShoppingMall组件 -->
<template>

    
    <transition name="shopping-panel">
        <div class="shopping-panel" v-if="isExpanded" ref="panel" @click.stop>
            <div class="shopping-header">
                <h3>商品商城</h3>
                <div class="coins-display">
                    <span class="coin-icon">💸</span>
                    <span class="coin-amount">{{ coins }}</span>
                </div>
                <button class="close-btn" @click="closeShoppingMall">
                    <span class="fas fa-times">✘</span>
                </button>
            </div>

            <div class="tab-navigation">
                <button 
                    class="tab-button" 
                    :class="{ active: activeTab === 'products' }" 
                    @click="activeTab = 'products'">
                    商品列表
                </button>
                <button 
                    class="tab-button" 
                    :class="{ active: activeTab === 'purchases' }" 
                    @click="activeTab = 'purchases'; loadPurchaseHistory()">
                    购买记录
                </button>
            </div>

            <div v-if="activeTab === 'products'" class="products-list" ref="productsList">
                <div v-if="products.length === 0" class="empty-products">
                    <p>暂无商品可购买</p>
                </div>
                <ul v-else>
                    <li v-for="product in products" :key="product.id" class="product-item">
                        <div class="product-info">
                            <h4 class="product-name">{{ product.name }}</h4>
                            <p class="product-description">{{ product.description }}</p>
                        </div>
                        <div class="product-price-section">
                            <span class="product-price">{{ product.price }} 💸</span>
                            <button 
                                class="buy-btn" 
                                @click="purchaseProduct(product)"
                                :disabled="coins < product.price || purchaseInProgress"
                                :class="{ 'disabled': coins < product.price }"
                            >
                                {{ coins < product.price ? '金币不足' : '购买' }}
                            </button>
                        </div>
                    </li>
                </ul>
            </div>

            <div v-if="activeTab === 'purchases'" class="purchase-history">
                <div v-if="purchaseHistory.length === 0" class="empty-history">
                    <p>暂无购买记录</p>
                </div>
                <ul v-else>
                    <li v-for="(purchase, index) in purchaseHistory" :key="index" class="purchase-item">
                        <div class="purchase-info">
                            <h4 class="purchase-name">{{ purchase.productName }}</h4>
                            <p class="purchase-date">购买时间: {{ formatDate(purchase.purchaseDate) }}</p>
                        </div>
                        <div class="purchase-price">{{ purchase.price }} 💸</div>
                    </li>
                </ul>
            </div>

            <div class="admin-section" v-if="isAdmin">
                <h4>添加新商品</h4>
                <div class="input-group">
                    <input type="text" v-model="newProduct.name" placeholder="商品名称" class="product-input">
                    <input type="text" v-model="newProduct.description" placeholder="商品描述" class="product-input">
                    <input type="number" v-model.number="newProduct.price" placeholder="价格" class="price-input">
                    <button class="add-btn" @click="addProduct" :disabled="!canAddProduct">
                        添加
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, inject } from 'vue'

// 注入音效和金币函数
const playTouchSound = inject('playTouchSound')
const playButtonSound = inject('playButtonSound')
const addCoins = inject('addCoins')
const coins = inject('coins') // 使用正确的金币数据注入

// 状态变量
const isExpanded = ref(false)
const panel = ref(null)
const productsList = ref(null)
const products = ref([])
const purchaseInProgress = ref(false)
const isAdmin = ref(false) // 开发环境下可以设为true
const activeTab = ref('products') // 默认显示商品列表
const purchaseHistory = ref([]) // 购买记录

// 新商品表单
const newProduct = ref({
    name: '',
    description: '',
    price: 0
})

// 是否可以添加商品
const canAddProduct = computed(() => {
    return newProduct.value.name.trim() !== '' && 
           newProduct.value.description.trim() !== '' && 
           newProduct.value.price > 0
})

// Props和自定义事件
const props = defineProps({
    showShoppingMall: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:showShoppingMall'])

// 关闭商城面板
const closeShoppingMall = () => {
    emit('update:showShoppingMall', false)
    playButtonSound()
}

// 加载商品列表
const loadProducts = async () => {
    // 首先设置默认商品，确保即使API失败也有商品显示
    const defaultProducts = [
    { id: 1, name: "amuse SUNDAY", description: "星期天", price: 4490 },
    ]
    
    // 预先显示默认商品
    products.value = [...defaultProducts]
    
    try {
        console.log('开始从服务器加载商品列表...')
        // 尝试从服务器获取商品列表
        const response = await fetch('http://localhost:3031/api/get-products')
        
        if (response.ok) {
            const result = await response.json()
            if (result && result.data && Array.isArray(result.data)) {
                console.log('成功从服务器加载商品:', result.data.length)
                products.value = result.data
            } else if (Array.isArray(result)) {
                console.log('成功从服务器加载商品:', result.length)
                products.value = result
            } else {
                console.log('服务器返回的数据格式不正确，使用默认商品')
            }
        } else {
            console.log('服务器响应错误，状态码:', response.status, '使用默认商品')
        }
    } catch (error) {
        console.error('加载商品时发生错误:', error)
        console.log('由于错误，将使用默认商品')
    }
}

// 格式化日期
const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 加载购买记录
const loadPurchaseHistory = async () => {
    try {
        console.log('加载购买记录...')
        
        // 尝试从服务器获取购买记录
        const response = await fetch('http://localhost:3031/api/get-purchase-history')
        
        if (response.ok) {
            const result = await response.json()
            if (result && result.data && Array.isArray(result.data)) {
                console.log('成功从服务器加载购买记录:', result.data.length)
                purchaseHistory.value = result.data
            } else if (Array.isArray(result)) {
                console.log('成功从服务器加载购买记录:', result.length)
                purchaseHistory.value = result
            } else {
                console.log('服务器返回的数据格式不正确，使用本地存储')
                loadPurchaseHistoryFromLocalStorage()
            }
        } else {
            console.log('服务器响应错误，状态码:', response.status, '使用本地存储')
            loadPurchaseHistoryFromLocalStorage()
        }
    } catch (error) {
        console.error('加载购买记录时发生错误:', error)
        loadPurchaseHistoryFromLocalStorage()
    }
}

// 从本地存储加载购买记录
const loadPurchaseHistoryFromLocalStorage = () => {
    const savedHistory = localStorage.getItem('purchaseHistory')
    if (savedHistory) {
        try {
            purchaseHistory.value = JSON.parse(savedHistory)
            console.log('从本地存储加载购买记录:', purchaseHistory.value.length)
        } catch (e) {
            console.error('解析本地购买记录时出错:', e)
            purchaseHistory.value = []
        }
    } else {
        console.log('本地存储中无购买记录')
        purchaseHistory.value = []
    }
}

// 保存购买记录到本地存储
const savePurchaseToLocalStorage = (productData) => {
    const purchase = {
        productId: productData.id,
        productName: productData.name,
        price: productData.price,
        purchaseDate: new Date().toISOString()
    }
    
    let savedHistory = []
    try {
        const historyData = localStorage.getItem('purchaseHistory')
        if (historyData) {
            savedHistory = JSON.parse(historyData)
        }
    } catch (e) {
        console.error('解析本地购买记录时出错:', e)
    }
    
    savedHistory.push(purchase)
    localStorage.setItem('purchaseHistory', JSON.stringify(savedHistory))
    
    // 如果当前在购买记录页面，更新显示
    if (activeTab.value === 'purchases') {
        purchaseHistory.value = savedHistory
    }
}

// 修改购买商品函数以保存购买记录
const purchaseProduct = async (product) => {
    if (coins.value < product.price || purchaseInProgress.value) {
        return
    }
    
    playButtonSound()
    purchaseInProgress.value = true
    
    try {
        // 扣除金币
        await addCoins(-product.price)
        
        // 调用购买API
        const response = await fetch('http://localhost:3031/api/purchase-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: product.id,
                price: product.price
            })
        });
        
        if (response.ok) {
            // 保存购买记录到本地
            savePurchaseToLocalStorage(product)
            
            const successMessage = document.createElement('div')
            successMessage.className = 'purchase-success'
            successMessage.textContent = `成功购买: ${product.name}`
            document.body.appendChild(successMessage)
            
            // 3秒后移除提示
            setTimeout(() => {
                successMessage.classList.add('fade-out')
                setTimeout(() => {
                    document.body.removeChild(successMessage)
                }, 500)
            }, 2500)
        } else {
            // 购买失败时返还金币
            await addCoins(product.price)
            alert('购买失败，请稍后再试')
        }
    } catch (error) {
        console.error('购买商品失败:', error)
        // 出错时返还金币
        await addCoins(product.price)
        alert('购买失败，请稍后再试')
    } finally {
        purchaseInProgress.value = false
    }
}

// 添加新商品
const addProduct = async () => {
    if (!canAddProduct.value) return
    
    const newProductData = {
        id: Date.now(),
        name: newProduct.value.name.trim(),
        description: newProduct.value.description.trim(),
        price: newProduct.value.price
    }
    
    try {
        // 调用添加商品API
        const response = await fetch('http://localhost:3031/api/add-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProductData)
        });
        
        if (response.ok) {
            // 添加到本地列表
            products.value.push(newProductData)
            // 清空表单
            newProduct.value = { name: '', description: '', price: 0 }
            playButtonSound()
        } else {
            alert('添加商品失败，请稍后再试')
        }
    } catch (error) {
        console.error('添加商品失败:', error)
        // 添加到本地列表，即使API失败
        products.value.push(newProductData)
        // 清空表单
        newProduct.value = { name: '', description: '', price: 0 }
    }
}

// 点击外部关闭面板
const handleClickOutside = (e) => {
    // 检查是否点击了商城图标
    const shoppingBtn = document.querySelector('.shopping-mall-icon');
    if (shoppingBtn && (shoppingBtn === e.target || shoppingBtn.contains(e.target))) {
        return; // 如果点击了商城图标，在App.vue中处理
    }
    
    // 检查是否点击了面板外部
    if (panel.value && !panel.value.contains(e.target) && props.showShoppingMall) {
        closeShoppingMall();
    }
}

// 同步外部showShoppingMall和内部isExpanded
watch(() => props.showShoppingMall, (newValue) => {
    console.log('ShoppingMall Props变化:', newValue)
    isExpanded.value = newValue
}, { immediate: true })

// 监听isExpanded变化，处理面板显示时的操作
watch(isExpanded, (newValue) => {
    console.log('isExpanded变化:', newValue)
    if (newValue) {
        // 面板显示时加载商品
        loadProducts()
        
        // 滚动到顶部
        setTimeout(() => {
            if (productsList.value) {
                productsList.value.scrollTop = 0
            }
        }, 50)
    }
})

onMounted(() => {
    console.log('ShoppingMall组件挂载, showShoppingMall:', props.showShoppingMall, 'isExpanded:', isExpanded.value)
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

// 导出组件方法
defineExpose({
    closeShoppingMall
})
</script>

<style scoped>
.shopping-container {
    position: fixed;
    right: 30px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    display: block; /* 确保容器显示 */
}

.shopping-panel {
    position: fixed;
    top: 70px;
    left: calc(5vw + 130px); /* Position after money-box (110px) and todolist-icon (40px) */
    width: 400px;
    max-height: 500px;
    background: rgba(244, 250, 244, 0.95);
    border-radius: 15px;
    box-shadow: 3px 4px 0 rgba(70, 120, 70, 0.4), 0 8px 20px rgba(0, 40, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    color: #466c46;
    border: 2px dashed rgba(70, 120, 70, 0.5);
    overflow: hidden;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    transform-origin: top center;
}

.shopping-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z' fill='rgba(70, 120, 70, 0.05)' fill-rule='evenodd'/%3E%3C/svg%3E"),
        radial-gradient(circle at top right, rgba(220, 255, 220, 0.3) 0%, rgba(244, 250, 244, 0) 70%);
    pointer-events: none;
}

.shopping-header {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 2px dotted rgba(70, 120, 70, 0.3);
    position: relative;
    background: rgba(230, 245, 230, 0.8);
}

.shopping-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, 
                rgba(0, 200, 0, 0) 0%, 
                rgba(100, 255, 100, 0.5) 50%, 
                rgba(0, 200, 0, 0) 100%);
}

.shopping-header h3 {
    margin: 0;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-weight: bold;
    font-size: 20px;
    color: #466c46;
    flex-grow: 1;
    text-align: center;
}

.coins-display {
    display: flex;
    align-items: center;
    margin-right: 10px;
    padding: 5px 10px;
    background: rgba(0, 50, 0, 0.5);
    border-radius: 12px;
    font-weight: bold;
}

.coin-icon {
    margin-right: 5px;
    color: #FFD700;
}

.coin-amount {
    color: #FFD700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.close-btn {
    background: transparent;
    border: none;
    color: rgba(200, 255, 200, 0.7);
    cursor: pointer;
    font-size: 16px;
    padding: 5px;
    transition: all 0.2s;
}

.close-btn:hover {
    color: rgba(255, 255, 255, 0.9);
    transform: scale(1.1);
}

.tab-navigation {
    display: flex;
    border-bottom: 2px dotted rgba(70, 120, 70, 0.3);
    background: rgba(210, 240, 210, 0.6);
}

.tab-button {
    flex: 1;
    padding: 10px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: rgba(70, 108, 70, 0.7);
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    outline: none;
}

.tab-button:hover {
    background: rgba(200, 235, 200, 0.6);
    color: #466c46;
}

.tab-button:focus {
    outline: none;
}

.tab-button.active {
    border-bottom: 3px solid #69b069;
    color: #466c46;
    background: rgba(190, 230, 190, 0.8);
}

.products-list {
    flex-grow: 1;
    overflow-y: auto;
    padding: 15px;
    scrollbar-width: thin;
    scrollbar-color: rgba(70, 120, 70, 0.5) rgba(244, 250, 244, 0.5);
    background: repeating-linear-gradient(
        45deg,
        rgba(244, 250, 244, 0.4),
        rgba(244, 250, 244, 0.4) 10px,
        rgba(230, 245, 230, 0.4) 10px,
        rgba(230, 245, 230, 0.4) 20px
    );
}

.products-list::-webkit-scrollbar {
    width: 6px;
}

.products-list::-webkit-scrollbar-track {
    background: rgba(0, 30, 0, 0.2);
    border-radius: 3px;
}

.products-list::-webkit-scrollbar-thumb {
    background-color: rgba(100, 200, 100, 0.5);
    border-radius: 3px;
}

.empty-products {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: rgba(200, 255, 200, 0.5);
    font-style: italic;
}

.product-item {
    list-style: none;
    margin-bottom: 15px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    border: 1px solid rgba(70, 120, 70, 0.3);
    transition: all 0.2s;
    position: relative;
    box-shadow: 2px 2px 0 rgba(70, 120, 70, 0.2);
}

.product-item:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px) rotate(0.5deg);
    box-shadow: 3px 3px 0 rgba(70, 120, 70, 0.3);
}

.product-info {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 15px;
}

.product-name {
    margin: 0;
    color: #466c46;
    font-size: 18px;
    font-weight: bold;
    flex-shrink: 0;
    min-width: 120px;
}

.product-description {
    margin: 0;
    color: rgba(70, 120, 70, 0.8);
    font-size: 14px;
    line-height: 1.4;
    flex: 1;
}

.product-price-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed rgba(70, 120, 70, 0.2);
}

.product-price {
    font-weight: bold;
    color: #b8860b;
    font-size: 16px;
    background: rgba(255, 250, 220, 0.8);
    padding: 3px 8px;
    border-radius: 10px;
    border: 1px solid rgba(184, 134, 11, 0.3);
}

.buy-btn {
    background: rgba(230, 245, 230, 0.9);
    border: 2px solid rgba(70, 120, 70, 0.5);
    color: #466c46;
    padding: 6px 15px;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 15px;
    font-weight: bold;
    box-shadow: 1px 1px 0 rgba(70, 120, 70, 0.3);
    font-family: 'Comic Sans MS', cursive, sans-serif;
}

.buy-btn:hover:not(.disabled) {
    background: rgba(210, 240, 210, 0.9);
    transform: translateY(-1px) rotate(1deg);
    box-shadow: 2px 2px 0 rgba(70, 120, 70, 0.4);
}

.buy-btn:active:not(.disabled) {
    transform: scale(0.95) rotate(-1deg);
    box-shadow: 1px 1px 0 rgba(70, 120, 70, 0.2);
}

.buy-btn.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: rgba(200, 200, 200, 0.5);
    color: rgba(100, 100, 100, 0.8);
    border-color: rgba(150, 150, 150, 0.5);
    box-shadow: none;
}

.admin-section {
    padding: 15px;
    background: rgba(0, 40, 0, 0.5);
    border-top: 1px solid rgba(100, 200, 100, 0.2);
}

.admin-section h4 {
    margin: 0 0 10px 0;
    color: #aaffaa;
    font-size: 14px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.product-input, .price-input {
    padding: 8px 12px;
    background: rgba(0, 30, 0, 0.5);
    border: 1px solid rgba(100, 200, 100, 0.3);
    border-radius: 5px;
    color: #e0f0e0;
    font-size: 14px;
}

.product-input:focus, .price-input:focus {
    outline: none;
    border-color: rgba(100, 255, 100, 0.5);
    box-shadow: 0 0 5px rgba(0, 200, 0, 0.3);
}

.add-btn {
    padding: 8px;
    background: rgba(0, 150, 0, 0.3);
    border: 1px solid rgba(100, 200, 100, 0.3);
    border-radius: 5px;
    color: #aaffaa;
    cursor: pointer;
    transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
    background: rgba(0, 200, 0, 0.4);
}

.add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Panel animation */
.shopping-panel-enter-active {
    animation: panel-expand 0.3s ease-out;
}

.shopping-panel-leave-active {
    animation: panel-expand 0.3s ease-in reverse;
}

@keyframes panel-expand {
    from {
        opacity: 0;
        transform: scaleY(0);
    }
    to {
        opacity: 1;
        transform: scaleY(1);
    }
}

/* Responsive styles */
@media (max-width: 768px) {
    .shopping-panel {
        width: 95%;
        max-width: 400px;
        max-height: 80vh;
    }
}

@media (max-width: 480px) {
    .shopping-panel {
        width: 95%;
        height: 70%;
    }
    
    .shopping-header h3 {
        font-size: 16px;
    }
    
    .product-name {
        font-size: 14px;
    }
    
    .product-description {
        font-size: 12px;
    }
}

/* 购买成功提示样式 */
:global(.purchase-success) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 80, 0, 0.85);
    color: #aaffaa;
    padding: 15px 25px;
    border-radius: 10px;
    font-size: 18px;
    z-index: 9999;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(100, 255, 100, 0.3);
    animation: success-appear 0.5s ease;
    text-align: center;
}

:global(.purchase-success.fade-out) {
    animation: success-disappear 0.5s ease forwards;
}

@keyframes success-appear {
    from {
        opacity: 0;
        transform: translate(-50%, -40%);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%);
    }
}

@keyframes success-disappear {
    from {
        opacity: 1;
        transform: translate(-50%, -50%);
    }
    to {
        opacity: 0;
        transform: translate(-50%, -60%);
    }
}

.purchase-history {
    flex-grow: 1;
    overflow-y: auto;
    padding: 15px;
    scrollbar-width: thin;
    scrollbar-color: rgba(70, 120, 70, 0.5) rgba(244, 250, 244, 0.5);
    background: repeating-linear-gradient(
        45deg,
        rgba(244, 250, 244, 0.4),
        rgba(244, 250, 244, 0.4) 10px,
        rgba(230, 245, 230, 0.4) 10px,
        rgba(230, 245, 230, 0.4) 20px
    );
}

.purchase-history::-webkit-scrollbar {
    width: 6px;
}

.purchase-history::-webkit-scrollbar-track {
    background: rgba(0, 30, 0, 0.2);
    border-radius: 3px;
}

.purchase-history::-webkit-scrollbar-thumb {
    background-color: rgba(100, 200, 100, 0.5);
    border-radius: 3px;
}

.empty-history {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: rgba(200, 255, 200, 0.5);
    font-style: italic;
    padding: 30px 0;
}

.purchase-item {
    list-style: none;
    margin-bottom: 15px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    border: 1px solid rgba(70, 120, 70, 0.3);
    transition: all 0.2s;
    position: relative;
    box-shadow: 2px 2px 0 rgba(70, 120, 70, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.purchase-item:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px) rotate(0.5deg);
    box-shadow: 3px 3px 0 rgba(70, 120, 70, 0.3);
}

.purchase-info {
    flex: 1;
}

.purchase-name {
    margin: 0 0 5px 0;
    color: #466c46;
    font-size: 16px;
    font-weight: bold;
}

.purchase-date {
    margin: 0;
    color: rgba(70, 120, 70, 0.7);
    font-size: 12px;
}

.purchase-price {
    font-weight: bold;
    color: #b8860b;
    font-size: 16px;
    background: rgba(255, 250, 220, 0.8);
    padding: 3px 8px;
    border-radius: 10px;
    border: 1px solid rgba(184, 134, 11, 0.3);
    white-space: nowrap;
}

</style> 