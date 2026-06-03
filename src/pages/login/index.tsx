import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Network } from '@/network'
import { User, LogIn } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { WechatUserInfo } from '@/components/wechat-user-info'

// 登录步骤
type LoginStep = 'initial' | 'fillProfile' | 'loading'

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('initial')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    id: number
    openid: string
    token: string
    nickname: string
    avatarUrl: string
  } | null>(null)

  useDidShow(() => {
    // 检查是否已登录
    checkLoginStatus()
  })

  const checkLoginStatus = async () => {
    const token = Taro.getStorageSync('token')
    if (token) {
      // 已登录，跳转首页
      Taro.switchTab({ url: '/pages/index/index' })
    }
  }

  // 微信小程序登录（静默登录）
  const handleWeappLogin = async () => {
    setLoading(true)
    setStep('loading')
    try {
      // 1. 调用 Taro.login() 获取微信登录凭证 code
      const loginResult = await Taro.login()
      console.log('微信登录 code:', loginResult.code)
      
      if (!loginResult.code) {
        throw new Error('获取登录凭证失败')
      }
      
      // 2. 将 code 发送到后端换取 openid 和 token
      const res = await Network.request({
        url: '/api/auth/login/wechat',
        method: 'POST',
        data: { code: loginResult.code }
      })
      
      console.log('登录响应:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        const { token, user } = res.data.data
        
        // 3. 保存 token 到 storage，以便后续请求自动携带
        Taro.setStorageSync('token', token)
        
        // 4. 检查是否已有头像和昵称
        if (user.avatar_url && user.nickname) {
          // 已有完整信息，直接保存并跳转
          Taro.setStorageSync('userId', user.id)
          Taro.setStorageSync('userInfo', {
            id: user.id,
            openid: user.openid,
            nickname: user.nickname,
            avatar_url: user.avatar_url
          })
          
          Taro.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/index/index' })
          }, 1000)
        } else {
          // 没有完整信息，进入填写页面
          setUserInfo({
            id: user.id,
            openid: user.openid,
            token: token,
            nickname: user.nickname || '',
            avatarUrl: user.avatar_url || ''
          })
          setStep('fillProfile')
        }
      } else {
        throw new Error(res.data?.msg || '登录失败')
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      setStep('initial')
      Taro.showToast({ 
        title: error.message || '登录失败', 
        icon: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  // H5 开发环境登录
  const handleH5Login = async () => {
    setLoading(true)
    setStep('loading')
    try {
      const mockCode = 'h5_' + Date.now()
      
      const res = await Network.request({
        url: '/api/auth/login/wechat',
        method: 'POST',
        data: { code: mockCode }
      })
      
      if (res.data?.code === 200 && res.data?.data) {
        const { token, user } = res.data.data
        
        // 保存 token 到 storage
        Taro.setStorageSync('token', token)
        
        setUserInfo({
          id: user.id,
          openid: user.openid,
          token: token,
          nickname: user.nickname || '',
          avatarUrl: user.avatar_url || ''
        })
        
        // H5 环境也进入填写页面
        setStep('fillProfile')
      }
    } catch (error: any) {
      setStep('initial')
      Taro.showToast({ 
        title: error.message || '登录失败', 
        icon: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  // 头像变化回调
  const handleAvatarChange = (url: string) => {
    if (userInfo) {
      setUserInfo({ ...userInfo, avatarUrl: url })
    }
  }

  // 昵称变化回调
  const handleNicknameChange = (name: string) => {
    if (userInfo) {
      setUserInfo({ ...userInfo, nickname: name })
    }
  }

  // 保存用户信息成功回调
  const handleSaveSuccess = (data: { avatarUrl: string; nickname: string }) => {
    if (!userInfo) return
    
    // 更新本地存储的用户信息
    Taro.setStorageSync('userId', userInfo.id)
    Taro.setStorageSync('userInfo', {
      id: userInfo.id,
      openid: userInfo.openid,
      nickname: data.nickname,
      avatar_url: data.avatarUrl
    })
    
    Taro.showToast({ title: '登录成功', icon: 'success' })
    
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/index/index' })
    }, 1000)
  }

  // 跳过设置
  const handleSkip = () => {
    if (!userInfo) return
    
    // 生成随机昵称
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const defaultNickname = '用户' + randomSuffix
    
    Taro.setStorageSync('userId', userInfo.id)
    Taro.setStorageSync('userInfo', {
      id: userInfo.id,
      openid: userInfo.openid,
      nickname: userInfo.nickname || defaultNickname,
      avatar_url: userInfo.avatarUrl
    })
    
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const env = Taro.getEnv()
  const isWeapp = env === Taro.ENV_TYPE.WEAPP || env === Taro.ENV_TYPE.TT
  const isH5 = env === Taro.ENV_TYPE.WEB

  // 填写头像昵称页面
  if (step === 'fillProfile') {
    return (
      <View className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center p-8">
        <Text className="block text-xl font-bold text-gray-800 mt-16 mb-2">完善个人信息</Text>
        <Text className="block text-gray-500 mb-8">设置您的头像和昵称</Text>
        
        {/* 使用 WechatUserInfo 组件 */}
        <WechatUserInfo
          avatarUrl={userInfo?.avatarUrl}
          nickname={userInfo?.nickname}
          onAvatarChange={handleAvatarChange}
          onNicknameChange={handleNicknameChange}
          onSave={handleSaveSuccess}
        />
        
        {/* 跳过按钮 */}
        <View className="w-full max-w-xs mt-4">
          <Button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            onClick={handleSkip}
          >
            稍后设置
          </Button>
        </View>
      </View>
    )
  }

  // 初始登录页面
  return (
    <View className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <View className="mb-12">
        <View className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
          <User size={40} color="#fff" />
        </View>
      </View>
      
      {/* 标题 */}
      <Text className="block text-2xl font-bold text-gray-800 mb-2">每日打卡</Text>
      <Text className="block text-gray-500 mb-12">养成好习惯，从每天开始</Text>
      
      {/* 登录按钮 */}
      {isWeapp ? (
        <View className="w-full max-w-xs">
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleWeappLogin}
            disabled={loading}
          >
            <LogIn size={18} className="mr-2" color="#fff" />
            {loading ? '登录中...' : '微信一键登录'}
          </Button>
          <Text className="block text-center text-gray-400 text-sm mt-4">
            登录后可同步您的打卡数据
          </Text>
        </View>
      ) : isH5 ? (
        <View className="w-full max-w-xs">
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleH5Login}
            disabled={loading}
          >
            <LogIn size={18} className="mr-2" color="#fff" />
            {loading ? '登录中...' : '开发登录'}
          </Button>
          <Text className="block text-center text-gray-400 text-sm mt-4">
            H5 开发环境使用模拟登录
          </Text>
        </View>
      ) : (
        <View className="w-full max-w-xs">
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleH5Login}
            disabled={loading}
          >
            <LogIn size={18} className="mr-2" color="#fff" />
            {loading ? '登录中...' : '立即登录'}
          </Button>
        </View>
      )}
      
      {/* 协议 */}
      <View className="mt-auto pt-8">
        <Text className="block text-center text-gray-400 text-xs">
          登录即表示同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  )
}
