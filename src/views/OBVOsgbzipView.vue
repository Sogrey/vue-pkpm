<template>
  <div class="obv-osgb-container">
    <div class="controls">
      <input v-model="osgbUrn" placeholder="请输入OSGB模型URN" class="urn-input" />
      <input v-model="bimUrn" placeholder="请输入BIM模型URN" class="urn-input" />
      <button @click="loadModel" :disabled="!osgbUrn || loading" class="load-btn">
        {{ loading ? '加载中...' : '加载模型' }}
      </button>
    </div>

    <div v-if="obvApi" class="osgb-controls">
      <div class="control-group">
        <label class="control-label">
          设置高度值:
          <span class="value-display">{{ obliqueHeight.toFixed(1) }}</span>
          <input
            v-model="obliqueHeight"
            type="range"
            min="-500"
            max="0"
            step="1"
            class="range-input"
          />
        </label>
      </div>

      <div class="button-group">
        <button @click="createGisMap" :disabled="haveMap" class="action-btn">载入GIS</button>
        <button @click="removeGisMap" :disabled="!haveMap" class="action-btn">卸载GIS</button>
        <button @click="mergeBimModel" :disabled="haveBimModel || !haveMap" class="action-btn">
          载入BIM模型
        </button>
        <button @click="unloadBimModel" :disabled="!haveBimModel" class="action-btn">
          卸载BIM模型
        </button>
      </div>
    </div>

    <div v-if="message" class="message-toast">
      {{ message }}
    </div>
    <div id="obv-view" class="obv-viewer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { defaultUrns, modelTypes } from '../config/obv-config.js'
import {
  MessageManager,
  ErrorHandler,
  BaseOBVLoader,
  ModelUtils,
  ValidationUtils,
} from '../utils/obv-utils.js'

const osgbUrn = ref(defaultUrns['osgbzip'])
const bimUrn = ref(defaultUrns['bim-merge'])
const loading = ref(false)
const message = ref('')
const obliqueHeight = ref(-420)
const haveMap = ref(false)
const haveBimModel = ref(false)

let obvApi = null
let loader = null
let messageManager = null
let urnMap = null

async function loadModel() {
  if (!osgbUrn.value) return

  loading.value = true

  try {
    loader = new BaseOBVLoader()
    await loader.initApplication()

    const urnList = [
      {
        urn: osgbUrn.value,
        jobType: modelTypes['osgbzip'],
      },
      {
        urn: bimUrn.value,
        jobType: modelTypes['3d'],
      },
    ]

    // 创建document管理视图
    urnMap = await ModelUtils.createUrnMap(urnList, loader.builder, loader.application)

    const options = {
      applicationId: loader.application.id,
      gisType: 'oblique',
    }

    // 创建viewer
    obvApi = await loader.create3DViewer(document.getElementById('obv-view'))

    // 加载倾斜摄影模型
    await obvApi.createGisTileset(urnMap.get(osgbUrn.value), options)

    // 设定倾斜摄影模型的高度
    obvApi.setGisTilesetHeight('oblique', obliqueHeight.value, osgbUrn.value)

    // 切换为主视图
    ModelUtils.resetToHomeView(obvApi)

    // 暴露到全局，方便调试
    loader.exposeToGlobal()

    messageManager.showMessage((msg) => (message.value = msg), '倾斜摄影模型加载成功')
    console.log('倾斜摄影模型加载成功')
  } catch (error) {
    console.error('模型加载失败:', error)
    const errorMessage = ErrorHandler.handleError(error, '倾斜摄影模型')
    messageManager.showMessage((msg) => (message.value = msg), errorMessage)
  } finally {
    loading.value = false
  }
}

// 载入GIS地图
async function createGisMap() {
  if (!haveMap.value && obvApi) {
    try {
      const gisPos = obvApi.getGisTilesetPosition('oblique', osgbUrn.value)
      console.log(gisPos.longitude, gisPos.latitude)
      obvApi.createGisMap(gisPos.longitude, gisPos.latitude)
      ModelUtils.resetToHomeView(obvApi)
      haveMap.value = true
      messageManager.showMessage((msg) => (message.value = msg), 'GIS地图加载成功')
    } catch (error) {
      messageManager.showMessage(
        (msg) => (message.value = msg),
        'GIS地图加载失败：' + error.message,
      )
    }
  } else {
    messageManager.showMessage((msg) => (message.value = msg), 'GIS地图已经加载')
  }
}

// 卸载GIS地图
function removeGisMap() {
  if (haveMap.value && obvApi) {
    obvApi.removeGisMap()
    haveMap.value = false
    messageManager.showMessage((msg) => (message.value = msg), 'GIS地图已卸载')
  } else {
    messageManager.showMessage((msg) => (message.value = msg), 'GIS地图已经卸载')
  }
}

// 载入BIM模型
async function mergeBimModel() {
  if (!haveMap.value) {
    messageManager.showMessage((msg) => (message.value = msg), '请先加载GIS地图')
    return
  }
  if (!haveBimModel.value && loader) {
    try {
      const bimDocument = urnMap.get(bimUrn.value)
      const viewer3dItems = bimDocument.get3dGeometryItems()
      await loader.load3DModel(bimDocument, viewer3dItems[0], {
        modelOffset: { x: 650, y: -180, z: 5 },
      })
      haveBimModel.value = true
      messageManager.showMessage((msg) => (message.value = msg), 'BIM模型加载成功')
    } catch (error) {
      messageManager.showMessage(
        (msg) => (message.value = msg),
        'BIM模型加载失败：' + error.message,
      )
    }
  } else {
    messageManager.showMessage((msg) => (message.value = msg), 'BIM模型已经加载')
  }
}

