/**
 * OBV配置文件
 * 统一管理OBV相关的配置项
 */

// 访问令牌配置
export const authConfig = {
  // 生产环境访问令牌
  accessToken: 'eyJhbGciOiJSUzI1NiJ9.eyJzY29wZSI6WyJvYnY6cmVhZCJdLCJleHAiOjE3NjY2NDEwNjEsImNsaWVudF9pZCI6ImFlY3dvcmtzLW9idi1jb21tdW5pdHkiLCJqdGkiOiIzNzhmM2Q4MS0yMGI4LTRjZWQtYWFhMi01OThmNjg1MDJhMDAifQ.Hkdyz_ZNqjzjjhc9hfOmXdervJqCNlsCGgotjTgu--9oSyU1TivYY-RysMOmlLcO4O7L2iTxwSyPaM02HRMvafCfemfg4VNY9JUdgW0M_1HdCPlOy67wTFT7aDBeAaWTKQ0VCDonEvKZ8uB1hMq19SsxniCTwDnqOq_ICxq5EmMGRaXemu5pDBre0KnkDBAt17pU_m1gH-QI3BNnl4aEuuiXdDL5jjv5oJdFYdgQ5JfOtAjg5yaqvOyypqo2jgPXwgv3XEpgrHdV3kKUG1Jv3nXyGmZjtHylYlpXE8tg3BOdZjqGlOt91yRnElfLhGQMkrtZwGumMUNJ-u3y9C28Rw',
  // 令牌有效期（毫秒）
  expiresIn: 600000,
  // 获取令牌的回调函数
  getAccessToken: (cb) => {
    cb(authConfig.accessToken, authConfig.expiresIn)
  }
}

// 服务端配置
export const serviceConfig = {
  origin: 'https://api.cloud.pkpm.cn',
  apiContextPath: '/bimserver/viewing/v3'
}

// 默认URN配置
export const defaultUrns = {
  // 2D图纸URN
  '2d': 'urn:bimbox.object:viewing_bucket/drawComparison_A',
  // 3D模型URN
  '3d': 'urn:bimbox.object:viewing_bucket/rvt-model',
  // 文档模型URN
  'doc': 'urn:bimbox.object:viewing_bucket/pdf-demo',
  // 3DTiles模型URN
  '3dtiles': 'urn:bimbox.object:viewing_bucket/3dtiles-model',
  // 倾斜摄影模型URN
  'osgbzip': 'urn:bimbox.object:viewing_bucket/osgb-model',
  // 点云模型URN
  'pnts-tileset': 'urn:bimbox.object:viewing_bucket/las-model',
  // TIF影像URN
  'tifzip': 'urn:bimbox.object:viewing_bucket/多级数据测试_tifzip',
  // BIM合模用URN
  'bim-merge': 'urn:bimbox.object:viewing_bucket/rvt-model',
  'bim-house': 'urn:bimbox.object:viewing_bucket/rvt-house',
  'bim-weilv': 'urn:bimbox.object:OBVCmnt_bucket/wei_lv_da_sha'
}

// 应用程序基础配置
export const getApplicationOptions = () => ({
  getAccessToken: authConfig.getAccessToken,
  refreshAccessToken: authConfig.getAccessToken,
  serviceConfig: serviceConfig
})

// 模型类型配置
export const modelTypes = {
  '2d': 'dwg-lod',
  '3d': 'rvt-lod',
  'doc': '',
  '3dtiles': '3dtiles-lod',
  'osgbzip': 'osgbzip-lod',
  'pnts-tileset': 'las-lod',
  'tifzip': 'tifzip-lod'
}

// 错误类型定义
export const ErrorTypes = {
  NETWORK: 'network',
  TOKEN: 'token',
  FORMAT: 'format',
  FILE: 'file',
  UNKNOWN: 'unknown'
}