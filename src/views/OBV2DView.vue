<template>
  <div class="obv-2d-container">
    <div class="controls">
      <input v-model="urn" placeholder="请输入模型URN" class="urn-input" />
      <button @click="loadModel" :disabled="!urn || loading" class="load-btn">
        {{ loading ? '加载中...' : '加载模型' }}
      </button>
    </div>
    <div v-if="obvApi" class="view-controls">
      <button @click="getViewerState" class="state-btn">获取当前视图</button>
      <button @click="setViewerState" :disabled="!viewerState" class="state-btn">
        设置当前视图
      </button>
    </div>
    <div v-if="message" class="message-toast">
      {{ message }}
    </div>
    <div id="obv-view" class="obv-viewer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { defaultUrns, modelTypes } from '../config/obv-config.js'
import { MessageManager, ErrorHandler, BaseOBVLoader, ValidationUtils } from '../utils/obv-utils.js'

// 定义urn，模型的唯一标识
const urn = ref(defaultUrns['2d'])
const loading = ref(false)
const message = ref('')
let obvApi = null
let viewerState = null
let activeLayout = null
let loader = null
let messageManager = null

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

    // 加载文档
    const obvDocument = await loader.loadDocument(urn.value, modelTypes['2d'])
    
    // 创建2D查看器
    obvApi = await loader.create2DViewer(document.getElementById('obv-view'))
    
    // 获取二维视图并加载模型
    const viewer2dItems = obvDocument.get2dGeometryItems()
    await loader.load2DModel(obvDocument, viewer2dItems[0])

    // 暴露到全局，方便调试
    loader.exposeToGlobal()

    messageManager.showMessage(setMessage, '2D图纸加载成功')
    console.log('2D图纸加载成功')
  } catch (error) {
    console.error('2D图纸加载失败:', error)
    const errorMessage = ErrorHandler.handleError(error, '2D图纸')
    messageManager.showMessage(setMessage, errorMessage)
  } finally {
    loading.value = false
  }
}

// 获取当前视图状态
function getViewerState() {
  if (!obvApi) return

  try {
    // 获取视图当前显示状态
    viewerState = obvApi.getViewerState()
    console.log('当前视图状态:', viewerState)
    messageManager.showMessage(setMessage, '已获取当前视角信息')
  } catch (error) {
    console.error('获取视图状态失败:', error)
    const errorMessage = ErrorHandler.handleError(error, '获取视图状态')
    messageManager.showMessage(setMessage, errorMessage)
  }
}

// 设置当前视图状态
function setViewerState() {
  if (!obvApi || !viewerState) return

  try {
    if (obvApi.viewer.v2dType === 'vectorDraw') {
      activeLayout = obvApi.getActiveLayout()
      const vc = viewerState.viewCenter
      activeLayout.ViewCenter = [vc[0], vc[1], vc[2]]
      activeLayout.ViewSize = viewerState.viewSize
      obvApi.redraw()
    } else {
      obvApi.setViewerState(viewerState)
    }
    messageManager.showMessage(setMessage, '视图状态设置成功')
  } catch (error) {
    console.error('设置视图状态失败:', error)
    const errorMessage = ErrorHandler.handleError(error, '设置视图状态')
    messageManager.showMessage(setMessage, errorMessage)
  }
}

// 设置消息的函数
function setMessage(text) {
  message.value = text
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
  viewerState = null
  activeLayout = null
})
</script>

<style scoped>
.obv-2d-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0e27 0%, #151932 50%, #0a0e27 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.obv-2d-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(0, 123, 255, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

.controls {
  position: relative;
  top: 30px;
  margin: 0 16px;
  z-index: 100;
  display: flex;
  gap: 16px;
  align-items: center;
  background: linear-gradient(135deg, rgba(20, 25, 40, 0.95) 0%, rgba(15, 20, 35, 0.9) 100%);
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 255, 255, 0.15);
  min-width: 520px;
  animation: slideDown 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
}

.controls::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ffff, #ff00ff, #00ffff, transparent);
  animation: scanline 3s linear infinite;
}

