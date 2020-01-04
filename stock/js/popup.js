

var bg = chrome.extension.getBackgroundPage();

// 刷新时间显示
var refreshMsLblDom = document.querySelector('#refreshMsLbl')
// 刷新时间设置
var refreshMsIptDom = document.querySelector('#refreshMsIpt')
// 切换是否运行
var toggleRunningBtn = document.querySelector('#toggleRunningBtn')
// 股票列表元素模板
var shockListItemTemplate = document.querySelector('.shock-list__item-template')
// 股票列表元素容器
var shockListItemsWrap = document.querySelector('.shock-list__items-wrap')
var shockListAddBtn = document.querySelector('.shock-list__add-btn')
var shockListAddInput = document.querySelector('.shock-list__add-input')
var shockListDom = document.querySelector('.shock-list')

/* ************************************事件监听****************************************** */

refreshMsIptDom.addEventListener('input',function(e){
    var _this = this;
    refreshMsLblDom.innerText = _this.value
    bg.setRefreshMsTime(_this.value)
})
toggleRunningBtn.addEventListener('click',function(e){
    bg.toggleRefresh()
    renderRunning()
})
shockListDom.addEventListener('click',function(e){
    // 移除股票
    if(e.target.classList.contains('shock-list__item-remove-btn')){
        bg.removeShock(e.target.parentElement.querySelector('.shock-list__item-code').innerText)
        renderShockList()
    }
    // 切换股票显示/隐藏
    if(e.target.classList.contains('shock-list__item-toggle-display')){
        bg.toggleDisplay(e.target.parentElement.querySelector('.shock-list__item-code').innerText)
        renderShockList()
    }
})
shockListAddBtn.addEventListener('click',function(e){
    bg.addShock(shockListAddInput.value)
    renderShockList()
})

/* ****************** popup.html 渲染 ************************************ */

// 渲染显示：刷新时间
function renderRefreshMsTime(){
    var refreshMsTime = bg.getRefreshMsTime()
    refreshMsIptDom.value = refreshMsTime
    refreshMsLblDom.innerText = refreshMsTime
}


// 渲染显示：是否运行
function renderRunning(){
    toggleRunningBtn.innerText = bg.settings.running ? 'OFF' : 'ON'
}

// 渲染：显示股票列表
function renderShockList(){
    // 清空子节点
    while (shockListItemsWrap.firstChild) {
        shockListItemsWrap.removeChild(shockListItemsWrap.firstChild);
    }
    Object.entries(bg.getShockLocalPropMap()).forEach(([key,prop])=>{
        var itemDom = shockListItemTemplate.content.cloneNode(true)
        itemDom.querySelector('.shock-list__item-code').innerText = key
        itemDom.querySelector('.shock-list__item-toggle-display').innerText = prop.display ? 'hide' : 'show'
        shockListItemsWrap.appendChild(itemDom)
    })
}

/* ******************* 执行 ******************* */

// 初始化渲染
renderRefreshMsTime()
renderRunning()
renderShockList()


