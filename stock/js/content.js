/* ****************** background、content 共用 ***************** */
const APPNAME = 'shock'
// 消息通讯命令常量
const CMD = {
	// background -> content
	SHOCK_DEAL_DATA:'shockDealData',
	REFRESH_Z_INDEX:'refreshZIndex',
	// content -> background
	SET_SHOCK_REMARK:'setShockRemark',
	OBSERVER_ATTACHED:'observerAttached'
}
/* ****************** background、content 共用 end ***************** */

/* ********************** 小工具 ************************* */
var DomUtil = {
	parents(ele){
		var result = [] // 最终结果，包括本身，从下到上
		while(ele){
			result.push(ele)
			ele = ele.parentElement
		}
		return result;
	}
}
/* *********************************************** */

// DOM
var shockDom = document.createElement("div")
var shockDisplayBtn
var shockContent

/**
 * 添加股票到界面上
 */
function appendShock(){
	const html = `<style>
		#shockDom{
			position: fixed;
			left: 0;
			bottom: 0;
			background: rgba(0,0,0,0.4);
			border-top-right-radius: 10px;
			font-size: 12px;
			color: #000;
		}
		#shockDom .shock__display-btn{
			opacity: 0;
			--height: 18px;
			position: absolute;
			top: calc(0px - var(--height));
			width: 24px;
			height: var(--height);
			line-height: var(--height);
			text-align: center;
			background: inherit;
			border-top-right-radius: 10px;
			cursor: pointer;
		}
		#shockDom .shock__display-btn:hover{
			opacity: 1;
		}
		#shockDom .shock__content.shock__content--hide{
			display: none;
		}
		#shockDom .shock__item-remark{
			padding: 0 3px;
			cursor: pointer;
		}
	</style>
	<div class="shock__display-btn">○</div>
	<div class="shock__content shock__content--hide">
		<!-- shockItemHtmlTemplate()
		<div class="shock__item shock__item-code-sh000001" data-shock-code="sh000001">
			<span class="shock__item-name">上证指数</span>：<span class="shock__item-current-price">3083.7858</span>（<span class="shock__item-change-percent">-0.05</span>）<span contenteditable class="shock__item-remark">备注</span>
		</div>
		-->
	</div>`

	shockDom.id = 'shockDom'
	shockDom.innerHTML = html

	/* ******事件****** */
	shockDisplayBtn = shockDom.querySelector('.shock__display-btn')
	shockContent = shockDom.querySelector('.shock__content')
	shockDisplayBtn.addEventListener('click',function(e){
		shockContent.classList.toggle('shock__content--hide')
	})
	shockContent.addEventListener('click',function(e){
		if(e.target.classList.contains('shock__item-remark')){
			console.debug('click .shock__item-remark')
		}else{
			shockContent.classList.toggle('shock__content--hide')
		}
	})
	shockContent.addEventListener('blur',function(e){
		if(e.target.classList.contains('shock__item-remark')){
		    let shockCode = DomUtil.parents(e.target)
		        .filter((ele)=>ele.classList.contains('shock__item'))[0]
		        .dataset.shockCode
		    console.debug('blur .shock__item-remark')
		    let remark = e.target.innerText
            setShockRemark(shockCode,remark)
		}
	},true) // 事件在捕获阶段才有效，冒泡阶段无效
	
	document.body.appendChild(shockDom)
}
/* ********************** html 模板 ************************* */
function shockItemHtmlTemplate(shockDealData){
	return `<div class="shock__item shock__item-code-${shockDealData.shockCode}" data-shock-code="${shockDealData.shockCode}">
			<span class="shock__item-name">${shockDealData.name}</span>：<span class="shock__item-current-price">${shockDealData.currentPrice}</span>（<span class="shock__item-change-percent">${shockDealData.changePercent}</span>）<span contenteditable class="shock__item-remark">${shockDealData.remark}</span>
		</div>`
}


/* ********************** 功能 ************************* */
/**
	刷新股票控件的z-index，使其不被遮挡
*/
function refreshZIndex(){
	var maxZIndex = Array.from(document.all).map(ele => +window.getComputedStyle(ele).zIndex || 0).reduce((a,b)=>Math.max(a,b))
	shockDom.style.zIndex = maxZIndex + 1
}

/**
	渲染股票详细信息
*/
function renderShockContent(shockDealDataList){
	var shockItemNodeList = Array.from(shockContent.querySelectorAll('.shock__item'))
	shockDealDataList.forEach(shockDealData => {
		var shockItem
		if((shockItem = shockContent.querySelector(`.shock__item-code-${shockDealData.shockCode}`)) === null){
			// 插入新的股票详细信息
			shockContent.insertAdjacentHTML('beforeend',shockItemHtmlTemplate(shockDealData))
		}else{
			// 更新已经存在股票详细信息
			shockItem.querySelector('.shock__item-name').innerText = shockDealData.name
			shockItem.querySelector('.shock__item-current-price').innerText = shockDealData.currentPrice
			shockItem.querySelector('.shock__item-change-percent').innerText = shockDealData.changePercent
            // 如果获得焦点则不更新remark
            if(document.activeElement !== shockItem.querySelector('.shock__item-remark')){
			    shockItem.querySelector('.shock__item-remark').innerText = shockDealData.remark
			}
		}
	})
}

// function delay(ms){
// 	return new Promise(function(resolve){
// 		setTimeout(function(){
// 			resolve()
// 		},ms)
// 	})	
// }

/* ********************** 发送消息给 background ************************* */
/**
	添加观察者
*/
function observerAttached(){
	chrome.runtime.sendMessage({cmd:CMD.OBSERVER_ATTACHED, message: '添加观察者'}, function(response) {
		console.debug('收到来自后台的回复：' + response);
	});	
}
/**
	设置备注
*/
function setShockRemark(shockCode,remark){
	chrome.runtime.sendMessage({cmd:CMD.SET_SHOCK_REMARK,params:[shockCode,remark]}, function(response) {
		console.debug('收到来自后台的回复：' + response);
	});	
}

/* *********************** background / popup 返回信息 **************************** */

/**
	background / popup 返回信息
*/
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.cmd){
	case CMD.REFRESH_Z_INDEX:
		console.debug('收到后台消息',request.cmd)
		refreshZIndex()
// 		sendResponse()
		break;
	case CMD.SHOCK_DEAL_DATA:
		// background返回股票信息
		renderShockContent(request.data.shockDealDataList)
		//shockContent.innerHTML = request.data.html
		console.debug('收到了后台的消息',request.cmd,new Date())
		sendResponse('我收到了你的消息！');
	}
});

/* *************************** 执行代码 *************************** */
appendShock()
refreshZIndex()
observerAttached()
