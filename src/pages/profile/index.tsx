import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { User, Award, Clock, Calendar, MessageCircle, Settings, ChevronRight, ChevronDown, ChevronUp, Bell, Trophy, Flame } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Network } from '@/network'
import { WechatUserInfo } from '@/components/wechat-user-info'

interface UserStats {
  consecutiveDays: number
  totalCheckDays: number
  totalTasks: number
  joinDays: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

// 勋章配置
const ACHIEVEMENTS: Achievement[] = [
  { id: 'starter', name: '新手起步', description: '完成第一次打卡', icon: '🌱', unlocked: false },
  { id: 'week', name: '7天坚持', description: '连续打卡7天', icon: '🔥', unlocked: false },
  { id: 'month', name: '30天自律', description: '连续打卡30天', icon: '⭐', unlocked: false },
  { id: 'quarter', name: '季度达人', description: '连续打卡90天', icon: '🏆', unlocked: false },
  { id: 'year', name: '年度之星', description: '连续打卡365天', icon: '👑', unlocked: false },
]

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState({
    nickname: '用户',
    avatar_url: '',
  })
  const [stats, setStats] = useState<UserStats>({
    consecutiveDays: 0,
    totalCheckDays: 0,
    totalTasks: 0,
    joinDays: 1,
  })
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useDidShow(() => {
    loadData()
  })

