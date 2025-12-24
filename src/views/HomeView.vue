<template>
  <div class="home">
    <div class="welcome-section">
      <h1>欢迎使用 PKPM OBV Vue Demo</h1>
      <p class="subtitle">基于Vue.js的BIM模型查看器演示应用</p>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">📐</div>
        <h3>2D查看器</h3>
        <p>查看和分析二维图纸和模型</p>
        <router-link to="/obv-2d" class="feature-btn"> 进入2D查看器 </router-link>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🏗️</div>
        <h3>3D查看器</h3>
        <p>交互式三维模型浏览</p>
        <router-link to="/obv-3d" class="feature-btn"> 进入3D查看器 </router-link>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📄</div>
        <h3>文档查看器</h3>
        <p>完整的文档管理和查看</p>
        <router-link to="/obv-doc" class="feature-btn"> 进入文档查看器 </router-link>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🏢</div>
        <h3>3DTiles查看器</h3>
        <p>Cesium 3DTiles大规模模型加载</p>
        <router-link to="/obv-3dtiles" class="feature-btn"> 进入3DTiles查看器 </router-link>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🗺️</div>
        <h3>倾斜摄影查看器</h3>
        <p>OSGB倾斜摄影模型加载与GIS融合</p>
        <router-link to="/obv-osgbzip" class="feature-btn"> 进入倾斜摄影查看器 </router-link>
      </div>

      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>点云查看器</h3>
        <p>点云模型加载与参数调整</p>
        <router-link to="/obv-pnts-tileset" class="feature-btn"> 进入点云查看器 </router-link>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🗺️</div>
        <h3>TIF影像查看器</h3>
        <p>TIF影像加载与GIS地图集成</p>
        <router-link to="/obv-tifzip" class="feature-btn"> 进入TIF影像查看器 </router-link>
      </div>
    </div>

    <div class="info-section">
      <h2>使用说明</h2>
      <div class="info-list">
        <div class="info-item"><strong>步骤1:</strong> 获取有效的模型URN（统一资源名称）</div>
        <div class="info-item"><strong>步骤2:</strong> 在对应的查看器页面输入URN</div>
        <div class="info-item"><strong>步骤3:</strong> 点击"加载模型"按钮</div>
        <div class="info-item"><strong>注意:</strong> 需要有效的访问令牌才能加载模型</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  width: 80%;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.subtitle {
  color: #6c757d;
  font-size: 1.2rem;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  align-items: center;
}

.feature-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.feature-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.feature-btn:hover {
  background-color: #0056b3;
}

.info-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 2rem;
}

.info-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

@media (max-width: 768px) {
  h1 {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .feature-card {
    padding: 1.5rem;
  }
}
</style>
