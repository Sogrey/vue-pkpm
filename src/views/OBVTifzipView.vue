<template>
  <div class="obv-tif-container">
    <div class="controls">
      <input v-model="bimUrn" placeholder="请输入BIM模型URN" class="urn-input" />
      <input v-model="tifUrn" placeholder="请输入TIF影像URN" class="urn-input" />
      <button @click="loadModel" :disabled="!tifUrn || loading" class="load-btn">
        {{ loading ? '加载中...' : '加载模型' }}
      </button>
    </div>
    
    <div v-if="obvApi" class="tif-controls">
      <div class="control-group">
        <label class="control-label">
          设置高度值:
          <span class="value-display">{{ tifHeight.toFixed(1) }}</span>
          <input 
            v-model="tifHeight" 
            type="range" 
            min="-30" 
            max="1000" 
            step="1"
            class="range-input"
          />
        </label>
      </div>
      
      <div class="button-group">
        <button @click="createTif" :disabled="haveTif" class="action-btn">载入TIF影像</button>
        <button @click="removeTif" :disabled="!haveTif" class="action-btn">卸载TIF影像</button>
        <button @click="createGisMap" :disabled="haveMap" class="action-btn">载入GIS地图</button>
        <button @click="removeGisMap" :disabled="!haveMap" class="action-btn">卸载GIS地图</button>
        <button @click="mergeBimModel" :disabled="haveBimModel || !haveMap" class="action-btn">载入BIM模型</button>
        <button @click="unloadBimModel" :disabled="!haveBimModel" class="action-btn">卸载BIM模型</button>
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
import { defaultUrns, modelTypes, serviceConfig, TokenManager } from '../config/obv-config.js'
import { MessageManager, ErrorHandler, BaseOBVLoader, ModelUtils, ValidationUtils } from '../utils/obv-utils.js'

const bimUrn = ref(defaultUrns['bim-weilv'])
const tifUrn = ref(defaultUrns['tifzip'])
const loading = ref(false)
const message = ref('')
const tifHeight = ref(-30)
const haveTif = ref(true)
const haveMap = ref(false)
const haveBimModel = ref(false)

let loader = null
let messageManager = null
let urnMap = null
let obvApi = null
let builder = null
let messageTimer = null

// 显示消息的辅助函数
function showMessage(msg) {
  message.value = msg
  if (messageTimer) {
    clearTimeout(messageTimer)
  }
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3000)
}

// 获取token值
function getAccessToken(cb) {
  if (TokenManager.isTokenExpired()) {
    cb('', 0)
    return
  }
  cb(TokenManager.getAccessToken(), TokenManager.getExpiresIn())
}

async function loadModel() {
  if (!tifUrn.value) return

  loading.value = true

  try {
    const applicationOptions = {
      getAccessToken: getAccessToken,
      serviceConfig: {
        origin: serviceConfig.origin,
        apiContextPath: serviceConfig.apiContextPath,
      },
    }

    const urnList = [
      {
        urn: tifUrn.value,
        jobType: 'tifzip-lod'
      },
      {
        urn: bimUrn.value,
        jobType: 'rvt-lod'
      }
    ]

    // 实例化 Builder
    builder = new OBV.Api.ObvBuilder()
    const application = await builder.buildApplication(applicationOptions)
    
    // 创建document管理视图
    urnMap = new Map()
    for (let i = 0; i < urnList.length; i++) {
      const document = await builder.loadDocument(application, urnList[i].urn, urnList[i].jobType)
      urnMap.set(urnList[i].urn, document)
    }

    // 设置加载模型的参数，gis模型类型设为tif
    const options = {
      applicationId: application.id,
      gisType: 'tif'
    }

    // 创建viewer
    obvApi = await builder.buildViewer3d(application, document.getElementById('obv-view'))
    
    // 获取三维视图
    await obvApi.createGisTileset(urnMap.get(tifUrn.value), options)
    
    // 设定TIF影像模型的高度
    obvApi.setGisTilesetHeight('tif', tifHeight.value, tifUrn.value)
    
    // 切换为主视图，使移动后的TIF影像模型居中展示
    obvApi.setRequestHomeView()

    // 暴露到全局，方便调试
    window.obvApi = obvApi

    showMessage('TIF影像模型加载成功')
    console.log('TIF影像模型加载成功')

  } catch (error) {
    console.error('模型加载失败:', error)
    let errorMessage = '模型加载失败'
    
    const errorMsg = error && error.message ? error.message : String(error)
    
    if (errorMsg.includes('network')) {
      errorMessage = '网络连接失败，请检查网络连接'
    } else if (errorMsg.includes('token')) {
      errorMessage = '访问令牌无效，请重新授权'
    } else {
      errorMessage = '模型加载失败：' + errorMsg
    }
    
    showMessage(errorMessage)
  } finally {
    loading.value = false
  }
}

