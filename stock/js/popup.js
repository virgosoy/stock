

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
// 股票控件操作
var contentControllerZIndex = document.querySelector('.content-controller__z-index')
var zIndexValueDom = document.querySelector('.content-controller__z-index-value')
// 模板
var templateValueDom = document.querySelector('.shock-item-template__value')
var templateSubmitDom = document.querySelector('.shock-item-template__submit')
var templateVariableBtnDom = document.querySelector('.shock-item-template__variable')
var templateVariableListDom = document.querySelector('.shock-item-template__variable-list')
var templateVariableItemTempDom = document.querySelector('.shock-item-template__variable-item-template')


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
/**
    刷新当前tab content的控件的z-index
*/
contentControllerZIndex.addEventListener('click',function(e){
    chrome.tabs.query({active: true, currentWindow: true},function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {cmd:bg.CMD.REFRESH_Z_INDEX}, function(response){
            renderZIndex()
        })
    })
})
/**
 * 设置当前页面的控件的z-index
 */
zIndexValueDom.addEventListener('input',function(e){
    var zIndex = zIndexValueDom.value;
    chrome.tabs.query({active: true, currentWindow: true},function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {cmd:bg.CMD.SET_Z_INDEX,data:zIndex})
    })
})

templateSubmitDom.addEventListener('click',function(e){
    let shockItemTemplate = templateValueDom.value;
    bg.setShockItemTemplate(shockItemTemplate);
})

templateVariableBtnDom.addEventListener('click',function(){
    templateVariableListDom.classList.toggle('shock-item-template__variable-list--hide')
    templateValueDom.focus()
})

templateVariableListDom.addEventListener('click',function(e){
    let value = e.path.find(dom=>dom?.classList?.contains('shock-item-template__variable-item'))
        ?.querySelector('.shock-item-template__variable-item-name-wrap')
        ?.innerText
    if(typeof value !== 'undefined'){
        templateValueDom.setRangeText(value,templateValueDom.selectionStart,templateValueDom.selectionEnd,"end")
        templateValueDom.focus()
    }
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

// 渲染：提交模板
function renderShockItemTemplate(){
    templateValueDom.value = bg.getShockItemTemplate()
}

// 渲染：模板变量列表
function renderShockItemVariable(){
    Object.entries(bg.shockDealDataDoc).forEach(([name,description])=>{
        let itemDom = templateVariableItemTempDom.content.cloneNode(true)
        itemDom.querySelector('.shock-item-template__variable-item-name').innerText = name
        itemDom.querySelector('.shock-item-template__variable-item-description').innerText = description
        templateVariableListDom.appendChild(itemDom)
    })
}

// 渲染：获取当前页面控件z-index
function renderZIndex(){
    chrome.tabs.query({active: true, currentWindow: true},function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {cmd:bg.CMD.GET_Z_INDEX},function(response){
            zIndexValueDom.value = response.data
        })
    })
}

// 所有渲染
function render(){
    renderZIndex()
    renderRefreshMsTime()
    renderRunning()
    renderShockList()
    renderShockItemTemplate()
    renderShockItemVariable()
}

/* ******************* 执行 ******************* */

// 初始化渲染
render()


