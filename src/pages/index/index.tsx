import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { Network } from '@/network';
import { checkLoginOrRedirect } from '@/utils/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Plus, Check, Circle, Trash2, Zap, Star, Clock, CircleAlert } from 'lucide-react-taro';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  auto_check: boolean;
  auto_check_until: string | null; // 持续打卡结束日期
  is_important: boolean;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
  checked?: boolean;
}

interface CheckRecord {
  id: number;
  task_id: number;
  check_date: string;
  note: string | null;
  created_at: string;
}

const IndexPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAutoCheck, setNewTaskAutoCheck] = useState(false);
  const [newTaskImportant, setNewTaskImportant] = useState(false);
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  // 加载任务列表和今日打卡状态
  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksRes = await Network.request({
        url: '/api/tasks',
        method: 'GET',
      });
      console.log('Tasks response:', tasksRes.data);

      const taskList = tasksRes.data?.data || [];
      setTasks(taskList);

      const recordsRes = await Network.request({
        url: '/api/check-records/today',
        method: 'GET',
      });
      console.log('Today records response:', recordsRes.data);

      const todayRecords: CheckRecord[] = recordsRes.data?.data || [];
      const checkedTaskIds = new Set(todayRecords.map((r) => r.task_id));
      setCheckedTasks(checkedTaskIds);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    // 检查登录状态
    if (!checkLoginOrRedirect()) {
      return;
    }
    loadTasks();
  });

  // 打卡
  const handleCheck = async (taskId: number) => {
    try {
      const res = await Network.request({
        url: '/api/check-records',
        method: 'POST',
        data: {
          task_id: taskId,
          check_date: today,
        },
      });
      console.log('Check response:', res.data);

      if (res.data?.code === 200) {
        setCheckedTasks((prev) => new Set([...prev, taskId]));
        Taro.showToast({
          title: '打卡成功！',
          icon: 'success',
        });
      }
    } catch (error) {
      console.error('打卡失败:', error);
      Taro.showToast({
        title: '打卡失败',
        icon: 'error',
      });
    }
  };

  // 取消打卡
  const handleUncheck = async (taskId: number) => {
    try {
      const res = await Network.request({
        url: `/api/check-records/${taskId}/${today}`,
        method: 'DELETE',
      });
      console.log('Uncheck response:', res.data);

      if (res.data?.code === 200) {
        setCheckedTasks((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        Taro.showToast({
          title: '已取消打卡',
          icon: 'success',
        });
      }
    } catch (error) {
      console.error('取消打卡失败:', error);
      Taro.showToast({
        title: '取消失败',
        icon: 'error',
      });
    }
  };

  // 切换自动打卡
  const handleToggleAutoCheck = async (taskId: number, currentValue: boolean) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await Network.request({
        url: `/api/tasks/${taskId}`,
        method: 'PUT',
        data: {
          auto_check: !currentValue,
          // 关闭自动打卡时，设置结束日期为今天
          auto_check_until: !currentValue ? null : todayStr,
        },
      });
      console.log('Toggle auto check response:', res.data);

      if (res.data?.code === 200) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, auto_check: !currentValue, auto_check_until: !currentValue ? null : todayStr }
              : task
          )
        );
        Taro.showToast({
          title: !currentValue ? '已开启自动打卡' : '已关闭自动打卡',
          icon: 'success',
        });
      }
    } catch (error) {
      console.error('切换自动打卡失败:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
      });
    }
  };

  // 添加任务
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Taro.showToast({
        title: '请输入任务名称',
        icon: 'none',
      });
      return;
    }

    try {
      const res = await Network.request({
        url: '/api/tasks',
        method: 'POST',
        data: {
          title: newTaskTitle.trim(),
          auto_check: newTaskAutoCheck,
          is_important: newTaskImportant,
          is_urgent: newTaskUrgent,
        },
      });
      console.log('Add task response:', res.data);

      if (res.data?.code === 200) {
        setShowAddDialog(false);
        setNewTaskTitle('');
        setNewTaskAutoCheck(false);
        setNewTaskImportant(false);
        setNewTaskUrgent(false);
        await loadTasks();
        Taro.showToast({
          title: '添加成功',
          icon: 'success',
        });
      }
    } catch (error) {
      console.error('添加任务失败:', error);
      Taro.showToast({
        title: '添加失败',
        icon: 'error',
      });
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: number) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个任务吗？',
    });

    if (!result.confirm) return;

    try {
      const res = await Network.request({
        url: `/api/tasks/${taskId}`,
        method: 'DELETE',
      });
      console.log('Delete task response:', res.data);

      if (res.data?.code === 200) {
        await loadTasks();
        Taro.showToast({
          title: '删除成功',
          icon: 'success',
        });
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      Taro.showToast({
        title: '删除失败',
        icon: 'error',
      });
    }
  };

  // 计算打卡进度
  const checkedCount = checkedTasks.size;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // 自动打卡任务数量
  const autoCheckCount = tasks.filter((t) => t.auto_check).length;

  // 获取任务优先级标签
  const getPriorityBadge = (task: Task) => {
    if (task.is_important && task.is_urgent) {
      return <Badge className="bg-red-100 text-red-600 mr-2">紧急重要</Badge>;
    }
    if (task.is_important && !task.is_urgent) {
      return <Badge className="bg-blue-100 text-blue-600 mr-2">重要不急</Badge>;
    }
    if (!task.is_important && task.is_urgent) {
      return <Badge className="bg-yellow-100 text-yellow-600 mr-2">紧急不重要</Badge>;
    }
    return null;
  };

  return (
    <View className="min-h-full bg-gray-50 p-4 pb-20">
      {/* 标题区域 */}
      <View className="mb-6">
        <Text className="block text-2xl font-bold text-gray-800">今日打卡</Text>
        <Text className="block text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </Text>
      </View>

      {/* 进度卡片 */}
      {tasks.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-600">今日进度</Text>
              <Text className="text-lg font-bold text-emerald-500">
                {checkedCount}/{totalCount}
              </Text>
            </View>
            <Progress value={progressPercent} className="h-2" />
            <View className="flex flex-row items-center justify-between mt-2">
              <Text className="text-xs text-gray-400">
                完成 {progressPercent}%
              </Text>
              {autoCheckCount > 0 && (
                <View className="flex flex-row items-center">
                  <Zap size={12} color="#f59e0b" className="mr-1" />
                  <Text className="text-xs text-amber-500">
                    {autoCheckCount} 个自动打卡
                  </Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      )}

      {/* 任务列表 */}
      {loading ? (
        <View className="flex items-center justify-center py-20">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <Card className="mb-4">
          <CardContent className="p-8">
            <View className="flex flex-col items-center justify-center">
              <Text className="block text-gray-400 mb-4">还没有打卡任务</Text>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus size={16} color="#ffffff" className="mr-1" />
                <Text className="text-white">添加第一个任务</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      ) : (
        <View className="space-y-3">
          {tasks.map((task) => {
            const isChecked = checkedTasks.has(task.id);
            return (
              <Card
                key={task.id}
                className={`border-2 ${isChecked ? 'border-emerald-200 bg-emerald-50' : 'border-transparent'}`}
              >
                <CardContent className="p-4">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center flex-1">
                      {/* 打卡按钮 */}
                      <View
                        className="mr-3"
                        onClick={() => (isChecked ? handleUncheck(task.id) : handleCheck(task.id))}
                      >
                        {isChecked ? (
                          <View className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={18} color="#ffffff" />
                          </View>
                        ) : (
                          <Circle size={28} color="#d1d5db" />
                        )}
                      </View>
                      {/* 任务信息 */}
                      <View className="flex-1">
                        <View className="flex flex-row items-center flex-wrap">
                          <Text
                            className={`text-base font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                          >
                            {task.title}
                          </Text>
                          {task.auto_check && (
                            <Badge className="ml-2 bg-amber-100 text-amber-600">
                              <Zap size={10} color="#f59e0b" className="mr-1" />
                              自动
                            </Badge>
                          )}
                        </View>
                        {/* 优先级标签 */}
                        <View className="flex flex-row items-center mt-1">
                          {getPriorityBadge(task)}
                        </View>
                        {task.description && (
                          <Text className="block text-xs text-gray-400 mt-1">{task.description}</Text>
                        )}
                      </View>
                    </View>
                    {/* 右侧操作区 */}
                    <View className="flex flex-row items-center gap-2">
                      {isChecked && (
                        <Badge className="bg-emerald-100 text-emerald-600">已完成</Badge>
                      )}
                      <View onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 size={18} color="#ef4444" />
                      </View>
                    </View>
                  </View>
                  {/* 自动打卡开关 */}
                  <View className="flex flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <View className="flex flex-row items-center">
                      <Zap size={14} color={task.auto_check ? '#f59e0b' : '#9ca3af'} className="mr-2" />
                      <Text className="text-sm text-gray-600">持续自动打卡</Text>
                    </View>
                    <Switch
                      checked={task.auto_check}
                      onCheckedChange={() => handleToggleAutoCheck(task.id, task.auto_check)}
                    />
                  </View>
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}

      {/* 添加任务按钮 */}
      {tasks.length > 0 && (
        <View className="fixed bottom-20 right-4">
          <Button
            className="w-14 h-14 rounded-full shadow-lg"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus size={24} color="#ffffff" />
          </Button>
        </View>
      )}

      {/* 添加任务弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加打卡任务</DialogTitle>
          </DialogHeader>
          <View className="py-4 space-y-4">
            <Input
              placeholder="输入任务名称，如：早起、运动、阅读..."
              value={newTaskTitle}
              onInput={(e) => setNewTaskTitle(e.detail.value)}
            />
            
            {/* 重要/紧急选择 */}
            <View className="space-y-3">
              <Text className="text-sm font-medium text-gray-700">任务优先级</Text>
              <View className="grid grid-cols-2 gap-2">
                {/* 重要且紧急 */}
                <View 
                  className={`p-3 rounded-lg border-2 ${newTaskImportant && newTaskUrgent ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                  onClick={() => {
                    setNewTaskImportant(true);
                    setNewTaskUrgent(true);
                  }}
                >
                  <View className="flex items-center">
                    <CircleAlert size={16} color={newTaskImportant && newTaskUrgent ? '#ef4444' : '#9ca3af'} />
                    <Text className="ml-2 text-sm">紧急重要</Text>
                  </View>
                </View>
                
                {/* 重要不紧急 */}
                <View 
                  className={`p-3 rounded-lg border-2 ${newTaskImportant && !newTaskUrgent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => {
                    setNewTaskImportant(true);
                    setNewTaskUrgent(false);
                  }}
                >
                  <View className="flex items-center">
                    <Star size={16} color={newTaskImportant && !newTaskUrgent ? '#3b82f6' : '#9ca3af'} />
                    <Text className="ml-2 text-sm">重要不急</Text>
                  </View>
                </View>
                
                {/* 紧急不重要 */}
                <View 
                  className={`p-3 rounded-lg border-2 ${!newTaskImportant && newTaskUrgent ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}
                  onClick={() => {
                    setNewTaskImportant(false);
                    setNewTaskUrgent(true);
                  }}
                >
                  <View className="flex items-center">
                    <Clock size={16} color={!newTaskImportant && newTaskUrgent ? '#f59e0b' : '#9ca3af'} />
                    <Text className="ml-2 text-sm">紧急不重要</Text>
                  </View>
                </View>
                
                {/* 不重要不紧急 */}
                <View 
                  className={`p-3 rounded-lg border-2 ${!newTaskImportant && !newTaskUrgent ? 'border-gray-500 bg-gray-50' : 'border-gray-200'}`}
                  onClick={() => {
                    setNewTaskImportant(false);
                    setNewTaskUrgent(false);
                  }}
                >
                  <View className="flex items-center">
                    <View className={`w-4 h-4 rounded-full border-2 ${!newTaskImportant && !newTaskUrgent ? 'border-gray-500' : 'border-gray-300'}`} />
                    <Text className="ml-2 text-sm">普通任务</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* 自动打卡开关 */}
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <Zap size={16} color="#f59e0b" className="mr-2" />
                <Text className="text-sm text-gray-700">开启持续自动打卡</Text>
              </View>
              <Switch
                checked={newTaskAutoCheck}
                onCheckedChange={setNewTaskAutoCheck}
              />
            </View>
            {newTaskAutoCheck && (
              <View className="bg-amber-50 rounded-lg p-3">
                <Text className="text-xs text-amber-600">
                  开启后，系统将每天自动帮你完成打卡，直到你手动关闭此功能
                </Text>
              </View>
            )}
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              <Text>取消</Text>
            </Button>
            <Button onClick={handleAddTask}>
              <Text className="text-white">确定</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
};

export default IndexPage;
