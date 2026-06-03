export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '任务规划' })
  : { navigationBarTitleText: '任务规划' }
