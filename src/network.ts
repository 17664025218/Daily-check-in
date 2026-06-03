import Taro from '@tarojs/taro'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 */
export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN}${url}`
    }

    // 获取存储的 token
    const getToken = async (): Promise<string | null> => {
        try {
            return await Taro.getStorage({ key: 'token' }).then(res => res.data).catch(() => null)
        } catch {
            return null
        }
    }

    // 通用响应类型
    interface ApiResponse<T = any> {
        code: number
        msg: string
        data: T
    }

    // 请求结果类型
    interface RequestResult<T = any> {
        statusCode: number
        header: Record<string, any>
        data: ApiResponse<T>
    }

    export const request = async <T = any>(option: Taro.request.Option): Promise<RequestResult<T>> => {
        const token = await getToken()
        const headers = { ...(option.header || {}) } as Record<string, any>
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        const result = await Taro.request({
            ...option,
            url: createUrl(option.url),
            header: headers,
        })
        return result as RequestResult<T>
    }

    export const uploadFile = async (option: Taro.uploadFile.Option): Promise<Taro.uploadFile.SuccessCallbackResult> => {
        const token = await getToken()
        const headers = { ...(option.header || {}) } as Record<string, any>
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
            header: headers,
        })
    }

    export const downloadFile = async (option: Taro.downloadFile.Option): Promise<Taro.downloadFile.FileSuccessCallbackResult> => {
        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
        })
    }
}
