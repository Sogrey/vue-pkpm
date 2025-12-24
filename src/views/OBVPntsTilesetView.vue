<template>
  <div class="obv-pnts-container">
    <div class="controls">
      <input v-model="pointCloudUrn" placeholder="请输入点云模型URN" class="urn-input" />
      <input v-model="bimUrn" placeholder="请输入BIM模型URN" class="urn-input" />
      <button @click="loadModel" :disabled="!pointCloudUrn || loading" class="load-btn">
        {{ loading ? '加载中...' : '加载模型' }}
      </button>
    </div>
    
    <div v-if="obvApi" class="pnts-controls">
      <div class="control-group">
        <label class="control-label">
          设置高度值:
          <span class="value-display">{{ pntsHeight.toFixed(1) }}</span>
          <input 
            v-model="pntsHeight" 
            type="range" 
            min="0" 
            max="60" 
            step="0.1"
            class="range-input"
          />
        </label>
        
        <label class="control-label">
          设置透明度:
          <span class="value-display">{{ pntsOpacity.toFixed(1) }}</span>
          <input 
            v-model="pntsOpacity" 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            class="range-input"
          />
        </label>
        
        <label class="control-label">
          设置点大小:
          <span class="value-display">{{ pntsPointSize.toFixed(1) }}</span>
          <input 
            v-model="pntsPointSize" 
            type="range" 
            min="0" 
            max="5" 
            step="0.1"
            class="range-input"
          />
        </label>
      </div>
      
      <div class="button-group">
        <button @click="createTileset" class="action-btn">加载点云模型</button>
        <button @click="removePntsTileset" class="action-btn">卸载指定点云模型</button>
        <button @click="removeAllPntsTileset" class="action-btn">卸载全部点云模型</button>
        <button @click="togglePntsVisible" class="action-btn">
          {{ visible ? '隐藏点云模型' : '显示点云模型' }}
        </button>
        <button @click="mergeBimModel" :disabled="haveBimModel" class="action-btn">载入BIM模型</button>
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

const pointCloudUrn = ref('urn:bimbox.object:viewing_bucket/las-model')
const bimUrn = ref('urn:bimbox.object:viewing_bucket/rvt-house')
const loading = ref(false)
const message = ref('')
const pntsHeight = ref(0)
const pntsOpacity = ref(1)
const pntsPointSize = ref(1)
const haveBimModel = ref(false)
const havePntsModel = ref(true)
const visible = ref(true)
let obvApi = null
let builder = null
let urnMap = null
let messageTimer = null

// 访问的令牌
const accessToken = 'eyJhbGciOiJSUzI1NiJ9.eyJzY29wZSI6WyJvYnY6cmVhZCJdLCJleHAiOjE3NjY2NDEwNjEsImNsaWVudF9pZCI6ImFlY3dvcmtzLW9idi1jb21tdW5pdHkiLCJqdGkiOiIzNzhmM2Q4MS0yMGI4LTRjZWQtYWFhMi01OThmNjg1MDJhMDAifQ.Hkdyz_ZNqjzjjhc9hfOmXdervJqCNlsCGgotjTgu--9oSyU1TivYY-RysMOmlLcO4O7L2iTxwSyPaM02HRMvafCfemfg4VNY9JUdgW0M_1HdCPlOy67wTFT7aDBeAaWTKQ0VCDonEvKZ8uB1hMq19SsxniCTwDnqOq_ICxq5EmMGRaXemu5pDBre0KnkDBAt17pU_m1gH-QI3BNnl4aEuuiXdDL5jjv5oJdFYdgQ5JfOtAjg5yaqvOyypqo2jgPXwgv3XEpgrHdV3kKUG1Jv3nXyGmZjtHylYlpXE8tg3BOdZjqGlOt91yRnElfLhGQMkrtZwGumMUNJ-u3y9C28Rw'
const expiresIn = 600000

