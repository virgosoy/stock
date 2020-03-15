# Stock

chrome浏览器插件，显示股票信息



## 使用方法

加载插件后直接点击左下角显示股票信息

股票信息界面操作：

- 点击切换显示/隐藏
- 每个股票的最后面当鼠标变成手指时可点击输入备注

点击插件按钮可进行设置

- 刷新间隔
- 开关
- 股票新增/删除
- 股票显示/隐藏
- 更新当前页控件z-index
- 股票内容显示模板



## 使用存储

settings：配置项，详见 `background.js` 的变量 `settings`



## TODO List

- [ ] 获取当日均价
- [x] 调整样式 (fb-style)
- [ ] 隐藏时不执行定时器
- [ ] 消息弹窗
  - [ ] 设置预警金额
- [ ] 设置错误提示
- [ ] 全局一同显示/隐藏



## 0.0.0.9.200314_beta

F：关闭浏览器后原来的配置丢失

A：可设置显示内容模板

A：股票内容显示模板可以显式插入变量

## 0.0.0.8.200223_beta

F：获取最大z-index有误

## 0.0.0.7.200223_beta

A：可输入备注

## 0.0.0.6.200107_beta

A：加载到页面时自动更新z-index

A：popup手动刷新当前页控件的z-index

## 0.0.0.5.200104_beta

A：可设置股票不显示

- （配置项shockCodes废弃）

U：修改 股票默认值、增加与删除股票 的逻辑

F：无股票时报错

U：优化部分命名

## 0.0.0.4.191218_beta

A：增加设置股票代码

F：修复存储不生效

## 0.0.0.3.191218_beta

F：当浏览器窗口关闭时发送消息报错，现改为报错时移除监听列表中的tabId

F：manifest.json 的 permission 报错



## 0.0.0.2.191217_beta

A：所有页面共用数据

A：开关设置

A：可设置刷新时间间隔


## 0.0.0.1.191204_beta

A：左下角显示固定股票信息，可点击显示/隐藏

