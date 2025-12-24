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

const urn = ref('urn:bimbox.object:viewing_bucket/rvt-model')
const loading = ref(false)
const message = ref('')
let obvApi = null
let messageTimer = null

// 访问的令牌
const accessToken =
  'eyJhbGciOiJSUzI1NiJ9.eyJzY29wZSI6WyJvYnY6cmVhZCJdLCJleHAiOjE3NjY2NDEwNjEsImNsaWVudF9pZCI6ImFlY3dvcmtzLW9idi1jb21tdW5pdHkiLCJqdGkiOiIzNzhmM2Q4MS0yMGI4LTRjZWQtYWFhMi01OThmNjg1MDJhMDAifQ.Hkdyz_ZNqjzjjhc9hfOmXdervJqCNlsCGgotjTgu--9oSyU1TivYY-RysMOmlLcO4O7L2iTxwSyPaM02HRMvafCfemfg4VNY9JUdgW0M_1HdCPlOy67wTFT7aDBeAaWTKQ0VCDonEvKZ8uB1hMq19SsxniCTwDnqOq_ICxq5EmMGRaXemu5pDBre0KnkDBAt17pU_m1gH-QI3BNnl4aEuuiXdDL5jjv5oJdFYdgQ5JfOtAjg5yaqvOyypqo2jgPXwgv3XEpgrHdV3kKUG1Jv3nXyGmZjtHylYlpXE8tg3BOdZjqGlOt91yRnElfLhGQMkrtZwGumMUNJ-u3y9C28Rw'

const expiresIn = 600000

// 访问的令牌 getAccessToken 和 令牌有效期 expiresIn
// 获取token值
function getAccessToken(cb) {
  cb(accessToken, expiresIn)
}

async function loadModel() {
  if (!urn.value) return

  loading.value = true

  try {
    // 创建实例需要传入的参数，部署环境serviceConfig 和 用户有效期getAccessToken
    const applicationOptions = {
      // 配置 OBV 服务端（BIMServer）API 服务的 origin，这个适合于私有部署的用户使用
      getAccessToken: getAccessToken,
      refreshAccessToken: getAccessToken,
      serviceConfig: {
        origin: 'https://api.cloud.pkpm.cn',
        apiContextPath: '/bimserver/viewing/v3',
      },
    }

    // 创建一个viewer类，用于模型加载
    const builder = new OBV.Api.ObvBuilder()
    // 创建一个对象（实例化）
    const application = await builder.buildApplication(applicationOptions)
    // 创建 document 管理视图，加载完成后可以调用接口
    const obvDocument = await builder.loadDocument(application, urn.value, 'rvt-lod')
    // 创建 viewer 容器, 创建API
    obvApi = await builder.buildViewer3d(application, document.getElementById('obv-view'))
    // 获取三维视图
    const viewer3dItems = obvDocument.get3dGeometryItems()
    builder.load3dModels(obvApi, {
      obvDocument: obvDocument,
      viewer3dItem: viewer3dItems[0],
    })

    // 暴露到全局，方便调试
    window.obvApi = obvApi

    showMessage('3D模型加载成功')
    console.log('3D模型加载成功')
  } catch (error) {
    console.error('3D模型加载失败:', error)
    let errorMessage = '模型加载失败'
    
    // 安全地获取错误消息
    const errorMsg = error && error.message ? error.message : String(error)
    
    if (errorMsg.includes('Bad File Format')) {
      errorMessage = '环境贴图格式错误，正在使用简化模式...'
    } else if (errorMsg.includes('HDR')) {
      errorMessage = 'HDR 环境贴图加载失败，已禁用环境贴图'
    } else if (errorMsg.includes('network')) {
      errorMessage = '网络连接失败，请检查网络连接'
    } else {
      errorMessage = '模型加载失败：' + errorMsg
    }
    
    showMessage(errorMessage)
  } finally {
    loading.value = false
  }
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

// 世界坐标转屏幕坐标
function worldToClient() {
  if (!obvApi) return

  try {
    // 确保 THREE 对象存在
    if (typeof THREE === 'undefined') {
      showMessage('THREE.js 库未加载，请刷新页面重试')
      return
    }

    const screenCoordinate = obvApi.worldToClient(new THREE.Vector3(0, 0, 0))
    showMessage(
      '当前模型的屏幕坐标为：(' +
        Math.round(screenCoordinate.x) +
        ', ' +
        Math.round(screenCoordinate.y) +
        ')',
    )
  } catch (error) {
    console.error('坐标转换失败:', error)
    showMessage('坐标转换失败：' + error.message)
  }
}

// 屏幕坐标转世界坐标
function clientToWorld() {
  if (!obvApi) return

  try {
    const globalCoordinate = obvApi.clientToWorld(600, 400)
    if (globalCoordinate === undefined) {
      showMessage('模型不在当前位置范围！！')
    } else {
      showMessage(
        '当前模型的世界坐标位置为：(' +
          Math.round(globalCoordinate.x * 100) / 100 +
          ', ' +
          Math.round(globalCoordinate.y * 100) / 100 +
          ', ' +
          Math.round(globalCoordinate.z * 100) / 100 +
          ')',
      )
    }
  } catch (error) {
    console.error('坐标转换失败:', error)
    showMessage('坐标转换失败：' + error.message)
  }
}

onMounted(() => {
  // 确保OBV对象已加载
  if (typeof OBV === 'undefined') {
    console.error('OBV库未加载')
    return
  }

  // 确保THREE.js已加载
  if (typeof THREE === 'undefined') {
    console.error('THREE.js库未加载')
    return
  }
})

onUnmounted(() => {
  // 清理资源
  if (obvApi) {
    obvApi = null
  }
  if (messageTimer) {
    clearTimeout(messageTimer)
  }
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
