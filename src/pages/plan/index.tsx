import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Star, Clock, CircleAlert } from 'lucide-react-taro'
import { checkLoginOrRedirect } from '@/utils/auth'
import type { Task } from '../index/index'

interface QuadrantTasks {
  importantUrgent: Task[]      // 重要且紧急
  importantNotUrgent: Task[]  // 重要不紧急
  notImportantUrgent: Task[]  // 不重要但紧急
  notImportantNotUrgent: Task[] // 不重要不紧急
}

export default function PlanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await Network.request({
        url: '/api/tasks',
        method: 'GET',
      })
      console.log('获取任务列表:', res.data)
      const taskList = res.data.data || []
      setTasks(taskList)
    } catch (error) {
      console.error('获取任务失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    // 检查登录状态
    if (!checkLoginOrRedirect()) {
      return;
    }
    fetchTasks()
  })

  // 按四象限分类任务
  const categorizeTasks = (taskList: Task[]): QuadrantTasks => {
    return {
      importantUrgent: taskList.filter(t => t.is_important && t.is_urgent),
      importantNotUrgent: taskList.filter(t => t.is_important && !t.is_urgent),
      notImportantUrgent: taskList.filter(t => !t.is_important && t.is_urgent),
      notImportantNotUrgent: taskList.filter(t => !t.is_important && !t.is_urgent),
    }
  }

  const quadrants = categorizeTasks(tasks)

  const renderQuadrant = (
    title: string,
    taskList: Task[],
    bgColor: string,
    borderColor: string,
    icon: React.ReactNode,
    suggestion: string
  ) => (
    <Card className={`mb-3 border-l-4 ${borderColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          {icon}
          <Text className="block ml-2">{title}</Text>
          <Badge variant="secondary" className="ml-auto">{taskList.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {taskList.length > 0 ? (
          <View className="space-y-2">
            {taskList.map(task => (
              <View key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <View className="flex items-center flex-1">
                  {task.auto_check && (
                    <Zap size={14} color="#f59e0b" className="mr-2" />
                  )}
                  <Text className="block text-sm">{task.title}</Text>
                </View>
                {task.auto_check && (
                  <Badge variant="outline" className="text-xs">自动</Badge>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="py-4 text-center">
            <Text className="block text-xs text-gray-400">暂无任务</Text>
          </View>
        )}
        <View className={`mt-2 p-2 rounded-lg ${bgColor}`}>
          <Text className="block text-xs text-gray-600">{suggestion}</Text>
        </View>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="block text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="p-4 pb-20">
      {/* 标题 */}
      <View className="mb-4">
        <Text className="block text-xl font-bold text-gray-800">任务规划</Text>
        <Text className="block text-sm text-gray-500 mt-1">按重要紧急程度划分任务优先级</Text>
      </View>

      {/* 统计卡片 */}
      <Card className="mb-4 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="py-4">
          <View className="flex justify-around">
            <View className="text-center">
              <Text className="block text-2xl font-bold text-emerald-600">{tasks.length}</Text>
              <Text className="block text-xs text-gray-500">总任务</Text>
            </View>
            <View className="text-center">
              <Text className="block text-2xl font-bold text-red-500">{quadrants.importantUrgent.length}</Text>
              <Text className="block text-xs text-gray-500">紧急重要</Text>
            </View>
            <View className="text-center">
              <Text className="block text-2xl font-bold text-blue-500">{quadrants.importantNotUrgent.length}</Text>
              <Text className="block text-xs text-gray-500">重要不急</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 四象限 */}
      {renderQuadrant(
        '重要且紧急',
        quadrants.importantUrgent,
        'bg-red-50',
        'border-red-500',
        <CircleAlert size={18} color="#ef4444" />,
        '立即执行！这些是最优先的任务'
      )}

      {renderQuadrant(
        '重要不紧急',
        quadrants.importantNotUrgent,
        'bg-blue-50',
        'border-blue-500',
        <Star size={18} color="#3b82f6" />,
        '制定计划，安排时间完成'
      )}

      {renderQuadrant(
        '紧急不重要',
        quadrants.notImportantUrgent,
        'bg-yellow-50',
        'border-yellow-500',
        <Clock size={18} color="#f59e0b" />,
        '委托他人或快速处理'
      )}

      {renderQuadrant(
        '不重要不紧急',
        quadrants.notImportantNotUrgent,
        'bg-gray-50',
        'border-gray-400',
        <View className="w-[18px] h-[18px] rounded-full border-2 border-gray-400" />,
        '考虑是否真的需要做'
      )}

      {/* 添加任务按钮 */}
      <View className="fixed bottom-16 left-0 right-0 px-4">
        <Button
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
        >
          <Text className="text-white">去添加任务</Text>
        </Button>
      </View>
    </View>
  )
}
