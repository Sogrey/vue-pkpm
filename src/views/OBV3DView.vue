<template>
  <div class="obv-3d-container">
    <div class="controls">
      <input v-model="urn" placeholder="请输入模型URN" class="urn-input" />
      <button @click="loadModel" :disabled="!urn || loading" class="load-btn">
        {{ loading ? '加载中...' : '加载模型' }}
      </button>
    </div>
    <div v-if="obvApi" class="coordinate-controls">
      <button @click="worldToClient" class="coord-btn">世界坐标中点在屏幕二维坐标中的位置</button>
      <button @click="clientToWorld" class="coord-btn">屏幕二维坐标中点在世界坐标中的位置</button>
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
import { MessageManager, ErrorHandler, BaseOBVLoader, CoordinateUtils, ValidationUtils } from '../utils/obv-utils.js'

const urn = ref(defaultUrns['3d'])
const loading = ref(false)
const message = ref('')
let obvApi = null
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

    const threeCheck = ValidationUtils.checkTHREELibrary()
    if (!threeCheck.valid) {
      throw new Error(threeCheck.message)
    }

    // 检查容器
    const containerCheck = ValidationUtils.validateContainer(document.getElementById('obv-view'))
    if (!containerCheck.valid) {
      throw new Error(containerCheck.message)
    }

    // 加载文档
    const obvDocument = await loader.loadDocument(urn.value, modelTypes['3d'])
    
    // 创建3D查看器
    obvApi = await loader.create3DViewer(document.getElementById('obv-view'))
    
    // 获取三维视图并加载模型
    const viewer3dItems = obvDocument.get3dGeometryItems()
    await loader.load3DModel(obvDocument, viewer3dItems[0])

    // 暴露到全局，方便调试
    loader.exposeToGlobal()

    messageManager.showMessage(setMessage, '3D模型加载成功')
    console.log('3D模型加载成功')
  } catch (error) {
    console.error('3D模型加载失败:', error)
    const errorMessage = ErrorHandler.handleError(error, '3D模型')
    messageManager.showMessage(setMessage, errorMessage)
  } finally {
    loading.value = false
  }
}

// 设置消息的函数
function setMessage(text) {
  message.value = text
}

// 世界坐标转屏幕坐标
function worldToClient() {
  if (!obvApi) return

  const result = CoordinateUtils.worldToClient(obvApi, { x: 0, y: 0, z: 0 })
  
  if (result.error) {
    messageManager.showMessage(setMessage, result.error)
  } else {
    const coord = result.coordinate
    messageManager.showMessage(
      setMessage,
      `当前模型的屏幕坐标为：(${Math.round(coord.x)}, ${Math.round(coord.y)})`
    )
  }
}

// 屏幕坐标转世界坐标
function clientToWorld() {
  if (!obvApi) return

  const result = CoordinateUtils.clientToWorld(obvApi, 600, 400)
  
  if (result.error) {
    messageManager.showMessage(setMessage, result.error)
  } else {
    const coord = result.coordinate
    messageManager.showMessage(
      setMessage,
      `当前模型的世界坐标位置为：(${Math.round(coord.x * 100) / 100}, ${Math.round(coord.y * 100) / 100}, ${Math.round(coord.z * 100) / 100})`
    )
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

  const threeCheck = ValidationUtils.checkTHREELibrary()
  if (!threeCheck.valid) {
    console.error(threeCheck.message)
    messageManager.showMessage(setMessage, threeCheck.message)
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
</script>

<style scoped>
.obv-3d-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0d1117 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.obv-3d-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 30% 70%, rgba(0, 255, 0, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(0, 150, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 0, 255, 0.05) 0%, transparent 50%);
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
  background: linear-gradient(135deg, rgba(25, 30, 45, 0.95) 0%, rgba(20, 25, 40, 0.9) 100%);
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 255, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 255, 0, 0.15);
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
  background: linear-gradient(90deg, transparent, #00ff00, #00ccff, #00ff00, transparent);
  animation: scanline 3s linear infinite;
}

.controls::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.8), transparent);
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
  border: 2px solid rgba(0, 255, 0, 0.3);
  border-radius: 12px;
  font-size: 15px;
  background: linear-gradient(135deg, rgba(10, 15, 30, 0.8) 0%, rgba(5, 10, 20, 0.6) 100%);
  color: #e0ffe0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 255, 0, 0.1);
}

.urn-input::placeholder {
  color: rgba(160, 255, 160, 0.5);
  font-weight: 400;
  font-style: italic;
}

.urn-input:focus {
  outline: none;
  border-color: #00ff00;
  box-shadow:
    0 0 0 3px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(10, 15, 30, 0.95) 0%, rgba(5, 10, 20, 0.8) 100%);
  transform: translateY(-1px);
}

.load-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #00ff00 0%, #00cc00 50%, #00ff00 100%);
  background-size: 200% 200%;
  color: #0d1117;
  border: 2px solid rgba(0, 255, 0, 0.5);
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
    0 4px 20px rgba(0, 255, 0, 0.3),
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
    0 8px 30px rgba(0, 255, 0, 0.5),
    0 0 0 3px rgba(0, 255, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  background-position: 100% 0;
  border-color: #00ff00;
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

.coordinate-controls {
  position: absolute;
  z-index: 99;
  top: 160px;
  right: 8px;
  display: flex;
  flex-wrap: wrap-reverse;
  flex-direction: column;
}

.coord-btn {
  border-radius: 30px;
  margin-top: 20px;
  margin-right: 20px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #00ff00 0%, #00cc00 100%);
  color: #0d1117;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.coord-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 0, 0.4);
}

@media (max-width: 760px) {
  .coordinate-controls {
    top: 110px !important;
    right: 0 !important;
  }
  .coord-btn {
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
  color: #00ff00;
  padding: 20px 30px;
  border-radius: 12px;
  border: 2px solid rgba(0, 255, 0, 0.3);
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
.obv-3d-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px);
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
  .obv-3d-container {
    background: linear-gradient(135deg, #050a0f 0%, #0d1117 50%, #050a0f 100%);
  }
}
</style>