  const loadData = async () => {
    try {
      // 获取用户信息
      const savedUserInfo = Taro.getStorageSync('userInfo')
      if (savedUserInfo) {
        setUserInfo({
          nickname: savedUserInfo.nickname || '用户',
          avatar_url: savedUserInfo.avatar_url || '',
        })
      }

      // 获取统计数据
      const res = await Network.request({
        url: '/api/check-records/user-stats',
        method: 'GET',
      })

      console.log('统计数据响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  // 处理头像变化
  const handleAvatarChange = useCallback((url: string) => {
    setUserInfo(prev => ({ ...prev, avatar_url: url }))
    setIsEditing(true)
  }, [])

  // 处理昵称变化
  const handleNicknameChange = useCallback((name: string) => {
    setUserInfo(prev => ({ ...prev, nickname: name }))
    setIsEditing(true)
  }, [])

  // 保存用户信息
  const handleSaveUserInfo = useCallback(async (data: { avatarUrl: string; nickname: string }) => {
    try {
      // 更新本地存储
      const savedUserInfo = Taro.getStorageSync('userInfo')
      Taro.setStorageSync('userInfo', {
        ...savedUserInfo,
        nickname: data.nickname,
        avatar_url: data.avatarUrl,
      })

      setUserInfo({
        nickname: data.nickname,
        avatar_url: data.avatarUrl,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('保存用户信息失败:', error)
    }
  }, [])

  // 根据连续打卡天数解锁勋章
  const getUnlockedAchievements = (): Achievement[] => {
    return ACHIEVEMENTS.map(a => {
      let unlocked = false
      if (a.id === 'starter' && stats.totalCheckDays >= 1) unlocked = true
      if (a.id === 'week' && stats.consecutiveDays >= 7) unlocked = true
      if (a.id === 'month' && stats.consecutiveDays >= 30) unlocked = true
      if (a.id === 'quarter' && stats.consecutiveDays >= 90) unlocked = true
      if (a.id === 'year' && stats.consecutiveDays >= 365) unlocked = true
      return { ...a, unlocked }
    })
  }

  const handleMenuClick = (type: string) => {
    switch (type) {
      case 'reminder':
        Taro.showToast({ title: '打卡提醒功能开发中', icon: 'none' })
        break
      case 'history':
        Taro.switchTab({ url: '/pages/records/index' })
        break
      case 'feedback':
        Taro.showToast({ title: '意见反馈功能开发中', icon: 'none' })
        break
      case 'settings':
        Taro.showActionSheet({
          itemList: ['清除缓存', '关于我们'],
          success: (res) => {
            if (res.tapIndex === 0) {
              Taro.clearStorageSync()
              Taro.showToast({ title: '缓存已清除', icon: 'success' })
              setTimeout(() => {
                Taro.reLaunch({ url: '/pages/login/index' })
              }, 1000)
            } else if (res.tapIndex === 1) {
              Taro.showModal({
                title: '关于我们',
                content: '每日打卡小程序\n版本：1.0.0\n\n帮助用户养成好习惯，从每天开始。',
                showCancel: false,
              })
            }
          },
        })
        break
    }
  }

  const achievements = getUnlockedAchievements()
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 用户信息区 */}
      <View className="bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 pt-12 pb-8">
        <View className="flex items-center">
          {/* 头像 */}
          <View className="relative">
            {userInfo.avatar_url ? (
              <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                <Image 
                  src={userInfo.avatar_url} 
                  className="w-full h-full" 
                  mode="aspectFill" 
                />
              </View>
            ) : (
              <View className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-2 border-white">
                <User size={32} color="#fff" />
              </View>
            )}
          </View>
          {/* 昵称和加入天数 */}
          <View className="ml-4 flex-1">
            <Text className="block text-xl font-bold text-white">{userInfo.nickname}</Text>
            <Text className="block text-emerald-100 text-sm mt-1">
              加入打卡第 {stats.joinDays} 天
            </Text>
          </View>
          {/* 编辑按钮 */}
          <View 
            className="px-3 py-1 bg-emerald-400 rounded-full"
            onClick={() => setIsEditing(true)}
          >
            <Text className="text-white text-sm">编辑</Text>
          </View>
        </View>
      </View>

      {/* 编辑用户信息弹层 */}
      {isEditing && (
        <View 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setIsEditing(false)}
        >
          <View 
            className="bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-2xl p-6 w-4/5 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Text className="block text-lg font-bold text-center mb-4 text-white">编辑个人信息</Text>
            <WechatUserInfo
              avatarUrl={userInfo.avatar_url}
              nickname={userInfo.nickname}
              onAvatarChange={handleAvatarChange}
              onNicknameChange={handleNicknameChange}
              onSave={handleSaveUserInfo}
            />
            <View 
              className="mt-4 text-center"
              onClick={() => setIsEditing(false)}
            >
              <Text className="text-emerald-100">取消</Text>
            </View>
          </View>
        </View>
      )}

      {/* 数据统计看板 */}
      <View className="px-4 -mt-4">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <View className="flex justify-around">
              {/* 连续打卡 */}
              <View className="flex flex-col items-center">
                <View className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-2">
                  <Flame size={24} color="#f97316" />
                </View>
                <Text className="block text-2xl font-bold text-orange-500">{stats.consecutiveDays}</Text>
                <Text className="block text-sm text-gray-500 mt-1">连续打卡</Text>
              </View>
              {/* 累计打卡 */}
              <View className="flex flex-col items-center">
                <View className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-2">
                  <Calendar size={24} color="#10b981" />
                </View>
                <Text className="block text-2xl font-bold text-emerald-500">{stats.totalCheckDays}</Text>
                <Text className="block text-sm text-gray-500 mt-1">累计打卡</Text>
              </View>
              {/* 累计任务 */}
              <View className="flex flex-col items-center">
                <View className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
                  <Trophy size={24} color="#3b82f6" />
                </View>
                <Text className="block text-2xl font-bold text-blue-500">{stats.totalTasks}</Text>
                <Text className="block text-sm text-gray-500 mt-1">累计任务</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 勋章与成就区 */}
      <View className="px-4 mt-4">
        <Collapsible open={achievementsOpen} onOpenChange={setAchievementsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <View className="flex items-center justify-between p-4 cursor-pointer">
                <View className="flex items-center">
                  <Award size={20} color="#10b981" />
                  <Text className="block text-base font-medium text-gray-800 ml-2">勋章与成就</Text>
                  <View className="ml-2 px-2 py-1 rounded-full bg-emerald-100">
                    <Text className="block text-xs text-emerald-600">{unlockedCount}/{achievements.length}</Text>
                  </View>
                </View>
                {achievementsOpen ? (
                  <ChevronUp size={20} color="#9ca3af" />
                ) : (
                  <ChevronDown size={20} color="#9ca3af" />
                )}
              </View>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <View className="px-4 pb-4 border-t border-gray-100">
                <View className="grid grid-cols-3 gap-3 pt-4">
                  {achievements.map((achievement) => (
                    <View
                      key={achievement.id}
                      className={`flex flex-col items-center p-3 rounded-xl ${
                        achievement.unlocked ? 'bg-emerald-50' : 'bg-gray-100'
                      }`}
                    >
                      <Text className="block text-2xl mb-1" style={{ opacity: achievement.unlocked ? 1 : 0.3 }}>
                        {achievement.icon}
                      </Text>
                      <Text className={`block text-xs font-medium ${achievement.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                        {achievement.name}
                      </Text>
                      <Text className={`block text-xs mt-1 text-center ${achievement.unlocked ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {achievement.description}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </View>

      {/* 功能列表区 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="p-0">
            {/* 打卡提醒 */}
            <View
              className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
              onClick={() => handleMenuClick('reminder')}
            >
              <View className="flex items-center">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Bell size={18} color="#3b82f6" />
                </View>
                <Text className="block text-base text-gray-800 ml-3">打卡提醒设置</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </View>

            {/* 我的历史打卡 */}
            <View
              className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
              onClick={() => handleMenuClick('history')}
            >
              <View className="flex items-center">
                <View className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Clock size={18} color="#10b981" />
                </View>
                <Text className="block text-base text-gray-800 ml-3">我的历史打卡</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </View>

            {/* 意见反馈 */}
            <View
              className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
              onClick={() => handleMenuClick('feedback')}
            >
              <View className="flex items-center">
                <View className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <MessageCircle size={18} color="#f97316" />
                </View>
                <Text className="block text-base text-gray-800 ml-3">意见反馈</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </View>

            {/* 系统设置 */}
            <View
              className="flex items-center justify-between p-4 active:bg-gray-50"
              onClick={() => handleMenuClick('settings')}
            >
              <View className="flex items-center">
                <View className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Settings size={18} color="#6b7280" />
                </View>
                <Text className="block text-base text-gray-800 ml-3">系统设置</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 退出登录按钮 */}
      <View className="px-4 mt-6">
        <Button
          variant="outline"
          className="w-full py-3"
          onClick={() => {
            Taro.showModal({
              title: '提示',
              content: '确定要退出登录吗？',
              success: (res) => {
                if (res.confirm) {
                  Taro.clearStorageSync()
                  Taro.reLaunch({ url: '/pages/login/index' })
                }
              },
            })
          }}
        >
          <Text className="text-gray-600">退出登录</Text>
        </Button>
      </View>
    </View>
  )
}
