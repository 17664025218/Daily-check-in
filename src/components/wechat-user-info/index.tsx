import { useState, useCallback } from 'react'
import { View, Text, Button, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Camera } from 'lucide-react-taro'

interface WechatUserInfoProps {
  avatarUrl?: string
  nickname?: string
  onAvatarChange?: (url: string) => void
  onNicknameChange?: (name: string) => void
  onSave?: (data: { avatarUrl: string; nickname: string }) => void
}

export function WechatUserInfo({
  avatarUrl,
  nickname,
  onAvatarChange,
  onNicknameChange,
  onSave,
}: WechatUserInfoProps) {
  const [tempAvatar, setTempAvatar] = useState(avatarUrl || '')
  const [tempNickname, setTempNickname] = useState(nickname || '')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 检测是否为小程序环境
  const env = Taro.getEnv()
  const isMiniApp = env === Taro.ENV_TYPE.WEAPP || env === Taro.ENV_TYPE.TT

  // 处理头像选择
  const handleChooseAvatar = useCallback(async (e: any) => {
    const { avatarUrl: localPath } = e.detail
    if (!localPath) return

    console.log('[WechatUserInfo] 选择头像:', localPath)
    setTempAvatar(localPath)
    setIsUploading(true)

    try {
      // 上传头像到服务器
      const uploadRes = await Network.uploadFile({
        url: '/api/upload/avatar',
        filePath: localPath,
        name: 'file',
      })

      console.log('[WechatUserInfo] 上传响应:', uploadRes)

      if (uploadRes.statusCode === 200 && uploadRes.data) {
        const data = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
        if (data.code === 200 && data.data?.url) {
          const remoteUrl = data.data.url
          console.log('[WechatUserInfo] 上传成功:', remoteUrl)
          setTempAvatar(remoteUrl)
          onAvatarChange?.(remoteUrl)
          Taro.showToast({ title: '头像上传成功', icon: 'success' })
        } else {
          throw new Error(data.msg || '上传失败')
        }
      } else {
        throw new Error('上传失败')
      }
    } catch (err: any) {
      console.error('[WechatUserInfo] 上传失败:', err)
      Taro.showToast({ title: err.message || '上传失败', icon: 'none' })
      // 上传失败，使用本地临时路径
      setTempAvatar(localPath)
      onAvatarChange?.(localPath)
    } finally {
      setIsUploading(false)
    }
  }, [onAvatarChange])

  // 处理昵称输入
  const handleNicknameInput = useCallback((e: any) => {
    const value = e.detail.value
    setTempNickname(value)
    onNicknameChange?.(value)
  }, [onNicknameChange])

  // 保存用户信息
  const handleSave = useCallback(async () => {
    if (!tempNickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    setIsSaving(true)
    try {
      const result = await Network.request({
        url: '/api/auth/update-profile',
        method: 'POST',
        data: {
          nickname: tempNickname,
          avatar_url: tempAvatar,
        },
      })

      console.log('[WechatUserInfo] 保存结果:', result)

      if (result.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        onSave?.({ avatarUrl: tempAvatar, nickname: tempNickname })
      } else {
        throw new Error(result.data?.msg || '保存失败')
      }
    } catch (err: any) {
      console.error('[WechatUserInfo] 保存失败:', err)
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setIsSaving(false)
    }
  }, [tempAvatar, tempNickname, onSave])

  return (
    <View className="flex flex-col items-center gap-4">
      {/* 头像选择 */}
      <View className="relative">
        {tempAvatar ? (
          <Image
            src={tempAvatar}
            className="w-20 h-20 rounded-full"
            mode="aspectFill"
          />
        ) : (
          <View className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <Camera size={32} color="#10b981" />
          </View>
        )}

        {isMiniApp ? (
          <Button
            open-type="chooseAvatar"
            onChooseAvatar={handleChooseAvatar}
            className="absolute inset-0 opacity-0"
          >
            选择头像
          </Button>
        ) : (
          <View
            className="absolute inset-0"
            onClick={() => {
              // H5 降级：使用 chooseImage
              Taro.chooseImage({
                count: 1,
                sizeType: ['compressed'],
                sourceType: ['album', 'camera'],
                success: (res) => {
                  const tempFilePath = res.tempFilePaths[0]
                  handleChooseAvatar({ detail: { avatarUrl: tempFilePath } })
                },
              })
            }}
          />
        )}

        {isUploading && (
          <View className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Text className="text-white text-xs">上传中...</Text>
          </View>
        )}
      </View>

      <Text className="text-xs text-emerald-500">点击更换头像</Text>

      {/* 昵称输入 */}
      <View className="w-full max-w-xs">
        {isMiniApp ? (
          <View className="bg-gray-100 rounded-xl px-4 py-3">
            <Input
              type="nickname"
              placeholder="点击获取微信昵称"
              placeholder-style="color: rgba(0,0,0,0.4);"
              value={tempNickname}
              onInput={handleNicknameInput}
              className="w-full text-center text-base text-gray-800"
            />
          </View>
        ) : (
          <View className="bg-gray-100 rounded-xl px-4 py-3">
            <Input
              placeholder="请输入昵称"
              placeholder-style="color: rgba(0,0,0,0.4);"
              value={tempNickname}
              onInput={handleNicknameInput}
              className="w-full text-center text-base text-gray-800"
            />
          </View>
        )}
      </View>

      {/* 保存按钮 */}
      <View
        className={`w-full max-w-xs py-3 rounded-xl flex items-center justify-center ${
          isSaving ? 'bg-emerald-300' : 'bg-emerald-500'
        }`}
        onClick={isSaving ? undefined : handleSave}
      >
        <Text className="font-medium text-white">
          {isSaving ? '保存中...' : '保存信息'}
        </Text>
      </View>
    </View>
  )
}
