

var bg = chrome.extension.getBackgroundPage();

// 刷新时间显示
var refreshMsLblDom = document.querySelector('#refreshMsLbl')
// 刷新时间设置
var refreshMsIptDom = document.querySelector('#refreshMsIpt')
// 切换是否运行
var toggleRunningBtn = document.querySelector('#toggleRunningBtn')

refreshMsIptDom.addEventListener('input',function(e){
    var _this = this;
    refreshMsLblDom.innerText = _this.value
    bg.setRefreshMsTime(_this.value)
})
toggleRunningBtn.addEventListener('click',function(e){
    bg.toggleRefresh()
    renderRunning()
})

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

/********************执行********************/

// 初始化获取变量
renderRefreshMsTime()
renderRunning()

