export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/index/index',
    'pages/plan/index',
    'pages/records/index',
    'pages/profile/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '每日打卡',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#10b981',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/house.png',
        selectedIconPath: './assets/tabbar/house-active.png',
      },
      {
        pagePath: 'pages/plan/index',
        text: '规划',
        iconPath: './assets/tabbar/target.png',
        selectedIconPath: './assets/tabbar/target-active.png',
      },
      {
        pagePath: 'pages/records/index',
        text: '记录',
        iconPath: './assets/tabbar/calendar.png',
        selectedIconPath: './assets/tabbar/calendar-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
});
