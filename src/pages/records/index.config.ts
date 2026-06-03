export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '打卡记录',
    })
  : { navigationBarTitleText: '打卡记录' };
