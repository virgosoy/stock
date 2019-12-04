const APPNAME = 'shock';


var setting = {
	shockCodes:['sz002587','sz000725','sz002419','sh000001']
}


/**
 * 获取股票信息
 * @Returns Promise<{}>
 */
function getShockInfo(){
	let url = `//hq.sinajs.cn/?list=${setting.shockCodes.join(',')}`
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



var shockDom = document.createElement("div")
var btnHideDom
var contentDom
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

	btnHideDom = shockDom.querySelector('.btn-hide')
	contentDom = shockDom.querySelector('.content')
	btnHideDom.addEventListener('click',function(e){
		contentDom.classList.toggle('hide')
	})
	contentDom.addEventListener('click',function(e){
		contentDom.classList.toggle('hide')
	})
	document.body.appendChild(shockDom)
}

async function refreshShock(){
	// console.log(new Date())
	var shockInfos = await getShockInfo()
	var html = Object.values(shockInfos).map(shockInfo => {
		return `<div>
			<span>${shockInfo.name}</span>：<span>${shockInfo.currentPrice}</span>（<span>${shockInfo.changePercent}</span>）
		</div>`
	}).reduce((a,b)=>a + b)
	contentDom.innerHTML = `<div></div>${html}`
}

/* *************************** 执行代码 *************************** */
appendShock()
refreshShock()
setInterval(function(){
	if(!contentDom.classList.contains('hide')){
		refreshShock()
	}
},1000)