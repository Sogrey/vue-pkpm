<script setup>
import { RouterLink, RouterView } from 'vue-router'
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
      </nav>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
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
  }
}
</style>
