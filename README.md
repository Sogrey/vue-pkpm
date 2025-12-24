# PKPM OBV Vue Demo

基于Vue.js的PKPM OBV BIM模型查看器演示应用。

## 功能特性

- 📐 **2D查看器** - 查看和分析二维图纸和模型，支持视图状态管理
- 🏗️ **3D查看器** - 交互式三维模型浏览，支持坐标系转换
- 📄 **文档查看器** - 完整的文档管理和查看
- 🏢 **3DTiles查看器** - Cesium 3DTiles大规模模型加载与属性查询
- 🗺️ **倾斜摄影查看器** - OSGB倾斜摄影模型加载与GIS融合
- ⚡ **点云查看器** - 点云模型加载与实时参数调节
- 🗺️ **TIF影像查看器** - TIF影像加载与GIS地图集成
- 🌍 **多语言支持** - 已本地化123种语言的国际化资源
- 🎨 **现代化UI** - 响应式设计，科技感界面
- 💬 **友好提示** - 完善的错误处理和用户反馈系统

## 项目结构

```
vue-pkpm/
├── public/
│   └── libs/                     # OBV库文件
│       └── bimviewer/
│           └── viewer/
│               ├── v4/locale/    # v4版本国际化文件
│               └── v5/locale/    # v5版本国际化文件
├── src/
│   ├── views/
│   │   ├── HomeView.vue         # 首页
│   │   ├── OBV2DView.vue        # 2D查看器
│   │   ├── OBV3DView.vue        # 3D查看器
│   │   ├── OBVDocView.vue       # 文档查看器
│   │   ├── OBV3DTilesView.vue   # 3DTiles查看器
│   │   ├── OBVOsgbzipView.vue   # 倾斜摄影查看器
│   │   ├── OBVPntsTilesetView.vue # 点云查看器
│   │   └── OBVTifzipView.vue    # TIF影像查看器
│   ├── assets/
│   │   └── main.css              # 全局样式
│   ├── router/
│   │   └── index.js              # 路由配置
│   ├── App.vue                   # 主应用组件
│   └── main.js                   # 应用入口
├── index.html                    # HTML模板
└── README.md                     # 项目说明
```

## 安装和运行

### 前提条件
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 使用说明

### 1. 获取模型URN
您需要从PKPM平台获取有效的模型URN（统一资源名称），格式为：
```
urn:bimbox.object:{bucket_key}/{object_key}
```

### 2. 配置访问令牌
在各个查看器组件中，您需要配置有效的访问令牌：
```javascript
const accessToken = 'your-access-token-here'
```

### 3. 加载模型
1. 导航到对应的查看器页面（2D、3D、文档、3DTiles、倾斜摄影、点云或TIF影像查看器）
2. 在输入框中输入模型URN或使用默认示例
3. 点击"加载模型"按钮
4. 对于高级查看器，可以使用参数控制面板调节模型显示效果

## 技术栈

- **Vue.js 3** - 前端框架
- **Vue Router** - 路由管理
- **PKPM OBV** - BIM模型查看器
- **CSS3** - 样式和动画
- **THREE.js** - 3D图形库
- **Cesium** - 3D地球和地图引擎
- **响应式设计** - 移动端适配

## 组件说明

### OBV2DView.vue
- 专门用于查看二维图纸和模型
- 支持DWG等2D格式
- 提供缩放、平移等交互功能

### OBV3DView.vue  
- 用于三维模型展示和交互
- 支持RVT等3D格式
- 提供旋转、缩放、漫游等3D操作

### OBVDocView.vue
- 综合文档查看器
- 支持多种文档格式（PDF、Word等）
- 提供完整的文档管理功能

### OBV3DTilesView.vue
- Cesium 3DTiles模型加载器
- 支持大规模三维模型展示
- 提供模型选择和属性查询功能
- 支持位置重置和模型显隐控制

### OBVOsgbzipView.vue
- 倾斜摄影模型查看器
- 支持OSGB格式倾斜摄影数据
- GIS地图集成和高度调节
- BIM模型合模功能
- 蓝紫色科技感主题

### OBVPntsTilesetView.vue
- 点云模型查看器
- 支持LAS格式点云数据
- 实时参数调节（高度、透明度、点大小）
- 点云模型显隐控制
- 粉紫色科技感主题

### OBVTifzipView.vue
- TIF影像查看器
- 支持TIF格式影像数据
- GIS地图集成和高度调节
- BIM模型合模功能
- 青绿色科技感主题

## 自定义配置

### 修改服务端地址
在组件中修改 `serviceConfig`：
```javascript
serviceConfig: {
  origin: 'https://api.cloud.pkpm.cn',  // 您的服务端地址
  apiContextPath: '/bimserver/viewing/v3',
}
```

### 修改国际化语言
在 `index.html` 中修改locale引用：
```html
<link href="/libs/bimviewer/viewer/v5/locale/locale.properties" rel="resource" type="application/l10n">
```

## 注意事项

- 确保libs目录已正确复制到public文件夹
- 需要有效的网络连接和访问令牌
- 不同模型格式可能需要不同的加载参数
- 建议在生产环境中启用HTTPS

## 故障排除

### 模型加载失败
1. 检查网络连接
2. 验证URN格式是否正确
3. 确认访问令牌有效
4. 查看浏览器控制台错误信息

### 库加载问题
1. 确认public/libs目录存在
2. 检查index.html中的资源路径
3. 验证所有必需文件已下载

## 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

Copyright © 2025 [Sogrey](https://github.com/Sogrey)