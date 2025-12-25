<template>
  <div class="obv-3dtiles-container">
    <div class="controls">
      <input v-model="urn" placeholder="请输入3DTiles模型URN" class="urn-input" />
      <input v-model="bimsId" placeholder="请输入BIMS ID" class="urn-input" style="flex: 0.5;" />
      <button @click="loadModel" :disabled="!urn || loading" class="load-btn">
        {{ loading ? '加载中...' : '加载3DTiles' }}
      </button>
    </div>
    <div v-if="message" class="message-toast">
      {{ message }}
    </div>
    <div id="cesiumContainer" class="cesium-viewer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { defaultUrns, defaultBimsIds, serviceConfig, TokenManager } from '../config/obv-config.js'
import { MessageManager } from '../utils/obv-utils.js'

const urn = ref(defaultUrns['3dtiles-pmodel'])
const bimsId = ref(defaultBimsIds['default'])
const loading = ref(false)
const message = ref('')
let viewer = null
let tileset2 = null
let messageManager = null

// 获取token值
function getAccessToken(cb) {
  if (TokenManager.isTokenExpired()) {
    cb('', 0)
    return
  }
  cb(TokenManager.getAccessToken(), TokenManager.getExpiresIn())
}

// 获取属性信息
function getPro(pickedFeature) {
  if (typeof Cesium !== 'undefined' && Cesium.defined(pickedFeature)) {
    try {
      const url = serviceConfig.origin + "/bims-api/bims/v2/subdatas/" + bimsId.value + "/components/search"
      const batchId = pickedFeature._content.batchTable._propertyTable._jsonMetadataTable._properties.dbId[pickedFeature._batchId]
      const senddata = {
        "propsConditions": [
          {
            "key": "batch:id",
            "operateSymbol": 4,
            "value": JSON.stringify(batchId)
          }
        ]
      }
      
      // 获取token
      let token = ''
      getAccessToken((data) => {
        token = data
      })
      
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Authorization', 'Bearer ' + token)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.send(JSON.stringify(senddata))
      xhr.onload = function() {
        if (xhr.response) {
          try {
            const response = JSON.parse(xhr.response)
            messageManager.showMessage((msg) => message.value = msg, '属性信息：' + JSON.stringify(response))
          } catch (e) {
            messageManager.showMessage((msg) => message.value = msg, '属性信息：' + xhr.response)
          }
        }
      }
    } catch (error) {
      messageManager.showMessage((msg) => message.value = msg, '获取属性信息失败：' + error.message)
    }
  }
}

async function loadModel() {
  if (!urn.value) return

  loading.value = true

  try {
    // 检查Cesium是否加载
    if (typeof Cesium === 'undefined') {
      throw new Error('Cesium库未加载，请刷新页面重试')
    }

    // 清理现有的viewer
    if (viewer) {
      viewer.destroy()
      viewer = null
    }

    // 创建Cesium viewer
    viewer = new Cesium.Viewer("cesiumContainer", {
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      timeline: true,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: true,
      homeButton: false,
      fullscreenButton: false,
      imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        maximumLevel: 18
      }),
    })

    viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH]
    viewer.scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.PINCH, Cesium.CameraEventType.RIGHT_DRAG]
    viewer.scene.light.intensity = 10
    viewer.clockViewModel.currentTime = new Cesium.JulianDate.fromIso8601('2023-08-02T08:00:00Z')
    viewer.timeline.updateFromClock()

    const options = {}
    options.defaultResetView = Cesium.Rectangle.fromDegrees(71, 3, 90, 14)
    options.enableCompass = true
    options.enableZoomControls = false
    options.enableDistanceLegend = false

    // 获取模型URL
    const data = await main()
    const resource = new Cesium.Resource({
      url: data.url,
      headers: {
        "Authorization": data.token
      },
    })

    const pos1 = Cesium.Cartesian3.fromDegrees(116.5875740049029, 39.90861869311058, 10)
    const matrix1 = Cesium.Transforms.eastNorthUpToFixedFrame(pos1)
    const rz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(284.275254))
    const rotationZ = Cesium.Matrix4.fromRotationTranslation(rz)

    tileset2 = new Cesium.Cesium3DTileset({
      url: resource
    })

    tileset2.readyPromise.then(function(tileset) {
      viewer.scene.primitives.add(tileset)
      tileset2._root.transform = matrix1
      viewer.zoomTo(tileset2, new Cesium.HeadingPitchRange(0, -tileset2.boundingSphere.radius * 10.0, 0))
    })

    // 添加点击事件处理
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    const selected = {
      feature: undefined,
      originalColor: new Cesium.Color(),
    }

    const selectedEntity = new Cesium.Entity()
    const clickHandler = viewer.screenSpaceEventHandler.getInputAction(
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )

    if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(viewer.scene)) {
      const silhouetteBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage()
      silhouetteBlue.uniforms.color = Cesium.Color.BLUE
      silhouetteBlue.uniforms.length = 0.01
      silhouetteBlue.selected = []

      const silhouetteGreen = Cesium.PostProcessStageLibrary.createEdgeDetectionStage()
      silhouetteGreen.uniforms.color = Cesium.Color.LIME
      silhouetteGreen.uniforms.length = 0.01
      silhouetteGreen.selected = []

      viewer.scene.postProcessStages.add(
        Cesium.PostProcessStageLibrary.createSilhouetteStage([
          silhouetteBlue,
          silhouetteGreen,
        ])
      )

      viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
        silhouetteGreen.selected = []
        const pickedFeature = viewer.scene.pick(movement.position)

        if (!Cesium.defined(pickedFeature)) {
          clickHandler(movement)
          return
        }

        silhouetteGreen.selected = [pickedFeature]
        getPro(pickedFeature)
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }

    // 暴露到全局，方便调试
    window.viewer = viewer
    window.tileset = tileset2

    messageManager.showMessage((msg) => message.value = msg, '3DTiles模型加载成功')
    console.log('3DTiles模型加载成功')

  } catch (error) {
    console.error('3DTiles模型加载失败:', error)
    let errorMessage = '3DTiles模型加载失败'
    
    const errorMsg = error && error.message ? error.message : String(error)
    
    if (errorMsg.includes('Cesium')) {
      errorMessage = 'Cesium库加载失败，请刷新页面重试'
    } else if (errorMsg.includes('network')) {
      errorMessage = '网络连接失败，请检查网络连接'
    } else if (errorMsg.includes('token')) {
      errorMessage = '访问令牌无效，请重新授权'
    } else {
      errorMessage = '3DTiles模型加载失败：' + errorMsg
    }
    
    messageManager.showMessage((msg) => message.value = msg, errorMessage)
  } finally {
    loading.value = false
  }
}

