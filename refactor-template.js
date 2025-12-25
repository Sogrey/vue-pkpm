/**
 * 批量重构脚本模板
 * 用于快速重构剩余的OBV页面
 */

// 重构模板 - 用于3D查看器页面（3DTiles, Osgbzip, PntsTileset, Tifzip）
const refactoredScriptTemplate = (pageKey, defaultUrn, modelName) => `
import { ref, onMounted, onUnmounted } from 'vue'
import { defaultUrns, modelTypes } from '../config/obv-config.js'
import { MessageManager, ErrorHandler, BaseOBVLoader, ModelUtils, ValidationUtils } from '../utils/obv-utils.js'

const urn = ref('${defaultUrn}')
const loading = ref(false)
const message = ref('')
// 根据页面类型定义特定的响应式变量
let obvApi = null
let loader = null
let messageManager = null

// 设置消息的函数
function setMessage(text) {
  message.value = text
}

async function loadModel() {
  if (!urn.value || !ValidationUtils.validateURN(urn.value)) {
    messageManager.showMessage(setMessage, '请输入有效的模型URN')
    return
  }

  loading.value = true

  try {
    // 初始化加载器
    loader = new BaseOBVLoader()
    
    // 检查库是否加载
    const obvCheck = ValidationUtils.checkOBVLibrary()
    if (!obvCheck.valid) {
      throw new Error(obvCheck.message)
    }

    // 检查容器
    const containerCheck = ValidationUtils.validateContainer(document.getElementById('obv-view'))
    if (!containerCheck.valid) {
      throw new Error(containerCheck.message)
    }

    // 这里需要根据具体页面类型加载不同的模型
    const obvDocument = await loader.loadDocument(urn.value, modelTypes['${pageKey}'])
    
    // 创建3D查看器
    obvApi = await loader.create3DViewer(document.getElementById('obv-view'))
    
    // 暴露到全局，方便调试
    loader.exposeToGlobal()

    messageManager.showMessage(setMessage, '${modelName}加载成功')
    console.log('${modelName}加载成功')
  } catch (error) {
    console.error('${modelName}加载失败:', error)
    const errorMessage = ErrorHandler.handleError(error, '${modelName}')
    messageManager.showMessage(setMessage, errorMessage)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 初始化消息管理器
  messageManager = new MessageManager()
  
  // 确保OBV对象已加载
  const obvCheck = ValidationUtils.checkOBVLibrary()
  if (!obvCheck.valid) {
    console.error(obvCheck.message)
    messageManager.showMessage(setMessage, obvCheck.message)
  }
})

onUnmounted(() => {
  // 清理资源
  if (messageManager) {
    messageManager.destroy()
  }
  if (loader) {
    loader.destroy()
  }
  obvApi = null
})
`

console.log('重构模板已准备，可以用于手动重构剩余页面')
console.log('需要重构的页面：')
console.log('1. OBV3DTilesView.vue')
console.log('2. OBVOsgbzipView.vue') 
console.log('3. OBVPntsTilesetView.vue')
console.log('4. OBVTifzipView.vue')