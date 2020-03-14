;var Utils = {
	/**
		解析模板并返回结果
		@param data {Object} 数据
		@param template {String} 模板字符串
		@returns {String} 解析后的字符串
	*/
	parseTemplate: function(data, template){
		var reg = /\${([^}]+)}/mg
		var result = template.replace(reg, function(match,variable){
			var value = data[variable]
			if(typeof value === "undefined"){
				return ""
			}else{
				return value
			}
		})
		return result
	}
}