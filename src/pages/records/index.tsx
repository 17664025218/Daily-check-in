import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import { Network } from '@/network';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react-taro';
import { checkLoginOrRedirect } from '@/utils/auth';

interface Task {
  id: number;
  title: string;
  auto_check: boolean;
  auto_check_until: string | null; // 持续打卡的结束日期
  created_at: string; // 任务创建日期
}

interface CheckRecord {
  id: number;
  task_id: number;
  check_date: string;
  note: string | null;
  created_at: string;
}

interface TaskCheckStats {
  totalDays: number;
  dates: string[];
}

interface MonthStats {
  totalDays: number;
  totalTasks: number;
  completedTasks: number;
}

const RecordsPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<CheckRecord[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [taskStats, setTaskStats] = useState<Record<number, TaskCheckStats>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskStats, setSelectedTaskStats] = useState<TaskCheckStats | null>(null);

  // 加载任务列表
  const loadTasks = async () => {
    try {
      const res = await Network.request({
        url: '/api/tasks',
        method: 'GET',
      });
      console.log('Tasks response:', res.data);
      setTasks(res.data?.data || []);
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  };

  // 加载指定月份的打卡记录
  const loadRecords = async (year: number, month: number) => {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${getDaysInMonth(year, month)}`;

      const res = await Network.request({
        url: '/api/check-records/range',
        method: 'GET',
        data: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      console.log('Records response:', res.data);
      setRecords(res.data?.data || []);
    } catch (error) {
      console.error('加载记录失败:', error);
    }
  };

  // 加载所有任务的打卡统计
  const loadTaskStats = async () => {
    try {
      const res = await Network.request({
        url: '/api/check-records/stats',
        method: 'GET',
      });
      console.log('Stats response:', res.data);
      setTaskStats(res.data?.data || {});
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 加载单个任务的详细统计
  const loadTaskDetailStats = async (taskId: number) => {
    try {
      const res = await Network.request({
        url: `/api/check-records/stats/${taskId}`,
        method: 'GET',
      });
      console.log('Task stats response:', res.data);
      setSelectedTaskStats(res.data?.data || null);
    } catch (error) {
      console.error('加载任务统计失败:', error);
      setSelectedTaskStats(null);
    }
  };

  useDidShow(() => {
    // 检查登录状态
    if (!checkLoginOrRedirect()) {
      return;
    }
    loadTasks();
    loadTaskStats();
    loadRecords(currentYear, currentMonth);
  });

  // 获取月份天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 获取月份第一天是周几 (0-6, 0=周日)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // 切换月份
  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }

    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    loadRecords(newYear, newMonth);
  };

  /**
   * 判断任务是否应该在某个日期显示
   * 规则1（单次任务）：未开启持续打卡，只在创建当天显示
   * 规则2（持续任务）：开启持续打卡，从创建日期持续显示到未来
   * 规则3（状态终止）：关闭持续打卡后，从 auto_check_until 之后不再显示
   */
  const shouldTaskShowOnDate = (task: Task, dateStr: string): boolean => {
    // 获取任务创建日期（只取日期部分）
    const createdDate = task.created_at.split('T')[0];
    
    // 如果日期在创建日期之前，不显示
    if (dateStr < createdDate) {
      return false;
    }
    
    // 规则1：未开启持续打卡，只在创建当天显示
    if (!task.auto_check) {
      return dateStr === createdDate;
    }
    
    // 规则2 & 3：开启持续打卡
    // 如果有结束日期，且当前日期超过结束日期，不显示
    if (task.auto_check_until && dateStr > task.auto_check_until) {
      return false;
    }
    
    // 从创建日期开始持续显示
    return true;
  };

  // 获取指定日期应该显示的任务列表
  const getVisibleTasksForDate = (dateStr: string): Task[] => {
    return tasks.filter(task => shouldTaskShowOnDate(task, dateStr));
  };

  // 获取指定日期的任务完成情况
  const getTaskCompletionForDate = (dateStr: string) => {
    const visibleTasks = getVisibleTasksForDate(dateStr);
    const dayRecords = records.filter((r) => r.check_date === dateStr);
    const checkedTaskIds = new Set(dayRecords.map((r) => r.task_id));
    
    // 只统计可见任务中已打卡的
    const completedTasks = visibleTasks.filter(t => checkedTaskIds.has(t.id)).length;
    const totalTasks = visibleTasks.length;

    return {
      total: totalTasks,
      completed: completedTasks,
      allDone: totalTasks > 0 && completedTasks === totalTasks,
      hasSome: completedTasks > 0,
      hasTasks: totalTasks > 0,
    };
  };

  // 计算月度统计
  const getMonthStats = (): MonthStats => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const today = new Date();
    const currentDay = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth
      ? today.getDate()
      : daysInMonth;

    let totalTasks = 0;
    let completedTasks = 0;

    for (let day = 1; day <= currentDay; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const completion = getTaskCompletionForDate(dateStr);
      totalTasks += completion.total;
      completedTasks += completion.completed;
    }

    return {
      totalDays: currentDay,
      totalTasks,
      completedTasks,
    };
  };

  // 渲染日历
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: JSX.Element[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} className="w-10 h-10" />);
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const completion = getTaskCompletionForDate(dateStr);
      const isToday = dateStr === todayStr;
      const isSelected = selectedDate === dateStr;
      const isFuture = new Date(dateStr) > new Date(todayStr);

      // 根据完成情况决定背景色
      let bgClass = '';
      let textClass = 'text-gray-700';

      if (isSelected) {
        bgClass = 'bg-emerald-500';
        textClass = 'text-white';
      } else if (completion.hasTasks && completion.allDone) {
        // 全部完成 - 绿色
        bgClass = 'bg-emerald-100';
        textClass = 'text-emerald-600';
      } else if (completion.hasTasks && completion.hasSome) {
        // 部分完成 - 黄色
        bgClass = 'bg-amber-100';
        textClass = 'text-amber-600';
      } else if (completion.hasTasks) {
        // 有任务但未打卡 - 灰色
        bgClass = 'bg-gray-100';
        textClass = 'text-gray-500';
      } else if (isToday) {
        // 今天 - 边框
        bgClass = 'border-2 border-emerald-500';
      }

      // 显示完成进度（只有有任务的日期才显示）
      const progressText = completion.hasTasks ? `${completion.completed}/${completion.total}` : '';

      days.push(
        <View
          key={day}
          className={`w-10 h-10 rounded-full flex flex-col items-center justify-center ${bgClass} ${isFuture ? 'opacity-30' : ''} ${!isFuture ? 'active:opacity-70' : ''}`}
          onClick={() => !isFuture && setSelectedDate(dateStr)}
        >
          <Text className={`text-sm font-medium ${textClass}`}>
            {day}
          </Text>
          {completion.hasTasks && !isFuture && (
            <Text className={`text-[8px] ${isSelected ? 'text-white' : 'text-gray-400'}`}>
              {progressText}
            </Text>
          )}
        </View>
      );
    }

    return days;
  };

  // 获取选中日期的打卡详情
  const getSelectedDateDetails = () => {
    if (!selectedDate) return null;

    const visibleTasks = getVisibleTasksForDate(selectedDate);
    const dayRecords = records.filter((r) => r.check_date === selectedDate);
    const checkedTaskIds = new Set(dayRecords.map((r) => r.task_id));

    return {
      date: selectedDate,
      tasks: visibleTasks.map((task) => ({
        ...task,
        checked: checkedTaskIds.has(task.id),
      })),
    };
  };

  // 点击任务查看打卡统计
  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    await loadTaskDetailStats(task.id);
  };

  // 关闭弹窗
  const handleCloseDialog = () => {
    setSelectedTask(null);
    setSelectedTaskStats(null);
  };

  const stats = getMonthStats();
  const selectedDetails = getSelectedDateDetails();

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <View className="min-h-full bg-gray-50 p-4 pb-20">
      {/* 月份切换 */}
      <View className="flex flex-row items-center justify-between mb-4">
        <View onClick={() => changeMonth(-1)}>
          <ChevronLeft size={24} color="#6b7280" />
        </View>
        <Text className="text-lg font-bold text-gray-800">
          {currentYear}年{currentMonth}月
        </Text>
        <View onClick={() => changeMonth(1)}>
          <ChevronRight size={24} color="#6b7280" />
        </View>
      </View>

      {/* 月度统计 */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <View className="flex flex-row items-center justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-emerald-600">{stats.totalDays}</Text>
              <Text className="text-xs text-gray-500 mt-1">记录天数</Text>
            </View>
            <View className="w-px h-8 bg-gray-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">{stats.totalTasks}</Text>
              <Text className="text-xs text-gray-500 mt-1">总任务次</Text>
            </View>
            <View className="w-px h-8 bg-gray-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">{stats.completedTasks}</Text>
              <Text className="text-xs text-gray-500 mt-1">已完成</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 选中日期的提示 */}
      {!selectedDate && (
        <View className="items-center py-2 mb-2">
          <Text className="text-xs text-gray-400">点击日历上的日期查看任务详情</Text>
        </View>
      )}

      {/* 日历 */}
      <Card className="mb-4">
        <CardContent className="p-4">
          {/* 星期头 */}
          <View className="flex flex-row justify-around mb-2">
            {weekDays.map((day) => (
              <Text key={day} className="text-xs text-gray-400 w-10 text-center">
                {day}
              </Text>
            ))}
          </View>

          {/* 日期格子 */}
          <View className="flex flex-row flex-wrap gap-1">
            {renderCalendar()}
          </View>

          {/* 图例 */}
          <View className="flex flex-row items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <View className="flex flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-emerald-100" />
              <Text className="text-xs text-gray-500">已完成</Text>
            </View>
            <View className="flex flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-amber-100" />
              <Text className="text-xs text-gray-500">部分完成</Text>
            </View>
            <View className="flex flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-gray-100" />
              <Text className="text-xs text-gray-500">未完成</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 选中日期的详情 */}
      {selectedDetails && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold text-gray-800 mb-3">
              {selectedDetails.date} 任务完成情况
            </Text>
            <View className="gap-3">
              {selectedDetails.tasks.length === 0 ? (
                <Text className="text-sm text-gray-400 text-center py-4">该日期没有任务</Text>
              ) : (
                selectedDetails.tasks.map((task) => {
                  const taskStat = taskStats[task.id];
                  return (
                    <View
                      key={task.id}
                      className="flex flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleTaskClick(task)}
                    >
                      <View className="flex flex-row items-center gap-2 flex-1">
                        <View
                          className={`w-4 h-4 rounded-full ${task.checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        />
                        <Text className={`text-sm ${task.checked ? 'text-gray-800' : 'text-gray-400'}`}>
                          {task.title}
                        </Text>
                        {task.auto_check && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            自动
                          </Badge>
                        )}
                      </View>
                      {taskStat && taskStat.totalDays > 0 && (
                        <View className="flex flex-row items-center gap-1">
                          <TrendingUp size={12} color="#10b981" />
                          <Text className="text-xs text-emerald-600">{taskStat.totalDays}天</Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </CardContent>
        </Card>
      )}

      {/* 任务打卡统计弹窗 */}
      {selectedTask && (
        <Dialog open onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-[280px]">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>
            <View className="py-4">
              {selectedTaskStats ? (
                <>
                  <View className="items-center mb-4">
                    <Text className="text-4xl font-bold text-emerald-600">
                      {selectedTaskStats.totalDays}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">累计打卡天数</Text>
                  </View>
                  {selectedTaskStats.dates.length > 0 && (
                    <View>
                      <Text className="text-xs text-gray-400 mb-2">最近打卡日期</Text>
                      <View className="flex flex-row flex-wrap gap-2">
                        {selectedTaskStats.dates.slice(-7).map((date) => (
                          <Badge key={date} variant="outline" className="text-xs">
                            {date}
                          </Badge>
                        ))}
                        {selectedTaskStats.dates.length > 7 && (
                          <Badge variant="secondary" className="text-xs">
                            +{selectedTaskStats.dates.length - 7}天
                          </Badge>
                        )}
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Text className="text-sm text-gray-400 text-center">暂无打卡记录</Text>
              )}
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  );
};

export default RecordsPage;
