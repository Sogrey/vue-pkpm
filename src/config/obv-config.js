/**
 * OBV配置文件
 * 统一管理OBV相关的配置项
 */

// 默认访问令牌配置
const defaultAuthConfig = {
    // 默认访问令牌（用于初始演示）
    accessToken: 'eyJhbGciOiJSUzI1NiJ9.eyJzY29wZSI6WyJvYnY6cmVhZCJdLCJleHAiOjE3NjY3MTE1ODgsImNsaWVudF9pZCI6ImFlY3dvcmtzLW9idi1jb21tdW5pdHkiLCJqdGkiOiJiMzUxYTczZi1jNzAxLTRiNmYtYmUzOS1jMjkwZGM2Y2E5ZmIifQ.ExCVujhM29SIooY5RD-AKWKEcZm0E3KBZZ0xHRZlQj4_vwrGIWLywsD9Nw9IQF7ao1c0zKPy7G81lGyMW1EwQ1KCdAzxnuiKM55sF_tpd_NoO1zdCnWL9ZHo42PmMfPXYy55u28nGCpW8VFM3jMlOctGU3rmiP7yfWPPt2rs8X78ZuuKXJjKjDzNj35vpMbZZJWXkPJ8Nab5gu6pgR-LBvbgZVihojRCOOoNuqjU_NXf_eyRZc6S8rDPVj34PZEMEv6T0LM68xAtRaJkO54PBr7KljCP96NBwkoLCWYhMzf77bk1j_Q-OagwwadtIzSAwum-2TBMexGz1RbO0oCN0A',
    // 令牌有效期（毫秒）
    expiresIn: 600000
}

// 动态访问令牌配置
let currentAuthConfig = { ...defaultAuthConfig }

// 访问令牌管理类
export class TokenManager {
    // 从本地存储加载配置
    static loadFromStorage() {
        try {
            const stored = localStorage.getItem('obv_token_config')
            if (stored) {
                const config = JSON.parse(stored)
                // 检查令牌是否过期
                if (config.timestamp && config.accessToken) {
                    const parts = config.accessToken.split('.')
                    if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]))
                        const now = Math.floor(Date.now() / 1000)
                        
                        if (payload.exp && payload.exp > now) {
                            // 令牌未过期，使用存储的配置
                            currentAuthConfig = {
                                accessToken: config.accessToken,
                                expiresIn: config.expiresIn || 600000
                            }
                            console.log('使用存储的有效令牌')
                            return true
                        } else {
                            // 令牌已过期，清除存储
                            localStorage.removeItem('obv_token_config')
                            console.log('存储的令牌已过期，使用默认令牌')
                        }
                    } else {
                        // 令牌格式无效，使用默认令牌
                        console.log('存储的令牌格式无效，使用默认令牌')
                    }
                }
            }
        } catch (error) {
            console.error('加载本地令牌配置失败:', error)
            localStorage.removeItem('obv_token_config')
        }
        return false
    }

    // 更新令牌配置
    static updateConfig(config) {
        if (config && config.accessToken) {
            currentAuthConfig = {
                accessToken: config.accessToken,
                expiresIn: config.expiresIn || 600000
            }
            console.log('令牌配置已更新')
        }
    }

    // 获取当前配置
    static getConfig() {
        return currentAuthConfig
    }

    // 获取访问令牌
    static getAccessToken() {
        return currentAuthConfig.accessToken
    }

    // 获取令牌有效期
    static getExpiresIn() {
        return currentAuthConfig.expiresIn
    }

    // 检查令牌是否过期
    static isTokenExpired() {
        try {
            const token = currentAuthConfig.accessToken
            if (!token) return true
            
            const parts = token.split('.')
            if (parts.length !== 3) return true
            
            const payload = JSON.parse(atob(parts[1]))
            const now = Math.floor(Date.now() / 1000)
            
            return payload.exp && payload.exp <= now
        } catch (error) {
            console.error('检查令牌过期状态失败:', error)
            return true
        }
    }

    // 获取令牌剩余有效时间（毫秒）
    static getTokenRemainingTime() {
        try {
            const token = currentAuthConfig.accessToken
            if (!token) return 0
            
            const parts = token.split('.')
            if (parts.length !== 3) return 0
            
            const payload = JSON.parse(atob(parts[1]))
            const now = Math.floor(Date.now() / 1000)
            
            if (payload.exp && payload.exp > now) {
                return (payload.exp - now) * 1000
            }
            return 0
        } catch (error) {
            console.error('获取令牌剩余时间失败:', error)
            return 0
        }
    }

    // 重置为默认配置
    static reset() {
        currentAuthConfig = { ...defaultAuthConfig }
        localStorage.removeItem('obv_token_config')
        console.log('令牌配置已重置为默认值')
    }
}

// 初始化时加载本地存储配置
TokenManager.loadFromStorage()

// 导出当前访问令牌配置
export const authConfig = {
    get accessToken() {
        return TokenManager.getAccessToken()
    },
    get expiresIn() {
        return TokenManager.getExpiresIn()
    },
    // 获取令牌的回调函数
    getAccessToken: (cb) => {
        const token = TokenManager.getAccessToken()
        const expiresIn = TokenManager.getExpiresIn()
        
        // 检查令牌是否过期
        if (TokenManager.isTokenExpired()) {
            console.warn('访问令牌已过期，请重新配置')
            cb('', 0)
        } else {
            cb(token, expiresIn)
        }
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