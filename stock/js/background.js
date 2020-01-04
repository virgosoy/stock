const APPNAME = 'stock';

console.info(`lodash version: ${_.VERSION}`)

var timer; // 定时器

// 设置（此处的值为默认值，会和存储里面的拼接）
var settings = {
	running: true, // 是否运行中
	refreshMsTime: 1000, // 刷新时间间隔
	shockCodeList: ['sz000725','sz002419','sh000001','sz002594'], // 所有股票列表
	// 废弃：shockCodes，可能会被存储
}

var shocksInfo = {
	'sz000725':{display: true},
	'sz002419':{display: true},
	'sh000001':{display: true}
} // 股票的具体属性{display:boolean是否显示}

/**
	生成股票信息
*/
function generateShocksInfo(){
	var defaultProp = {display: true}
	var newShockCodeArr = _.difference(settings.shockCodeList,Object.keys(shocksInfo))
// 	var delShockCodeArr = _.difference(Object.keys(shocksInfo),settings.shockCodeList)
	newShockCodeArr.forEach(shockCode => shocksInfo[shockCode] = _.cloneDeep(defaultProp))
}

// 保存设置到存储
function saveStorage(){
	chrome.storage.local.set(settings,function(){
		console.info(`saveStorage success`,settings)
	})
}
/**
	从存储获取设置
	@Returns Promise<{}> settings对象
*/
function getStorage(){
	return new Promise(resolve => {
		chrome.storage.local.get(settings,function(v){
			console.info(`getStorage success`,v)
			settings = Object.assign(settings,v);
			resolve(settings)
		})	
	})
}

/* ******************************** 观察者模式 *************************************************** */

// 观察者列表
var observerList = []

/**
	添加观察者请求
*/
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	observerList.push(sender.tab.id);
	console.debug('收到来自content-script的消息：');
	console.debug(request, sender, sendResponse);
	sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
})


/* ******************************** ajax/fetch 获取股票并返回结果 *************************************************** */
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
function getShockDealInfo(){
	let url = `http://hq.sinajs.cn/?list=${getDisplayShockCodeList().join(',')}`
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
	console.debug(new Date())
	var shockInfos = await getShockDealInfo()
	var shockWebInfoValues = Object.values(shockInfos)
	var html
	if(shockWebInfoValues.length > 0){
		html = shockWebInfoValues.map(shockInfo => {
			return `<div>
				<span>${shockInfo.name}</span>：<span>${shockInfo.currentPrice}</span>（<span>${shockInfo.changePercent}</span>）
			</div>`
		}).reduce((a,b)=>a + b)
	}else{
		html = `<div>no shock</div>`
	}
	return`${html}`
}

/**
	循环并发送股票信息给观察者
*/
var loop = () => {
	timer = setTimeout(function(){
		shockHtml().then(html => {
			observerList.forEach((tabId) =>{
				chrome.tabs.sendMessage(tabId,html,function(response){
					console.debug(response)
					if(chrome.runtime.lastError){
						console.info(`error:${chrome.runtime.lastError.message}`)
						observerList.splice(observerList.indexOf(tabId),1)
					}
				})
			})
		})
		if(settings.running) loop()
	},settings.refreshMsTime)
}

/* ********************************************* 给popup调用 ************************************************ */
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

/**
	获取股票信息
*/
function getShocksInfo(){
	return shocksInfo
}

/**
	获取所有的股票代码设置，给popup显示
	@Returns Array<String>
*/
function getAllShockCodes(){
	return Object.keys(shocksInfo)
}

/**
	获取显示的股票代码数组
	@Returns Array<String>
*/
function getDisplayShockCodeList(){
	return Object.entries(shocksInfo).filter(([key,prop])=>prop.display).map(([key,prop])=>key)
}

/**
	添加股票
*/
function addShock(shockCode){
	if(settings.shockCodeList.includes(shockCode)){
		console.error(`股票代码已存在:${shockCode}`)
		return
	}
	settings.shockCodeList.push(shockCode)
	generateShocksInfo()
	saveStorage()
}
/**
	删除股票
*/
function removeShock(shockCode){
	if(!settings.shockCodeList.includes(shockCode) && !shocksInfo[shockCode]){
		console.error(`股票代码不存在:${shockCode}`)
		return
	}
	settings.shockCodeList.splice(settings.shockCodeList.indexOf(shockCode),1)
	delete shocksInfo[shockCode]
	generateShocksInfo()
	saveStorage()
}
/**
	切换股票显示/隐藏
*/
function toggleDisplay(shockCode){
	if(!shocksInfo[shockCode]){
		console.error(`股票代码不存在:${shockCode}`)
		return
	}
	shocksInfo[shockCode].display = !shocksInfo[shockCode].display
}	


/* ************************************ 页面载入时执行 *************************************** */
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
	generateShocksInfo()
	if(settings.running) loop()
})
