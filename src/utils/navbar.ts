import { systemInfo } from './utils';

/**
 * 参考 TDesign 小程序 Navbar 组件逻辑计算导航栏相关数值
 * @param leftRect 可选，左侧按钮/内容的矩形信息。如果不提供，中心区域将基于胶囊按钮的间距进行对称。
 */
export const getNavbarInfo = (leftRect?: { right: number }) => {
  // 获取胶囊按钮信息
  let menuRect: any = {
    width: 87,
    height: 32,
    left: systemInfo.windowWidth - 7 - 87,
    top: systemInfo.statusBarHeight + 4,
    right: systemInfo.windowWidth - 7,
    bottom: systemInfo.statusBarHeight + 4 + 32,
  };

  if (wx.getMenuButtonBoundingClientRect) {
    try {
      const rect = wx.getMenuButtonBoundingClientRect();
      if (rect && rect.width > 0) {
        menuRect = rect;
      }
    } catch (e) {
      // fallback to default
    }
  }

  const paddingTop = systemInfo.statusBarHeight;
  const right = systemInfo.windowWidth - menuRect.left;
  const leftMaxWidth = menuRect.left;
  const capsuleHeight = menuRect.height;
  const capsuleWidth = menuRect.width;
  // 计算导航栏高度：(胶囊顶部 - 状态栏高度) * 2 + 胶囊高度
  const navbarHeight = (menuRect.top - systemInfo.statusBarHeight) * 2 + menuRect.height;

  // 计算中间区域
  // TDesign 逻辑：const maxSpacing = Math.max(leftRect.right, systemInfo.windowWidth - menuRect.left);
  const menuButtonSpacing = systemInfo.windowWidth - menuRect.left;
  const maxSpacing = leftRect ? Math.max(leftRect.right, menuButtonSpacing) : menuButtonSpacing;

  const centerLeft = maxSpacing;
  const centerWidth = Math.max(menuRect.left - maxSpacing, 0);

  return {
    // CSS 变量格式
    '--td-navbar-padding-top': `${paddingTop}px`,
    '--td-navbar-right': `${right}px`,
    '--td-navbar-left-max-width': `${leftMaxWidth}px`,
    '--td-navbar-capsule-height': `${capsuleHeight}px`,
    '--td-navbar-capsule-width': `${capsuleWidth}px`,
    '--td-navbar-height': `${navbarHeight}px`,
    '--td-navbar-center-left': `${centerLeft}px`,
    '--td-navbar-center-width': `${centerWidth}px`,

    // 原始数值格式
    paddingTop,
    right,
    leftMaxWidth,
    capsuleHeight,
    capsuleWidth,
    navbarHeight,
    centerLeft,
    centerWidth,
    menuRect,
    totalHeight: paddingTop + navbarHeight, // 状态栏 + 导航栏
  };
};