.controls::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent);
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes scanline {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.urn-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 15px;
  background: linear-gradient(135deg, rgba(10, 15, 30, 0.8) 0%, rgba(5, 10, 20, 0.6) 100%);
  color: #e0e6ff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 255, 255, 0.1);
}

.urn-input::placeholder {
  color: rgba(160, 174, 255, 0.5);
  font-weight: 400;
  font-style: italic;
}

.urn-input:focus {
  outline: none;
  border-color: #00ffff;
  box-shadow:
    0 0 0 3px rgba(0, 255, 255, 0.2),
    0 0 20px rgba(0, 255, 255, 0.3),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(10, 15, 30, 0.95) 0%, rgba(5, 10, 20, 0.8) 100%);
  transform: translateY(-1px);
}

.load-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #00ffff 0%, #0099cc 50%, #00ffff 100%);
  background-size: 200% 200%;
  color: #0a0e27;
  border: 2px solid rgba(0, 255, 255, 0.5);
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow:
    0 4px 20px rgba(0, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.load-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.load-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: translate(-50%, -50%);
  transition: all 0.6s ease;
}

.load-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 30px rgba(0, 255, 255, 0.5),
    0 0 0 3px rgba(0, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  background-position: 100% 0;
  border-color: #00ffff;
}

.load-btn:hover:not(:disabled)::before {
  left: 100%;
}

.load-btn:hover:not(:disabled)::after {
  width: 300px;
  height: 300px;
  opacity: 0;
}

.load-btn:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
}

.load-btn:disabled {
  background: linear-gradient(135deg, rgba(60, 60, 60, 0.3) 0%, rgba(40, 40, 40, 0.2) 100%);
  color: rgba(160, 160, 160, 0.5);
  cursor: not-allowed;
  transform: none;
  opacity: 0.6;
  border-color: rgba(80, 80, 80, 0.3);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

.view-controls {
  position: absolute;
  z-index: 99;
  top: 160px;
  right: 8px;
  display: flex;
  flex-wrap: wrap-reverse;
  flex-direction: column;
}

.state-btn {
  border-radius: 30px;
  margin-top: 20px;
  margin-right: 20px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #00ffff 0%, #0099cc 100%);
  color: #0a0e27;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.state-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 255, 0.4);
}

.state-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .view-controls {
    top: 110px !important;
    right: 0 !important;
  }
  .state-btn {
    font-size: 12px;
    padding: 0 10px;
    margin-top: 10px;
    margin-right: 10px;
  }
}

.message-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.9));
  color: #00ffff;
  padding: 20px 30px;
  border-radius: 12px;
  border: 2px solid rgba(0, 255, 255, 0.3);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  animation: fadeInOut 3s ease-in-out;
  white-space: nowrap;
  max-width: 80%;
  text-align: center;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  85% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
}

.obv-viewer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  border-radius: 8px;
  overflow: hidden;
}

/* 添加网格背景效果 */
.obv-2d-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .controls {
    top: 20px;
    left: 15px;
    right: 15px;
    min-width: auto;
    flex-direction: column;
    gap: 14px;
    align-items: stretch;
    padding: 18px;
    border-radius: 12px;
  }

  .controls::before {
    height: 3px;
  }

  .urn-input {
    width: 100%;
    min-width: 0;
    padding: 12px 16px;
  }

  .load-btn {
    width: 100%;
    min-width: auto;
    padding: 12px 24px;
  }
}

@media (max-width: 480px) {
  .controls {
    top: 15px;
    left: 10px;
    right: 10px;
    padding: 14px;
    border-radius: 10px;
    gap: 12px;
  }

  .urn-input {
    padding: 11px 14px;
    font-size: 14px;
  }

  .load-btn {
    padding: 11px 20px;
    font-size: 14px;
    letter-spacing: 0.5px;
  }
}

/* 暗色主题优化 */
@media (prefers-color-scheme: dark) {
  .obv-2d-container {
    background: linear-gradient(135deg, #050714 0%, #0a0e27 50%, #050714 100%);
  }
}
</style>
