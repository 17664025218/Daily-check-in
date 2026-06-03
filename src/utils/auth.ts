import Taro from '@tarojs/taro'

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export interface UserInfo {
  id: number
  openid: string
  nickname: string
  avatar_url: string | null
}

/**
 * 检查是否已登录
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await Taro.getStorage({ key: TOKEN_KEY }).then(res => res.data).catch(() => null)
    return !!token
  } catch {
    return false
  }
}

/**
 * 获取 Token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await Taro.getStorage({ key: TOKEN_KEY }).then(res => res.data).catch(() => null)
  } catch {
    return null
  }
}

/**
 * 设置 Token
 */
export const setToken = async (token: string): Promise<void> => {
  await Taro.setStorage({ key: TOKEN_KEY, data: token })
}

/**
 * 获取用户信息
 */
export const getUserInfo = async (): Promise<UserInfo | null> => {
  try {
    return await Taro.getStorage({ key: USER_INFO_KEY }).then(res => res.data).catch(() => null)
  } catch {
    return null
  }
}

/**
 * 设置用户信息
 */
export const setUserInfo = async (info: UserInfo): Promise<void> => {
  await Taro.setStorage({ key: USER_INFO_KEY, data: info })
}

/**
 * 清除登录状态
 */
export const clearAuth = async (): Promise<void> => {
  await Taro.removeStorage({ key: TOKEN_KEY })
  await Taro.removeStorage({ key: USER_INFO_KEY })
}

/**
 * 检查登录状态，未登录则跳转到登录页
 */
export const checkLoginOrRedirect = async (): Promise<boolean> => {
  const loggedIn = await isLoggedIn()
  if (!loggedIn) {
    Taro.redirectTo({ url: '/pages/login/index' })
    return false
  }
  return true
}
