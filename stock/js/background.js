const APPNAME = 'stock';

var timer; // 定时器

// 设置（此处的值为默认值，会和存储里面的拼接）
var settings = {
	running: true, // 是否运行中
	refreshMsTime: 1000, // 刷新时间间隔
	shockCodes:['sz002587','sz000725','sz002419','sh000001'] // 显示的股票
}

// 保存设置到存储
function saveStorage(){
	chrome.storage.local.set(settings,function(){

	})
}
/**
	从存储获取设置
	@Returns Promise<{}> settings对象
*/
function getStorage(){
	return new Promise(resolve => {
		chrome.storage.local.get({refreshMsTime: 1000},function(v){
			settings = Object.assign(settings,v);
			resolve(settings)
		})	
	})
}


// 观察者列表
var observerList = []

/**
	添加观察者请求
*/
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	observerList.push(sender.tab.id);
	console.log('收到来自content-script的消息：');
	console.log(request, sender, sendResponse);
	sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
})


/**
 * 获取股票信息
 * @Returns Promise<[[shockCode]:{
 	infoArr,
	name,
	yesterdayEndPrice,
	currentPrice,
	changePercent
 },...]>
 */
function getShockInfo(){
	let url = `http://hq.sinajs.cn/?list=${settings.shockCodes.join(',')}`
	return fetch(url)
		.then(res => res.blob())
		.then(blob => new Promise((resolve)=>{
			var reader = new FileReader()
			reader.onload = (e)=>{
				resolve(e.target.result)
			}
			reader.readAsText(blob,'GBK')
		}))
		.then(text => {
			var result = {}
			var reg = /var hq_str_(.*?)="(.*?)";/mg
			while(true){
				var regResult = reg.exec(text)
				if(regResult === null){
					break
				}
				var infoArr = regResult[2].split(',')
				result[regResult[1]] = {infoArr,name:infoArr[0],yesterdayEndPrice:infoArr[2],currentPrice:infoArr[3],changePercent:Math.round((infoArr[3]-infoArr[2])/infoArr[2]*10000)/100}
			}
			return result
		})
}
/**
	获取股票html
	@Returns Promise<String> html文本
*/
async function shockHtml(){
	console.log(new Date())
	var shockInfos = await getShockInfo()
	var html = Object.values(shockInfos).map(shockInfo => {
		return `<div>
			<span>${shockInfo.name}</span>：<span>${shockInfo.currentPrice}</span>（<span>${shockInfo.changePercent}</span>）
		</div>`
	}).reduce((a,b)=>a + b)
	return`<div></div>${html}`
}

/**
	循环并发送股票信息给观察者
*/
var loop = () => {
	timer = setTimeout(function(){
		shockHtml().then(html => {
			observerList.forEach((tabId) =>{
				chrome.tabs.sendMessage(tabId,html,function(response){
					console.log(response)
					if(chrome.runtime.lastError){
						console.log(`error:${chrome.runtime.lastError.message}`)
						observerList.splice(observerList.indexOf(tabId),1)
					}
				})
			})
		})
		if(settings.running) loop()
	},settings.refreshMsTime)
}

/* ****************** 给popup调用 ********************* */
/**
	设置刷新毫秒
*/
function setRefreshMsTime(refreshMsTime){
	settings.refreshMsTime = refreshMsTime
	saveStorage()
}
/**
	获取刷新毫秒
*/
function getRefreshMsTime(){
	return settings.refreshMsTime
}
/**
	停止刷新
*/
function stopRefresh(){
	clearTimeout(timer)
	settings.running = false
	saveStorage()
}
/**
	开始刷新
*/
function startRefresh(){
	loop()
	settings.running = true
	saveStorage()
}

/**
	切换是否刷新
*/
function toggleRefresh(){
	settings.running ? stopRefresh() : startRefresh()
}


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

// 初始化获取数据
getStorage().then(()=>{
	if(settings.running) loop()
})
