/* ****************** background、content 共用 ***************** */
const APPNAME = 'shock'
// 消息通讯命令常量
const CMD = {
	// background -> content
	SHOCK_DEAL_DATA:'shockDealData',
	REFRESH_Z_INDEX:'refreshZIndex',
	SET_Z_INDEX:'setZIndex',
	GET_Z_INDEX:'getZIndex',
	// content -> background
	SET_SHOCK_REMARK:'setShockRemark',
	OBSERVER_ATTACHED:'observerAttached'
}
/* ****************** background、content 共用 end ***************** */
//shockDealDat 结构说明：
const shockDealDataDoc = {
	dealDataList:'数据列表',
	shockCode: '股票代码（新浪的）',
	name:'名称',
	yesterdayEndPrice:'昨日收盘价',
	currentPrice:'当前价',
	changePercent:'涨跌幅',
	openingPrice: '开盘价',
	highestPrice: '今日最高价',
	lowestPrice: '今日最低价',
	tradeVolume: '今日成交量',
	tradeMoney: '今日成交价',
	avgPrice: '今日均价',
	// 后生成
	remark:'备注'
	//text:'模板解析后文本'
}
/* ************** popup 也使用 ************** */
globalThis.APPNAME = APPNAME
globalThis.CMD = CMD
globalThis.shockDealDataDoc = shockDealDataDoc
/* ************** popup 也使用 end ************** */


console.info(`lodash version: ${_.VERSION}`)

// 定时器
var timer; 

// 设置（此处的值为默认值，会和存储里面的拼接）
var settings = {
	running: true, // 是否运行中
	refreshMsTime: 1000, // 刷新时间间隔
	// 股票显示模板
	shockItemTemplate: '${name}：${currentPrice}（${changePercent}）',
	// 默认股票代码列表，用于手动修改代码码设置默认显示股票
	defaultShockCodeList: ['sz000725','sh000001'], 
	// @Deprecated shockCodes，可能会被存储
	// 股票在本地的属性，如是否显示
	shockLocalPropMap: { // 股票的具体属性
	/* 	'sh000001':{
		    display: true, //boolean是否显示
		    remark: '', // String，可选，默认为空，备注
	    }
	*/
	}, 
	// 股票在本地的默认属性，手动修改代码设置
	defaultShockLocalProp:{display: true}
}

var shockLocalPropMap = new Proxy(settings.shockLocalPropMap,{})

// 观察者列表
var observerList = []


/**
	生成股票信息
	@Param {add:Array<String>,del:Array<String>} add：增加的股票代码列表，del：删除的股票代码列表
*/
function generateShockLocalPropMap({add = [],del = []} = {}){
	var defaultProp = settings.defaultShockLocalProp
//	var newShockCodeArr = _.difference(settings.defaultShockCodeList,Object.keys(shockLocalPropMap))
// 	var delShockCodeArr = _.difference(Object.keys(shockLocalPropMap),settings.defaultShockCodeList)
	add.forEach(shockCode => shockLocalPropMap[shockCode] = _.cloneDeep(defaultProp))
	del.forEach(shockCode => delete shockLocalPropMap[shockCode])

	// 如果没有股票，那么使用默认股票
	if(!shockLocalPropMap || Object.keys(shockLocalPropMap).length === 0){
		settings.defaultShockCodeList.forEach(shockCode => shockLocalPropMap[shockCode] = _.cloneDeep(defaultProp))
	}
	saveStorage()
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
			// 代理
			shockLocalPropMap = new Proxy(settings.shockLocalPropMap,{})
			resolve(settings)
		})	
	})
}


/* ******************************** ajax/fetch 获取股票并返回结果 *************************************************** */
/**
 * 获取所有股票的详细资料
 * @Returns Promise<[[shockCode]:{
 	dealDataList,
	name,
	yesterdayEndPrice,
	currentPrice,
	changePercent
 },...]>
 */
