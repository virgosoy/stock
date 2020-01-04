const APPNAME = 'shock';


// DOM
var shockDom = document.createElement("div")
var shockDisplayBtn
var shockContent

var timer
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
	</style>
	<div class="shock__display-btn">○</div>
	<div class="shock__content shock__content--hide">
		<!-- 
		<div>
			<span>上证指数</span>：<span>3083.7858</span>（<span>-0.05</span>）
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
		shockContent.classList.toggle('shock__content--hide')
	})
// 	var mo = new MutationObserver(function(mutationRecords,observer){
// 		if(mutationRecords.some(mr=>mr.attributeName === 'class')){
// 			if(shockContent.classList.contains('shock__content--hide')){
// 				clearInterval(timer)
// 				timer = undefined
// 			}else{
// 				if(timer)return
// 				timer = setInterval(function(){
// 					refreshShock()
// 				},1000)
// 			}
// 		}
// 	})
// 	mo.observe(shockContent,{attributes: true,attributeFilter: ['class']})

	document.body.appendChild(shockDom)
}

/**
	添加观察者
*/
function observerAttached(){
	chrome.runtime.sendMessage({message: '添加观察者'}, function(response) {
		console.debug('收到来自后台的回复：' + response);
	});	
}

/**
	background返回股票信息
*/
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	shockContent.innerHTML = request
	console.debug('收到了后台的消息',new Date())
	sendResponse('我收到了你的消息！');
});

function delay(ms){
	return new Promise(function(resolve){
		setTimeout(function(){
			resolve()
		},ms)
	})	
}



/* *************************** 执行代码 *************************** */
appendShock()
observerAttached()
