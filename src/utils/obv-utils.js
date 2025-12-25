/**
 * OBV工具类
 * 提供公共的OBV功能和工具函数
 */

import { TokenManager, getApplicationOptions, ErrorTypes } from '../config/obv-config.js'

/**
 * 消息提示工具类
 */
export class MessageManager {
  constructor() {
    this.messageTimer = null
  }

  /**
   * 显示消息
   * @param {Function} setMessage - 设置消息的函数
   * @param {string} text - 消息内容
   * @param {number} duration - 显示时长
   */
  showMessage(setMessage, text, duration = 3000) {
    setMessage(text)
    if (this.messageTimer) {
      clearTimeout(this.messageTimer)
    }
    this.messageTimer = setTimeout(() => {
      setMessage('')
    }, duration)
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer)
      this.messageTimer = null
    }
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 分析错误类型
   * @param {Error|string} error - 错误对象或错误消息
   * @returns {Object} 包含错误类型和错误消息的对象
   */
  static analyzeError(error) {
    const errorMsg = error && error.message ? error.message : String(error)
    
    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      return {
        type: ErrorTypes.NETWORK,
        message: '网络连接失败，请检查网络连接'
      }
    } else if (errorMsg.includes('token') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return {
        type: ErrorTypes.TOKEN,
        message: '访问令牌无效或已过期，请重新配置令牌'
      }
    } else if (errorMsg.includes('Bad File Format') || errorMsg.includes('HDR')) {
      return {
        type: ErrorTypes.FORMAT,
        message: '环境贴图格式错误，正在使用简化模式...'
      }
    } else if (errorMsg.includes('file') || errorMsg.includes('format')) {
      return {
        type: ErrorTypes.FILE,
        message: '文档格式不支持或文件损坏'
      }
    } else {
      return {
        type: ErrorTypes.UNKNOWN,
        message: '加载失败：' + errorMsg
      }
    }
  }

  /**
   * 处理错误
   * @param {Error|string} error - 错误对象或错误消息
   * @param {string} context - 错误上下文（如"2D图纸"、"3D模型"等）
   * @returns {string} 用户友好的错误消息
   */
  static handleError(error, context = '模型') {
    const { message } = this.analyzeError(error)
    return context ? `${context}${message}` : message
  }
}

/**
 * OBV加载器基础类
 */
export class BaseOBVLoader {
  constructor() {
    this.obvApi = null
    this.builder = null
    this.application = null
    this.messageManager = new MessageManager()
  }

  /**
   * 初始化应用程序
   * @returns {Promise<void>}
   */
  async initApplication() {
    const applicationOptions = getApplicationOptions()
    this.builder = new OBV.Api.ObvBuilder()
    this.application = await this.builder.buildApplication(applicationOptions)
  }

  /**
   * 加载文档
   * @param {string} urn - 模型URN
   * @param {string} jobType - 模型类型
   * @returns {Promise<Object>} 文档对象
   */
  async loadDocument(urn, jobType) {
    if (!this.builder || !this.application) {
      await this.initApplication()
    }
    return await this.builder.loadDocument(this.application, urn, jobType)
  }

  /**
   * 创建3D查看器
   * @param {HTMLElement} container - 容器元素
   * @returns {Promise<Object>} OBV API对象
   */
  async create3DViewer(container) {
    if (!this.builder || !this.application) {
      await this.initApplication()
    }
    this.obvApi = await this.builder.buildViewer3d(this.application, container)
    return this.obvApi
  }

  /**
   * 创建2D查看器
   * @param {HTMLElement} container - 容器元素
   * @returns {Promise<Object>} OBV API对象
   */
  async create2DViewer(container) {
    if (!this.builder || !this.application) {
      await this.initApplication()
    }
    this.obvApi = await this.builder.buildViewer2d(this.application, container)
    return this.obvApi
  }

  /**
   * 创建文档查看器
   * @param {HTMLElement} container - 容器元素
   * @returns {Promise<Object>} OBV API对象
   */
  async createDocViewer(container) {
    if (!this.builder || !this.application) {
      await this.initApplication()
    }
    this.obvApi = await this.builder.buildViewerDoc(this.application, container)
    return this.obvApi
  }

  /**
   * 加载2D模型
   * @param {Object} document - 文档对象
   * @param {Object} viewer2dItem - 2D查看器项
   * @returns {Promise<void>}
   */
  async load2DModel(document, viewer2dItem) {
    if (!this.builder || !this.obvApi) {
      throw new Error('Builder or OBV API not initialized')
    }
    return await this.builder.load2dModels(this.obvApi, {
      obvDocument: document,
      viewer2dItem: viewer2dItem
    })
  }

  /**
   * 加载3D模型
   * @param {Object} document - 文档对象
   * @param {Object} viewer3dItem - 3D查看器项
   * @param {Object} options - 加载选项
   * @returns {Promise<void>}
   */
  async load3DModel(document, viewer3dItem, options = {}) {
    if (!this.builder || !this.obvApi) {
      throw new Error('Builder or OBV API not initialized')
    }
    return await this.builder.load3dModels(this.obvApi, {
      obvDocument: document,
      viewer3dItem: viewer3dItem,
      ...options
    })
  }

