const APPNAME = 'shock';


var shockDom = document.createElement("div")
var btnHideDom
var contentDom
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
		#shockDom .btn-hide{
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
		#shockDom .btn-hide:hover{
			opacity: 1;
		}
		#shockDom .content.hide{
			display: none;
		}
	</style>
	<div class="btn-hide">○</div>
	<div class="content hide"></div>`
	shockDom.id = 'shockDom'
	shockDom.innerHTML = html

	/* ******事件****** */
	btnHideDom = shockDom.querySelector('.btn-hide')
	contentDom = shockDom.querySelector('.content')
	btnHideDom.addEventListener('click',function(e){
		contentDom.classList.toggle('hide')
	})
	contentDom.addEventListener('click',function(e){
		contentDom.classList.toggle('hide')
	})
// 	var mo = new MutationObserver(function(mutationRecords,observer){
// 		if(mutationRecords.some(mr=>mr.attributeName === 'class')){
// 			if(contentDom.classList.contains('hide')){
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
// 	mo.observe(contentDom,{attributes: true,attributeFilter: ['class']})

	document.body.appendChild(shockDom)
}

/**
	添加观察者
*/
function observerAttached(){
	chrome.runtime.sendMessage({message: '添加观察者'}, function(response) {
		console.log('收到来自后台的回复：' + response);
	});	
}

/**
	background返回股票信息
*/
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	contentDom.innerHTML = request
	console.log('收到了后台的消息',new Date())
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