// 加载TIF影像
async function createTif() {
  if (haveTif.value) {
    showMessage('TIF影像已经加载')
    return
  }
  
  if (obvApi && urnMap) {
    try {
      const options = {
        applicationId: urnMap.get(tifUrn.value).application.id,
        gisType: 'tif'
      }
      
      await obvApi.createGisTileset(urnMap.get(tifUrn.value), options)
      
      // 设定TIF影像模型的高度
      obvApi.setGisTilesetHeight('tif', tifHeight.value, tifUrn.value)
      
      haveTif.value = true
      showMessage('TIF影像加载成功')
    } catch (error) {
      showMessage('TIF影像加载失败：' + error.message)
    }
  }
}

// 卸载TIF影像
function removeTif() {
  if (obvApi) {
    try {
      obvApi.removeGisTileset('tif', tifUrn.value)
      haveTif.value = false
      showMessage('TIF影像已卸载')
    } catch (error) {
      showMessage('TIF影像卸载失败：' + error.message)
    }
  }
}

// 载入GIS地图
async function createGisMap() {
  if (!haveMap.value && obvApi) {
    try {
      let gisPos
      if (haveTif.value) {
        gisPos = obvApi.getTifGisPosition(tifUrn.value)
        console.log(gisPos)
      } else {
        gisPos = { longitude: 117.1142578125, latitude: 40.1824951171875 }
      }
      
      obvApi.createGisMap(gisPos.longitude, gisPos.latitude)
      obvApi.setRequestHomeView()
      haveMap.value = true
      showMessage('GIS地图加载成功')
    } catch (error) {
      showMessage('GIS地图加载失败：' + error.message)
    }
  } else {
    showMessage('GIS地图已经加载')
  }
}

// 卸载GIS地图
function removeGisMap() {
  if (haveMap.value && obvApi) {
    try {
      obvApi.removeGisMap()
      haveMap.value = false
      showMessage('GIS地图已卸载')
    } catch (error) {
      showMessage('GIS地图卸载失败：' + error.message)
    }
  } else {
    showMessage('GIS地图已经卸载')
  }
}

// 载入BIM模型
async function mergeBimModel() {
  if (!haveMap.value) {
    showMessage('请先加载GIS地图')
    return
  }
  
  if (!haveBimModel.value && obvApi && urnMap) {
    try {
      const bimDocument = urnMap.get(bimUrn.value)
      const viewer3dItems = bimDocument.get3dGeometryItems()
      
      await builder.load3dModels(obvApi, {
        obvDocument: bimDocument,
        viewer3dItem: viewer3dItems[0],
        // 设置模型偏移量
        modelOffset: { x: 1420, y: 1980, z: 15 },
      }).then(() => {
        // 切换为主视图，使模型居中展示
        obvApi.setRequestHomeView()
      })
      
      haveBimModel.value = true
      showMessage('BIM模型加载成功')
    } catch (error) {
      showMessage('BIM模型加载失败：' + error.message)
    }
  } else {
    showMessage('BIM模型已经加载')
  }
}

// 卸载BIM模型
function unloadBimModel() {
  if (haveBimModel.value && obvApi) {
    try {
      const ids = obvApi.getModelIds()
      for (let i = 0; i < ids.length; i++) {
        let model = obvApi.getModelById(ids[i])
        obvApi.unloadModel(ids[i])
        model.dispose()
        model = null
      }
      haveBimModel.value = false
      showMessage('BIM模型已卸载')
    } catch (error) {
      showMessage('BIM模型卸载失败：' + error.message)
    }
  } else {
    showMessage('BIM模型已经卸载')
  }
}

