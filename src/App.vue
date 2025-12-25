<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import TokenConfig from './components/TokenConfig.vue'
import { TokenManager } from './config/obv-config.js'

const showTokenConfig = ref(false)
const currentToken = ref('')
const currentExpiresIn = ref(600000)

// 更新当前token信息
function updateCurrentToken() {
  const config = TokenManager.getConfig()
  currentToken.value = config.accessToken
  currentExpiresIn.value = config.expiresIn
}

// 打开token配置
function openTokenConfig() {
  updateCurrentToken()
  showTokenConfig.value = true
}

// 关闭token配置
function closeTokenConfig() {
  showTokenConfig.value = false
}

// 保存token配置
function saveTokenConfig(config) {
  TokenManager.updateConfig(config)
  updateCurrentToken()
}

// 测试token
function testToken(config) {
  console.log('Testing token:', config)
  // 这里可以添加实际的token测试逻辑
}

// 获取token状态信息
function getTokenStatus() {
  if (TokenManager.isTokenExpired()) {
    return 'expired'
  }
  
  const remainingTime = TokenManager.getTokenRemainingTime()
  if (remainingTime < 5 * 60 * 1000) { // 5分钟内过期
    return 'expiring'
  }
  
  return 'valid'
}

// 获取token状态显示文本
function getTokenStatusText() {
  const status = getTokenStatus()
  switch (status) {
    case 'expired':
      return '令牌已过期'
    case 'expiring':
      return '即将过期'
    case 'valid':
      return '令牌有效'
    default:
      return '状态未知'
  }
}

// 获取token状态样式
function getTokenStatusClass() {
  const status = getTokenStatus()
  return {
    'token-status': true,
    'status-expired': status === 'expired',
    'status-expiring': status === 'expiring',
    'status-valid': status === 'valid'
  }
}

// 组件挂载时初始化
onMounted(() => {
  updateCurrentToken()
})
</script>

<template>
  <header>
    <div class="header-content">
      <div class="logo-section">
        <h1 class="app-title">PKPM OBV Vue Demo</h1>
      </div>

      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/obv-2d">2D查看器</RouterLink>
        <RouterLink to="/obv-3d">3D查看器</RouterLink>
        <RouterLink to="/obv-doc">文档查看器</RouterLink>
        <div class="token-section">
          <button @click="openTokenConfig" class="token-config-btn" :class="getTokenStatusClass()">
            <span class="token-icon">🔑</span>
            <span class="token-text">{{ getTokenStatusText() }}</span>
          </button>
        </div>
      </nav>
    </div>
  </header>

  <main>
    <RouterView />
  </main>

  <!-- Token配置弹窗 -->
  <TokenConfig
    :showConfig="showTokenConfig"
    :currentToken="currentToken"
    :currentExpiresIn="currentExpiresIn"
    @close="closeTokenConfig"
    @save="saveTokenConfig"
    @test="testToken"
  />
</template>

<style scoped>
header {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  text-decoration: none;
  color: #6c757d;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-weight: 500;
}

nav a:hover {
  background-color: #f8f9fa;
  color: #495057;
}

nav a.router-link-exact-active {
  background-color: #007bff;
  color: white;
}

nav a.router-link-exact-active:hover {
  background-color: #0056b3;
}

.token-section {
  margin-left: 1rem;
}

.token-config-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1rem;
  border: 2px solid;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
}

.token-icon {
  font-size: 16px;
}

.token-text {
  font-size: 13px;
}

.token-status.status-valid {
  border-color: #28a745;
  color: #28a745;
}

.token-status.status-valid:hover {
  background-color: rgba(40, 167, 69, 0.1);
}

.token-status.status-expiring {
  border-color: #ffc107;
  color: #856404;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05));
  animation: pulse-warning 2s infinite;
}

.token-status.status-expiring:hover {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.1));
}

.token-status.status-expired {
  border-color: #dc3545;
  color: #dc3545;
  animation: pulse-danger 1.5s infinite;
}

.token-status.status-expired:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

@keyframes pulse-warning {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 193, 7, 0);
  }
}

@keyframes pulse-danger {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(220, 53, 69, 0);
  }
}

main {
  width: 100%;
  height: calc(100vh - 73px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  nav {
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }

  .token-section {
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .token-config-btn {
    padding: 0.4rem 0.8rem;
    font-size: 13px;
  }

  .token-text {
    font-size: 12px;
  }
}
</style>