// 卸载BIM模型
function unloadBimModel() {
  if (haveBimModel.value && obvApi) {
    try {
      ModelUtils.unloadAllBIMModels(obvApi)
      haveBimModel.value = false
      messageManager.showMessage((msg) => (message.value = msg), 'BIM模型已卸载')
    } catch (error) {
      messageManager.showMessage(
        (msg) => (message.value = msg),
        'BIM模型卸载失败：' + error.message,
      )
    }
  } else {
    messageManager.showMessage((msg) => (message.value = msg), 'BIM模型已经卸载')
  }
}

// 监听高度变化
watch(obliqueHeight, (newHeight) => {
  if (obvApi) {
    obvApi.setGisTilesetHeight('oblique', newHeight, osgbUrn.value)
  }
})

onMounted(() => {
  messageManager = new MessageManager()
  const validation = ValidationUtils.checkOBVLibrary()
  if (!validation.valid) {
    messageManager.showMessage((msg) => (message.value = msg), validation.message)
    return
  }
})

onUnmounted(() => {
  if (loader) {
    loader.destroy()
    loader = null
  }
  if (messageManager) {
    messageManager.destroy()
    messageManager = null
  }
})
</script>

<style scoped>
.obv-osgb-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #0f1a2e 0%, #1a2540 50%, #0f1a2e 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.obv-osgb-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 30% 70%, rgba(0, 123, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(30, 144, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(65, 105, 225, 0.08) 0%, transparent 50%);
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
  background: linear-gradient(135deg, rgba(25, 35, 60, 0.95) 0%, rgba(20, 30, 50, 0.9) 100%);
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 123, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 123, 255, 0.15);
  min-width: 600px;
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
  background: linear-gradient(90deg, transparent, #007bff, #4169e1, #007bff, transparent);
  animation: scanline 3s linear infinite;
}

.controls::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 123, 255, 0.8), transparent);
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
  border: 2px solid rgba(0, 123, 255, 0.3);
  border-radius: 12px;
  font-size: 15px;
  background: linear-gradient(135deg, rgba(15, 25, 45, 0.8) 0%, rgba(10, 20, 35, 0.6) 100%);
  color: #e6f3ff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 123, 255, 0.1);
}

.urn-input::placeholder {
  color: rgba(173, 216, 230, 0.5);
  font-weight: 400;
  font-style: italic;
}

.urn-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow:
    0 0 0 3px rgba(0, 123, 255, 0.2),
    0 0 20px rgba(0, 123, 255, 0.3),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(15, 25, 45, 0.95) 0%, rgba(10, 20, 35, 0.8) 100%);
  transform: translateY(-1px);
}

.load-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #007bff 0%, #4169e1 50%, #007bff 100%);
  background-size: 200% 200%;
  color: #0f1a2e;
  border: 2px solid rgba(0, 123, 255, 0.5);
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 140px;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow:
    0 4px 20px rgba(0, 123, 255, 0.3),
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
    0 8px 30px rgba(0, 123, 255, 0.5),
    0 0 0 3px rgba(0, 123, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  background-position: 100% 0;
  border-color: #007bff;
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

.osgb-controls {
  position: absolute;
  z-index: 99;
  top: 160px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(135deg, rgba(25, 35, 60, 0.95) 0%, rgba(20, 30, 50, 0.9) 100%);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(0, 123, 255, 0.15);
  backdrop-filter: blur(10px);
  min-width: 280px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  color: #e6f3ff;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
}

.value-display {
  color: #007bff;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  background: rgba(0, 123, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 60px;
  text-align: center;
}

.range-input {
  flex: 1;
  height: 6px;
  background: rgba(0, 123, 255, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #007bff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.5);
  transition: all 0.3s ease;
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.7);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #007bff 0%, #4169e1 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3 0%, #2980b9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.action-btn:disabled {
  background: linear-gradient(135deg, rgba(60, 60, 60, 0.5) 0%, rgba(40, 40, 40, 0.4) 100%);
  color: rgba(160, 160, 160, 0.6);
  cursor: not-allowed;
  transform: none;
}

.message-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 30, 50, 0.9));
  color: #007bff;
  padding: 20px 30px;
  border-radius: 12px;
  border: 2px solid rgba(0, 123, 255, 0.3);
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
.obv-osgb-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 123, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 123, 255, 0.03) 1px, transparent 1px);
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

  .osgb-controls {
    top: 110px;
    right: 8px;
    min-width: 240px;
    padding: 16px;
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

  .osgb-controls {
    top: 100px;
    right: 5px;
    left: 5px;
    min-width: auto;
  }
}

/* 暗色主题优化 */
@media (prefers-color-scheme: dark) {
  .obv-osgb-container {
    background: linear-gradient(135deg, #0a0f20 0%, #0f1a2e 50%, #0a0f20 100%);
  }
}
</style>
