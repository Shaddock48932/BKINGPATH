import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件 - 使用直接导入而非动态导入以避免初始加载问题
import WordStudy from '../views/WordStudy.vue'
import Settings from '../views/Settings.vue'
import NotFound from '../views/NotFound.vue'
import ShortcutHelp from '../views/ShortcutHelp.vue'
import Reader from '../views/Reader.vue'

// 定义路由
const routes = [
  {
    path: '/',
    name: 'Home',
    component: WordStudy,
    meta: {
      title: '单词学习 - 首页'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: '设置'
    }
  },
  {
    path: '/shortcuts',
    name: 'ShortcutHelp',
    component: ShortcutHelp,
    meta: {
      title: '快捷键指南'
    }
  },
  {
    path: '/reader',
    name: 'Reader',
    component: Reader,
    meta: {
      title: '电子书阅读'
    }
  },
  // 404页面，放在最后
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面未找到'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '单词快速扫盲'
  next()
})

export default router 