<template>
  <div class="obv-doc-container">
    <div class="controls">
      <input v-model="urn" placeholder="请输入模型URN" class="urn-input" />
      <button @click="loadModel" :disabled="!urn || loading" class="load-btn">
        {{ loading ? '加载中...' : '加载模型' }}
      </button>
    </div>
    <div id="obv-view" class="obv-viewer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const urn = ref('urn:bimbox.object:viewing_bucket/doc-model')
const loading = ref(false)
let obvApi = null

// 访问的令牌
const accessToken = ''
const expiresIn = 600000

// 获取token值
function getAccessToken(cb) {
  cb(accessToken, expiresIn)
}

async function loadModel() {
  if (!urn.value) return

  loading.value = true

  try {
    // 创建实例需要传入的参数
    const applicationOptions = {
      getAccessToken: getAccessToken,
      refreshAccessToken: getAccessToken,
      serviceConfig: {
        origin: 'https://api.cloud.pkpm.cn',
        apiContextPath: '/bimserver/viewing/v3',
      },
    }

    // 定义urn，模型的唯一标识
    // urn:bimbox.object:{bucket_key}/{object_key}

    // 创建一个viewer类，用于模型加载
    const builder = new OBV.Api.ObvBuilder()
    // 创建一个对象（实例化）
    const application = await builder.buildApplication(applicationOptions)
    // 加载 document 管理视图，加载完成后可以调用接口
    const obvDocument = await builder.loadDocument(application, urn.value)
    // 创建 viewer 容器, 创建API
    obvApi = await builder.buildViewerDoc(application, document.getElementById('obv-view'))
    // 获取Doc视图
    const viewerDocItems = obvDocument.getDocItems()
    builder.loadDocModels(obvApi, obvDocument, viewerDocItems[0])

    console.log('文档模型加载成功')
  } catch (error) {
    console.error('文档模型加载失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 确保OBV对象已加载
  if (typeof OBV === 'undefined') {
    console.error('OBV库未加载')
    return
  }
})

onUnmounted(() => {
  // 清理资源
  if (obvApi) {
    obvApi = null
  }
})
</script>

<style scoped>
.obv-doc-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0817 0%, #1e0b2e 50%, #0f0817 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.obv-doc-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 25% 75%, rgba(255, 0, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 75% 25%, rgba(138, 43, 226, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 45% 55%, rgba(186, 85, 211, 0.08) 0%, transparent 50%);
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
  background: linear-gradient(135deg, 
    rgba(30, 15, 45, 0.95) 0%, 
    rgba(25, 10, 40, 0.9) 100%);
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 0, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 255, 0.15);
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
  background: linear-gradient(90deg, 
    transparent, 
    #ff00ff, 
    #8a2be2, 
    #ff00ff, 
    transparent);
  animation: scanline 3s linear infinite;
}

.controls::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 0, 255, 0.8), 
    transparent);
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
  border: 2px solid rgba(255, 0, 255, 0.3);
  border-radius: 12px;
  font-size: 15px;
  background: linear-gradient(135deg, 
    rgba(15, 8, 30, 0.8) 0%, 
    rgba(10, 5, 20, 0.6) 100%);
  color: #ffe0ff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 0, 255, 0.1);
}

.urn-input::placeholder {
  color: rgba(255, 200, 255, 0.5);
  font-weight: 400;
  font-style: italic;
}

.urn-input:focus {
  outline: none;
  border-color: #ff00ff;
  box-shadow: 
    0 0 0 3px rgba(255, 0, 255, 0.2),
    0 0 20px rgba(255, 0, 255, 0.3),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, 
    rgba(15, 8, 30, 0.95) 0%, 
    rgba(10, 5, 20, 0.8) 100%);
  transform: translateY(-1px);
}

.load-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, 
    #ff00ff 0%, 
    #8a2be2 50%, 
    #ff00ff 100%);
  background-size: 200% 200%;
  color: #0f0817;
  border: 2px solid rgba(255, 0, 255, 0.5);
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
    0 4px 20px rgba(255, 0, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.load-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.4), 
    transparent);
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
    0 8px 30px rgba(255, 0, 255, 0.5),
    0 0 0 3px rgba(255, 0, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  background-position: 100% 0;
  border-color: #ff00ff;
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
  background: linear-gradient(135deg, 
    rgba(60, 60, 60, 0.3) 0%, 
    rgba(40, 40, 40, 0.2) 100%);
  color: rgba(160, 160, 160, 0.5);
  cursor: not-allowed;
  transform: none;
  opacity: 0.6;
  border-color: rgba(80, 80, 80, 0.3);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
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
.obv-doc-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 0, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 0, 255, 0.03) 1px, transparent 1px);
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
  .obv-doc-container {
    background: linear-gradient(135deg, #050307 0%, #0f0817 50%, #050307 100%);
  }
}
</style>
