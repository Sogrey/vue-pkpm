/**
 * OBV配置文件
 * 统一管理OBV相关的配置项
 */

// 访问令牌配置
export const authConfig = {
    // 生产环境访问令牌
    accessToken: 'eyJhbGciOiJSUzI1NiJ9.eyJzY29wZSI6WyJvYnY6cmVhZCJdLCJleHAiOjE3NjY3MTE1ODgsImNsaWVudF9pZCI6ImFlY3dvcmtzLW9idi1jb21tdW5pdHkiLCJqdGkiOiJiMzUxYTczZi1jNzAxLTRiNmYtYmUzOS1jMjkwZGM2Y2E5ZmIifQ.ExCVujhM29SIooY5RD-AKWKEcZm0E3KBZZ0xHRZlQj4_vwrGIWLywsD9Nw9IQF7ao1c0zKPy7G81lGyMW1EwQ1KCdAzxnuiKM55sF_tpd_NoO1zdCnWL9ZHo42PmMfPXYy55u28nGCpW8VFM3jMlOctGU3rmiP7yfWPPt2rs8X78ZuuKXJjKjDzNj35vpMbZZJWXkPJ8Nab5gu6pgR-LBvbgZVihojRCOOoNuqjU_NXf_eyRZc6S8rDPVj34PZEMEv6T0LM68xAtRaJkO54PBr7KljCP96NBwkoLCWYhMzf77bk1j_Q-OagwwadtIzSAwum-2TBMexGz1RbO0oCN0A',
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
    '3dtiles-pmodel': 'urn:bimbox.object:viewing_bucket/pmodel-lod',
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

// 默认BIMS ID配置
export const defaultBimsIds = {
    'default': '65e57e34993dc7fac12fce59'
}

// 错误类型定义
export const ErrorTypes = {
    NETWORK: 'network',
    TOKEN: 'token',
    FORMAT: 'format',
    FILE: 'file',
    UNKNOWN: 'unknown'
}