async function main() {
  const applicationOptions = {
    getAccessToken: getAccessToken,
    refreshAccessToken: getAccessToken,
    serviceConfig: {
      origin: serviceConfig.origin,
      apiContextPath: serviceConfig.apiContextPath,
    },
  }

  const builder = new OBV.Api.ObvBuilder()
  const application = await builder.buildApplication(applicationOptions)
  const obvDocument = await builder.loadDocument(application, urn.value, 'pmodel-lod')
  
  let manifest = obvDocument._manifest
  var manifestUrn = manifest.urn
  var pos = manifestUrn.lastIndexOf("/")
  var resultkey = manifestUrn.substr(pos)

  let rePath
  for (let i = 0; i < manifest.children[0].children.length; i++) {
    if (manifest.children[0].children[i].type === 'geometry') {
      if (manifest.children[0].children[i].children[0].role === 'graphics') {
        var viewUrn = manifest.children[0].children[i].children[0].urn
        pos = viewUrn.indexOf("/")
        rePath = viewUrn.substr(pos)
        break
      }
    }
  }

  var urlHead = serviceConfig.origin + "/bimserver/viewing/v3/datas"
  var modelUrl = urlHead + resultkey + rePath

  return {
    token: TokenManager.getAccessToken(),
    url: modelUrl
  }
}

onMounted(() => {
  messageManager = new MessageManager()
  // 检查Cesium和OBV库是否加载
  if (typeof Cesium === 'undefined') {
    console.error('Cesium库未加载')
    messageManager.showMessage((msg) => message.value = msg, 'Cesium库未加载，请刷新页面重试')
    return
  }
  
  if (typeof OBV === 'undefined') {
    console.error('OBV库未加载')
    messageManager.showMessage((msg) => message.value = msg, 'OBV库未加载，请刷新页面重试')
    return
  }
})

onUnmounted(() => {
  // 清理资源
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
  if (messageManager) {
    messageManager.destroy()
    messageManager = null
  }
})
</script>

<style scoped>
.obv-3dtiles-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0f1f 0%, #1a1f2e 50%, #0a0f1f 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.obv-3dtiles-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 25% 75%, rgba(30, 144, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 75% 25%, rgba(0, 191, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(135, 206, 250, 0.08) 0%, transparent 50%);
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
  background: linear-gradient(135deg, rgba(20, 30, 50, 0.95) 0%, rgba(15, 25, 40, 0.9) 100%);
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(30, 144, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(30, 144, 255, 0.15);
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
  background: linear-gradient(90deg, transparent, #1e90ff, #00bfff, #1e90ff, transparent);
  animation: scanline 3s linear infinite;
}

.controls::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(30, 144, 255, 0.8), transparent);
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
  border: 2px solid rgba(30, 144, 255, 0.3);
  border-radius: 12px;
  font-size: 15px;
  background: linear-gradient(135deg, rgba(10, 20, 40, 0.8) 0%, rgba(5, 15, 30, 0.6) 100%);
  color: #e6f3ff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(30, 144, 255, 0.1);
}

.urn-input::placeholder {
  color: rgba(173, 216, 230, 0.5);
  font-weight: 400;
  font-style: italic;
}

.urn-input:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow:
    0 0 0 3px rgba(30, 144, 255, 0.2),
    0 0 20px rgba(30, 144, 255, 0.3),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(10, 20, 40, 0.95) 0%, rgba(5, 15, 30, 0.8) 100%);
  transform: translateY(-1px);
}

.load-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #1e90ff 0%, #4169e1 50%, #1e90ff 100%);
  background-size: 200% 200%;
  color: #0a0f1f;
  border: 2px solid rgba(30, 144, 255, 0.5);
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
    0 4px 20px rgba(30, 144, 255, 0.3),
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
    0 8px 30px rgba(30, 144, 255, 0.5),
    0 0 0 3px rgba(30, 144, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  background-position: 100% 0;
  border-color: #1e90ff;
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

.message-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 30, 50, 0.9));
  color: #1e90ff;
  padding: 20px 30px;
  border-radius: 12px;
  border: 2px solid rgba(30, 144, 255, 0.3);
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

.cesium-viewer {
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
.obv-3dtiles-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(30, 144, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 144, 255, 0.03) 1px, transparent 1px);
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
  .obv-3dtiles-container {
    background: linear-gradient(135deg, #050815 0%, #0a0f1f 50%, #050815 100%);
  }
}
</style>