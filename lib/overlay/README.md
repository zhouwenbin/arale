
# Overlay

基础浮层组件，提供浮层显示隐藏、dom结构自定义、定位和select遮挡等特性。

---

## 模块依赖

 - [seajs](seajs/README.md)
 - [jquery](jquery/README.md)
 - [position](position/README.md)


## API说明

* `element` {element} 

	页面dom节点。

* `template` {string}

	浮层容器的模板，如'\<div class="myoverlay">\</div>'。

* `zIndex` {string|number}

	浮层的z-index属性。

* `width` {string|number}

	浮层宽度(px)。

* `height` {string|number}

	浮层高度(px)。

* `parentNode` {element}

	浮层的父元素，默认为document.body。

* `pinOffset` {object}

	当前节点的定位点对象，如：{x:0, y:0}。

* `relativeObj` {object}

	基准元素及其定位点对象，如{elem:b, x:10, y:10}。

	这块的定位原理可参照arale.position组件的pin方法。

* `render()` 

	生成浮层的dom结构和样式并插入文档流。

* `setStyles(styles)` 

	设定浮层元素的样式值。

* `show()` 

	显示浮层。

* `hide()` 

	隐藏浮层。


## 最佳实践

1. 直接使用：

		var overlay = [new] Overlay({
			srcNode : $('#testElem')[0],
			width : 300,
			height : 100,
			x : 50,
			y : 50,
			zIndex : 99
		});
		overlay.render().show();
	
	或者
	
		var overlay = [new] Overlay({
			id : 'testElem',
			tpl : '<div class="myoverlay"></div>',
			content : '初始内容',
			parentNode : document.body,
			height : 100,
			x : 50,
			y : 50,
			zIndex : 99
		});
		overlay.setContent('内容变化了。');
		overlay.render().show();

2. 继承使用：

		var overlay = require('overlay');
		var dialog = overlay.extend({
			initialize: function(options) {
                this.setOptions(options);
        	},
        	close: function() {
        		this.closable && this.superclass.hide();
        	}
		});