// 监听高度变化
watch(tifHeight, (newHeight) => {
  if (obvApi && haveTif.value) {
    obvApi.setGisTilesetHeight('tif', newHeight, tifUrn.value)
  }
})

onMounted(() => {
  if (typeof OBV === 'undefined') {
    console.error('OBV库未加载')
    showMessage('OBV库未加载，请刷新页面重试')
    return
  }
})

onUnmounted(() => {
  if (obvApi) {
    obvApi = null
  }
  if (messageTimer) {
    clearTimeout(messageTimer)
  }
})
</script>

<style scoped>
.obv-tif-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #0f2a1e 0%, #1a3a2e 50%, #0f2a1e 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.obv-tif-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 25% 75%, rgba(0, 191, 165, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 75% 25%, rgba(64, 224, 208, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(72, 209, 204, 0.08) 0%, transparent 50%);
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
  background: linear-gradient(135deg, rgba(20, 40, 35, 0.95) 0%, rgba(15, 30, 25, 0.9) 100%);
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 191, 165, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 191, 165, 0.15);
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
  background: linear-gradient(90deg, transparent, #00bfa5, #40e0d0, #00bfa5, transparent);
  animation: scanline 3s linear infinite;
}

.controls::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 191, 165, 0.8), transparent);
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
  0% { left: -100%; }
  100% { left: 100%; }
}

.urn-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid rgba(0, 191, 165, 0.3);
  border-radius: 12px;
  font-size: 15px;
  background: linear-gradient(135deg, rgba(10, 30, 25, 0.8) 0%, rgba(5, 20, 15, 0.6) 100%);
  color: #e6fff9;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 191, 165, 0.1);
}

.urn-input::placeholder {
  color: rgba(178, 255, 230, 0.5);
  font-weight: 400;
  font-style: italic;
}

.urn-input:focus {
  outline: none;
  border-color: #00bfa5;
  box-shadow:
    0 0 0 3px rgba(0, 191, 165, 0.2),
    0 0 20px rgba(0, 191, 165, 0.3),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(10, 30, 25, 0.95) 0%, rgba(5, 20, 15, 0.8) 100%);
  transform: translateY(-1px);
}

.load-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #00bfa5 0%, #26a69a 50%, #00bfa5 100%);
  background-size: 200% 200%;
  color: #0f2a1e;
  border: 2px solid rgba(0, 191, 165, 0.5);
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
    0 4px 20px rgba(0, 191, 165, 0.3),
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
    0 8px 30px rgba(0, 191, 165, 0.5),
    0 0 0 3px rgba(0, 191, 165, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  background-position: 100% 0;
  border-color: #00bfa5;
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

.tif-controls {
  position: absolute;
  z-index: 99;
  top: 160px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(135deg, rgba(20, 40, 35, 0.95) 0%, rgba(15, 30, 25, 0.9) 100%);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(0, 191, 165, 0.15);
  backdrop-filter: blur(10px);
  min-width: 280px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-label {
  color: #e6fff9;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
}

.value-display {
  color: #00bfa5;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  background: rgba(0, 191, 165, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 60px;
  text-align: center;
}

.range-input {
  flex: 1;
  height: 6px;
  background: rgba(0, 191, 165, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #00bfa5;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 191, 165, 0.5);
  transition: all 0.3s ease;
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 191, 165, 0.7);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #00bfa5 0%, #26a69a 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #00897b 0%, #00796b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 191, 165, 0.4);
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
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 40, 35, 0.9));
  color: #00bfa5;
  padding: 20px 30px;
  border-radius: 12px;
  border: 2px solid rgba(0, 191, 165, 0.3);
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
.obv-tif-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 191, 165, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 191, 165, 0.03) 1px, transparent 1px);
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

  .tif-controls {
    top: 110px;
    right: 8px;
    min-width: 260px;
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

  .tif-controls {
    top: 100px;
    right: 5px;
    left: 5px;
    min-width: auto;
  }
}

/* 暗色主题优化 */
@media (prefers-color-scheme: dark) {
  .obv-tif-container {
    background: linear-gradient(135deg, #0a1f15 0%, #0f2a1e 50%, #0a1f15 100%);
  }
}
</style>