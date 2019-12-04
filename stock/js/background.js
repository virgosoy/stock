const APPNAME = 'stock';

/************* 页面载入时执行 ********/
/** 通知 **/
chrome.notifications.create('start',{
	type:chrome.notifications.TemplateType.BASIC,
	iconUrl:'image/icon48.png',
	title:'你好',
	message:`欢迎使用${APPNAME}插件`
}, function(notificationId){
	// NO-OP
})