  /**
   * 加载文档模型
   * @param {Object} document - 文档对象
   * @param {Object} viewerDocItem - 文档查看器项
   * @returns {Promise<void>}
   */
  async loadDocModel(document, viewerDocItem) {
    if (!this.builder || !this.obvApi) {
      throw new Error('Builder or OBV API not initialized')
    }
    return await this.builder.loadDocModels(this.obvApi, document, viewerDocItem)
  }

  /**
   * 暴露OBV API到全局
   */
  exposeToGlobal() {
    if (this.obvApi) {
      window.obvApi = this.obvApi
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.messageManager) {
      this.messageManager.destroy()
    }
    this.obvApi = null
    this.builder = null
    this.application = null
  }
}

/**
 * 模型工具类
 */
export class ModelUtils {
  /**
   * 卸载所有BIM模型
   * @param {Object} obvApi - OBV API对象
   */
  static unloadAllBIMModels(obvApi) {
    if (!obvApi) return
    
    try {
      const ids = obvApi.getModelIds()
      for (let i = 0; i < ids.length; i++) {
        let model = obvApi.getModelById(ids[i])
        obvApi.unloadModel(ids[i])
        model.dispose()
        model = null
      }
    } catch (error) {
      console.error('卸载BIM模型失败:', error)
    }
  }

  /**
   * 重置到主视图
   * @param {Object} obvApi - OBV API对象
   */
  static resetToHomeView(obvApi) {
    if (!obvApi) return
    
    try {
      obvApi.setRequestHomeView()
    } catch (error) {
      console.error('重置视图失败:', error)
    }
  }

  /**
   * 创建URN映射表
   * @param {Array} urnList - URN列表
   * @param {Object} builder - Builder对象
   * @param {Object} application - Application对象
   * @returns {Promise<Map>} URN映射表
   */
  static async createUrnMap(urnList, builder, application) {
    const urnMap = new Map()
    
    for (let i = 0; i < urnList.length; i++) {
      const document = await builder.loadDocument(application, urnList[i].urn, urnList[i].jobType)
      urnMap.set(urnList[i].urn, document)
    }
    
    return urnMap
  }
}

/**
 * 坐标转换工具类
 */
export class CoordinateUtils {
  /**
   * 世界坐标转屏幕坐标
   * @param {Object} obvApi - OBV API对象
   * @param {Object} worldPos - 世界坐标 {x, y, z}
   * @returns {Object} 屏幕坐标 {x, y} 或错误信息
   */
  static worldToClient(obvApi, worldPos) {
    if (!obvApi || !worldPos) {
      return { error: 'OBV API或世界坐标参数缺失' }
    }

    try {
      if (typeof THREE === 'undefined') {
        return { error: 'THREE.js 库未加载' }
      }

      const vector = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z)
      const screenCoordinate = obvApi.worldToClient(vector)
      return { success: true, coordinate: screenCoordinate }
    } catch (error) {
      return { error: '坐标转换失败: ' + error.message }
    }
  }

  /**
   * 屏幕坐标转世界坐标
   * @param {Object} obvApi - OBV API对象
   * @param {number} screenX - 屏幕X坐标
   * @param {number} screenY - 屏幕Y坐标
   * @returns {Object} 世界坐标或错误信息
   */
  static clientToWorld(obvApi, screenX, screenY) {
    if (!obvApi) {
      return { error: 'OBV API参数缺失' }
    }

    try {
      const globalCoordinate = obvApi.clientToWorld(screenX, screenY)
      if (globalCoordinate === undefined) {
        return { error: '模型不在当前位置范围' }
      }
      return { success: true, coordinate: globalCoordinate }
    } catch (error) {
      return { error: '坐标转换失败: ' + error.message }
    }
  }
}

/**
 * 检查工具类
 */
export class ValidationUtils {
  /**
   * 检查OBV库是否加载
   * @returns {Object} 检查结果
   */
  static checkOBVLibrary() {
    if (typeof OBV === 'undefined') {
      return { valid: false, message: 'OBV库未加载' }
    }
    return { valid: true }
  }

  /**
   * 检查THREE.js库是否加载
   * @returns {Object} 检查结果
   */
  static checkTHREELibrary() {
    if (typeof THREE === 'undefined') {
      return { valid: false, message: 'THREE.js库未加载' }
    }
    return { valid: true }
  }

  /**
   * 验证URN格式
   * @param {string} urn - URN字符串
   * @returns {boolean} 是否有效
   */
  static validateURN(urn) {
    if (!urn || typeof urn !== 'string') {
      return false
    }
    return urn.startsWith('urn:bimbox.object:')
  }

  /**
   * 验证容器元素
   * @param {HTMLElement} container - 容器元素
   * @returns {Object} 验证结果
   */
  static validateContainer(container) {
    if (!container) {
      return { valid: false, message: '容器元素不存在' }
    }
    if (!(container instanceof HTMLElement)) {
      return { valid: false, message: '容器元素类型错误' }
    }
    return { valid: true }
  }
}