function fetchAllShockDealData(){
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
				var dealDataList = regResult[2].split(',')
				var shockCode = regResult[1]
				// 字段描述见 shockDealDataDoc 常量
				result[shockCode] = {dealDataList,
					shockCode:shockCode, 
					name:dealDataList[0],
					yesterdayEndPrice:dealDataList[2],
					currentPrice:dealDataList[3],
					changePercent:Math.round((dealDataList[3]-dealDataList[2])/dealDataList[2]*10000)/100,
					openingPrice: dealDataList[1],
					highestPrice: dealDataList[4],
					lowestPrice: dealDataList[5],
					tradeVolume: dealDataList[8],
					tradeMoney: dealDataList[9],
					avgPrice: (dealDataList[9]/dealDataList[8]).toFixed(2)
				}
			}
			return result
		})
}
/**
	获取股票html
	结合本地存储的配置数据进行返回
	@Returns Promise<[String,Array]> html文本
*/
async function shockHtml(){
	console.debug(new Date())
	var shockDealDataMap = await fetchAllShockDealData()
	var shockDealDataValueList = Object.values(shockDealDataMap)
	shockDealDataValueList.forEach(shockDealData => {
		var remark = shockLocalPropMap[shockDealData.shockCode].remark || ''
		shockDealData.remark = remark
		shockDealData.text = Utils.parseTemplate(shockDealData, settings.shockItemTemplate)
	})
	return shockDealDataValueList
}

/**
	循环并发送股票信息给观察者
*/
var loop = () => {
	timer = setTimeout(function(){
		shockHtml().then(shockDealDataList => {
			observerList.forEach((tabId) =>{
				chrome.tabs.sendMessage(tabId,{cmd:CMD.SHOCK_DEAL_DATA,
						data:{shockDealDataList: shockDealDataList}},
						function(response){
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

/* ******************************** 从 content 接收消息 *************************************************** */


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.cmd){
		case CMD.OBSERVER_ATTACHED:
		    /*添加观察者请求*/
			observerList.push(sender.tab.id);
			console.debug('收到来自content-script的消息：');
			console.debug(request, sender, sendResponse);
			sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
		    break;
		case CMD.SET_SHOCK_REMARK:
		    setShockRemark(...request.params);
			sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
            break;
	}
})

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
function getShockLocalPropMap(){
	return shockLocalPropMap
}

/**
	获取所有的股票代码设置，给popup显示
	@Returns Array<String>
*/
function getAllShockCodes(){
	return Object.keys(shockLocalPropMap)
}

/**
	获取显示的股票代码数组
	@Returns Array<String>
*/
function getDisplayShockCodeList(){
	return Object.entries(shockLocalPropMap).filter(([key,prop])=>prop.display).map(([key,prop])=>key)
}

/**
	添加股票
*/
function addShock(shockCode){
	if(shockLocalPropMap[shockCode]){
		console.error(`股票代码已存在:${shockCode}`)
		return
	}
	generateShockLocalPropMap({add:[shockCode]})
}
/**
	删除股票
*/
function removeShock(shockCode){
	if(!shockLocalPropMap[shockCode]){
		console.error(`股票代码不存在:${shockCode}`)
		return
	}
	generateShockLocalPropMap({del:[shockCode]})
}
/**
	切换股票显示/隐藏
*/
function toggleDisplay(shockCode){
	if(!shockLocalPropMap[shockCode]){
		console.error(`股票代码不存在:${shockCode}`)
		return
	}
	shockLocalPropMap[shockCode].display = !shockLocalPropMap[shockCode].display
}	
/**
    设置股票备注
    @param shockCode
    @param remark
*/
function setShockRemark(shockCode,remark){
	shockLocalPropMap[shockCode].remark = remark
}
/**
    设置股票显示模板
*/
function setShockItemTemplate(template){
	settings.shockItemTemplate = template
	saveStorage()
}
/**
    获取股票显示模板
*/
function getShockItemTemplate(){
	return settings.shockItemTemplate
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
	generateShockLocalPropMap()
	if(settings.running) loop()
})
