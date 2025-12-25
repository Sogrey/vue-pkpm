<template>
  <div class="token-config-overlay" v-if="showConfig" @click.self="closeConfig">
    <div class="token-config-modal">
      <div class="modal-header">
        <h3>
          <span class="icon">🔑</span>
          访问令牌配置
        </h3>
        <button @click="closeConfig" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="accessToken">
            <span class="label-icon">🎟️</span>
            访问令牌 (Access Token)
          </label>
          <textarea
            id="accessToken"
            v-model="localToken"
            placeholder="请输入您的访问令牌..."
            class="token-input"
            rows="4"
          ></textarea>
          <div class="token-info">
            <p>💡 提示：访问令牌有时效性，过期后需要重新配置</p>
          </div>
        </div>
        
        <div class="form-group">
          <label for="expiresIn">
            <span class="label-icon">⏰</span>
            有效期（毫秒）
          </label>
          <input
            id="expiresIn"
            type="number"
            v-model.number="localExpiresIn"
            placeholder="600000"
            class="number-input"
          />
          <div class="token-info">
            <p>默认 600000 毫秒（10分钟）</p>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="rememberToken" />
            <span class="checkmark"></span>
            记住令牌（存储在本地）
          </label>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="validateAndSave" class="save-btn" :disabled="!localToken.trim()">
          <span class="btn-icon">✅</span>
          保存配置
        </button>
        <button @click="testToken" class="test-btn" :disabled="!localToken.trim()">
          <span class="btn-icon">🧪</span>
          测试连接
        </button>
        <button @click="clearToken" class="clear-btn">
          <span class="btn-icon">🗑️</span>
          清除令牌
        </button>
      </div>
      
      <div v-if="message" class="message" :class="messageType">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  showConfig: {
    type: Boolean,
    default: false
  },
  currentToken: {
    type: String,
    default: ''
  },
  currentExpiresIn: {
    type: Number,
    default: 600000
  }
})

const emit = defineEmits(['close', 'save', 'test'])

const localToken = ref('')
const localExpiresIn = ref(600000)
const rememberToken = ref(true)
const message = ref('')
const messageType = ref('info')

// 监听props变化
watch(() => props.showConfig, (newVal) => {
  if (newVal) {
    localToken.value = props.currentToken
    localExpiresIn.value = props.currentExpiresIn
    // 检查本地存储
    const stored = localStorage.getItem('obv_token_config')
    if (stored) {
      try {
        const config = JSON.parse(stored)
        rememberToken.value = true
      } catch (e) {
        rememberToken.value = false
      }
    }
  }
})

// 验证token格式
function validateToken(token) {
  // JWT token格式验证
  const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/
  return jwtRegex.test(token.trim())
}

// 验证并保存
function validateAndSave() {
  const token = localToken.value.trim()
  
  if (!token) {
    showMessage('请输入访问令牌', 'error')
    return
  }
  
  if (!validateToken(token)) {
    showMessage('令牌格式无效，请检查是否为有效的JWT令牌', 'error')
    return
  }
  
  // 保存配置
  const config = {
    accessToken: token,
    expiresIn: localExpiresIn.value || 600000,
    timestamp: Date.now()
  }
  
  if (rememberToken.value) {
    localStorage.setItem('obv_token_config', JSON.stringify(config))
  } else {
    localStorage.removeItem('obv_token_config')
  }
  
  emit('save', config)
  showMessage('令牌配置已保存', 'success')
  
  setTimeout(() => {
    closeConfig()
  }, 1500)
}

// 测试token
async function testToken() {
  const token = localToken.value.trim()
  
  if (!token) {
    showMessage('请先输入访问令牌', 'error')
    return
  }
  
  if (!validateToken(token)) {
    showMessage('令牌格式无效', 'error')
    return
  }
  
  showMessage('正在测试令牌...', 'info')
  
  try {
    // 这里可以添加实际的token验证逻辑
    // 暂时模拟验证过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 简单的JWT解析验证
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]))
      const now = Math.floor(Date.now() / 1000)
      
      if (payload.exp && payload.exp < now) {
        showMessage('令牌已过期', 'error')
        return
      }
      
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000)
        showMessage(`令牌有效，过期时间：${expDate.toLocaleString()}`, 'success')
      } else {
        showMessage('令牌格式正确，但无过期时间信息', 'warning')
      }
    }
    
    emit('test', { valid: true, token })
  } catch (error) {
    showMessage('令牌验证失败：' + error.message, 'error')
  }
}

// 清除token
function clearToken() {
  localStorage.removeItem('obv_token_config')
  localToken.value = ''
  localExpiresIn.value = 600000
  showMessage('令牌已清除', 'info')
  emit('save', { accessToken: '', expiresIn: 600000 })
}

// 关闭配置
function closeConfig() {
  emit('close')
}

// 显示消息
function showMessage(text, type = 'info') {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// 组件挂载时加载本地存储
onMounted(() => {
  const stored = localStorage.getItem('obv_token_config')
  if (stored) {
    try {
      const config = JSON.parse(stored)
      if (config.accessToken) {
        emit('save', config)
      }
    } catch (e) {
      console.error('Failed to parse stored token config:', e)
      localStorage.removeItem('obv_token_config')
    }
  }
})
</script>

<style scoped>
.token-config-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.token-config-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 0;
  min-width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.modal-body {
  padding: 28px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.label-icon {
  font-size: 16px;
}

.token-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  resize: vertical;
  transition: all 0.3s ease;
}

.token-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.number-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
}

.number-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.token-info {
  margin-top: 8px;
}

.token-info p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin: 0;
  padding-left: 4px;
}

.checkbox-label {
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: #4CAF50;
  border-color: #4CAF50;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.modal-footer {
  padding: 20px 28px 28px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-footer button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.save-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.test-btn {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.test-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.clear-btn {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
}

.clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.modal-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 14px;
}

.message {
  margin: 16px 28px 0;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.message.info {
  background: rgba(33, 150, 243, 0.2);
  color: #64B5F6;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.message.success {
  background: rgba(76, 175, 80, 0.2);
  color: #81C784;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.message.error {
  background: rgba(244, 67, 54, 0.2);
  color: #E57373;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.message.warning {
  background: rgba(255, 193, 7, 0.2);
  color: #FFD54F;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .token-config-modal {
    min-width: auto;
    width: 95%;
    margin: 20px;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 16px 20px 20px;
    flex-direction: column;
  }
  
  .modal-footer button {
    width: 100%;
    justify-content: center;
  }
}
</style>