// 获取token值
function getAccessToken(cb) {
  cb(accessToken, expiresIn)
}

// 显示消息的辅助函数
function showMessage(text, duration = 3000) {
  message.value = text
  if (messageTimer) {
    clearTimeout(messageTimer)
  }
  messageTimer = setTimeout(() => {
    message.value = ''
  }, duration)
}

async function loadModel() {
  if (!pointCloudUrn.value) return

  loading.value = true

  try {
    const applicationOptions = {
      getAccessToken: getAccessToken,
      serviceConfig: {
        origin: 'https://api.cloud.pkpm.cn',
        apiContextPath: '/bimserver/viewing/v3',
      },
    }

    const urnList = [
      {
        urn: pointCloudUrn.value,
        jobType: 'las-lod'
      }, 
      {
        urn: bimUrn.value,
        jobType: 'rvt-lod'
      }
    ]

    // 实例化 Builder
    builder = new OBV.Api.ObvBuilder()
    const application = await builder.buildApplication(applicationOptions)
    
    // 创建viewer
    obvApi = await builder.buildViewer3d(application, document.getElementById('obv-view'))
    
    // 创建document管理视图
    urnMap = new Map()
    for (let i = 0; i < urnList.length; i++) {
      const document = await builder.loadDocument(application, urnList[i].urn, urnList[i].jobType)
      urnMap.set(urnList[i].urn, document)
    }

    const options = {
      applicationId: application.id
    }

    // 加载点云模型
    await obvApi.createPntsTileset(urnMap.get(pointCloudUrn.value), options)

    // 暴露到全局，方便调试
    window.obvApi = obvApi

    showMessage('点云模型加载成功')
    console.log('点云模型加载成功')

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

// 加载指定的点云模型
function createTileset() {
  if (obvApi && urnMap) {
    try {
      const options = {
        applicationId: urnMap.get(pointCloudUrn.value).application.id
      }
      obvApi.createPntsTileset(urnMap.get(pointCloudUrn.value), options)
      
      if (!havePntsModel.value) {
        havePntsModel.value = true
        showMessage("多个点云模型加载完成后，可以统一调整所有点云模型的高度、显隐、透明度、点大小")
      }
    } catch (error) {
      showMessage('点云模型加载失败：' + error.message)
    }
  }
}

// 卸载指定的点云模型
function removePntsTileset() {
  if (obvApi) {
    try {
      obvApi.removePntsTileset(pointCloudUrn.value)
      if (havePntsModel.value) {
        havePntsModel.value = false
      }
      showMessage('指定点云模型已卸载')
    } catch (error) {
      showMessage('点云模型卸载失败：' + error.message)
    }
  }
}

// 卸载全部点云模型
function removeAllPntsTileset() {
  if (obvApi) {
    try {
      obvApi.removeAllPntsTileset()
      havePntsModel.value = false
      showMessage('全部点云模型已卸载')
    } catch (error) {
      showMessage('点云模型卸载失败：' + error.message)
    }
  }
}

// 切换点云模型显隐
function togglePntsVisible() {
  if (obvApi) {
    try {
      if (!visible.value) {
        obvApi.setPntsVisible(true)
        visible.value = true
        showMessage('点云模型已显示')
      } else {
        obvApi.setPntsVisible(false)
        visible.value = false
        showMessage('点云模型已隐藏')
      }
    } catch (error) {
      showMessage('点云模型显隐切换失败：' + error.message)
    }
  }
}

// 载入BIM模型
async function mergeBimModel() {
  if (!haveBimModel.value && obvApi && urnMap) {
    try {
      const bimDocument = urnMap.get(bimUrn.value)
      const viewer3dItems = bimDocument.get3dGeometryItems()
      await builder.load3dModels(obvApi, {
        obvDocument: bimDocument,
        viewer3dItem: viewer3dItems[0],
        modelOffset: { x: 200, y: -50, z: 10 },
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

// 监听参数变化
watch(pntsHeight, (newHeight) => {
  if (obvApi) {
    obvApi.setPntsHeight(newHeight)
  }
})

watch(pntsOpacity, (newOpacity) => {
  if (obvApi) {
    obvApi.setPntsOpacity(newOpacity)
  }
})

watch(pntsPointSize, (newSize) => {
  if (obvApi) {
    obvApi.setPntsPointSize(newSize)
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
.obv-pnts-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #1a0f2e 0%, #2a1f4e 50%, #1a0f2e 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.obv-pnts-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 35% 65%, rgba(255, 20, 147, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 65% 35%, rgba(138, 43, 226, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(186, 85, 211, 0.08) 0%, transparent 50%);
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
  background: linear-gradient(135deg, rgba(30, 20, 50, 0.95) 0%, rgba(25, 15, 40, 0.9) 100%);
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 20, 147, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 20, 147, 0.15);
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
  background: linear-gradient(90deg, transparent, #ff1493, #da70d6, #ff1493, transparent);
  animation: scanline 3s linear infinite;
}

.controls::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.8), transparent);
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
  border: 2px solid rgba(255, 20, 147, 0.3);
  border-radius: 12px;
  font-size: 15px;
  background: linear-gradient(135deg, rgba(20, 15, 35, 0.8) 0%, rgba(15, 10, 25, 0.6) 100%);
  color: #ffe6ff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 20, 147, 0.1);
}

.urn-input::placeholder {
  color: rgba(255, 182, 193, 0.5);
  font-weight: 400;
  font-style: italic;
}

.urn-input:focus {
  outline: none;
  border-color: #ff1493;
  box-shadow:
    0 0 0 3px rgba(255, 20, 147, 0.2),
    0 0 20px rgba(255, 20, 147, 0.3),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(20, 15, 35, 0.95) 0%, rgba(15, 10, 25, 0.8) 100%);
  transform: translateY(-1px);
}

.load-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #ff1493 0%, #da70d6 50%, #ff1493 100%);
  background-size: 200% 200%;
  color: #1a0f2e;
  border: 2px solid rgba(255, 20, 147, 0.5);
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
    0 4px 20px rgba(255, 20, 147, 0.3),
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
    0 8px 30px rgba(255, 20, 147, 0.5),
    0 0 0 3px rgba(255, 20, 147, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  background-position: 100% 0;
  border-color: #ff1493;
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

.pnts-controls {
  position: absolute;
  z-index: 99;
  top: 160px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(135deg, rgba(30, 20, 50, 0.95) 0%, rgba(25, 15, 40, 0.9) 100%);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 20, 147, 0.15);
  backdrop-filter: blur(10px);
  min-width: 320px;
  max-height: 80vh;
  overflow-y: auto;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-label {
  color: #ffe6ff;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
}

.value-display {
  color: #ff1493;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  background: rgba(255, 20, 147, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 60px;
  text-align: center;
}

.range-input {
  flex: 1;
  height: 6px;
  background: rgba(255, 20, 147, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #ff1493;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 20, 147, 0.5);
  transition: all 0.3s ease;
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.7);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #ff1493 0%, #da70d6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c71585 0%, #ba55d3 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.4);
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
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 20, 50, 0.9));
  color: #ff1493;
  padding: 20px 30px;
  border-radius: 12px;
  border: 2px solid rgba(255, 20, 147, 0.3);
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
.obv-pnts-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(255, 20, 147, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 20, 147, 0.03) 1px, transparent 1px);
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

  .pnts-controls {
    top: 110px;
    right: 8px;
    min-width: 280px;
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

  .pnts-controls {
    top: 100px;
    right: 5px;
    left: 5px;
    min-width: auto;
  }
}

/* 暗色主题优化 */
@media (prefers-color-scheme: dark) {
  .obv-pnts-container {
    background: linear-gradient(135deg, #0f0817 0%, #1a0f2e 50%, #0f0817 100%);
  }
}
</style>