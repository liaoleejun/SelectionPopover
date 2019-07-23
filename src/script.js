/**
 * 说明: 定义鼠标按下移除popover、抬起或拖拽时生成popover, 定义popover的坐标位置
 *
 *
 * 0. 想要达到的效果
 * 本来的设想是就是跟随Selection, 发现实现起来复杂, 而且掌握起来也是逻辑不那么清
 * 晰, 所以现在采用: 鼠标按下统一删除 Popover, 鼠标抬起或鼠标拖拽结束时生成 Popover
 *
 *
 * 1. JS脚本的同步与异步
 * 由于JS的脚本是单线程的同步操作，所以操作是要分前后的
 *
 *
 * 2. addEventListener('mousedown', function(){})与浏览器默认行为执行顺序
 * 按下鼠标会先执行document.addEventListener("mousedown", function (){})
 * 的函数体, 再去执行浏览器默认行为比如清除文本拖蓝。mouseup和mousedown都是默认
 * 是先执行用户写的脚本, 再执行浏览器默认行为。请查看我的实验证明。
 *
 *
 * 3. Window.getSelection()
 * The Window.getSelection() method returns a Selection object
 * representing the range of text selected by the user or the current
 * position of the caret. 参考自:
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection
 * 如果想用addEventListener("mousedown", function (){})去证明,需要使用
 * setTimeout，请查看我的实验证明的README.md, 加setTimeout的缘由。
 *
 * Window.getSelection()返回的type只有三种: None, Caret, Range. 参考自:
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection/type
 * 就是说没有选中任何东西、选中了一个caret、选中了一个range范围这三种
 *
 * 什么时候window.getSelection.type会为None?
 * Chrome目前发现两种情况, 一种是首次打开页面, 没有做任何操作时, 此时
 * window.getSelection.type为None, 另一种是当页面有Selection且这个selection
 * 不是iframe里面的selection, 这时点击这个Selection, 抬起鼠标后,
 * window.getSelection.type就是None，值得指出的是，页面非iframe的拖蓝选中时如
 * 果点击的是空白页而不是这个selection则window.getSelection.type为Caret
 * Firefox目前只发现一种情况, 即是首次打开页面时
 *
 *
 * 4. "draggable" global attribute
 * draggable的取值只有三个: true, false, auto
 * 如果某元素的draggable属性设置为true即draggable="true", 那么该元素可拖拽, 如
 * 果某元素的draggable属性设置为false即draggable="false", 那么该元素不可拖拽
 * 如果draggable这个属性没有被设置, 那么它的默认值是auto, 这意味着拖拽行为遵循浏
 * 览器的默认行为: 只有文本选择、图片、链接可以被拖拽. 参考自:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable
 *
 *
 * 5. 鼠标按下, 要么选取, 要么拖拽, 二者之一
 * 如果拖拽, 那么选取的范围不变, 任何时候都可以window.getSelection(),
 * window.getSelection()和mouseup、mousedown无关, 无论是处于鼠标按下还是鼠标
 * 抬起，还是鼠标当前没有任何操作, 均可以window.getSelection()
 *
 * 一种是是can be selected，另外一种是can be dragged. 一种用于选取，一种用于拖
 * 拽. 按下鼠标，接下来的操作可分为两种，一种是拖蓝，一种是拖拽。拖蓝就是拖动鼠标来
 * 选中文本，因为文本选中时是默认是蓝色，所以俗称为拖蓝。拖拽是指在按下鼠标时光标指
 * 向的页面内容是可拖拽的，哪些页面内容可拖拽请查看上述第4点
 *
 *
 * 6. 鼠标按下的那一刻, 如何判定按下的位置的内容是否是Draggable
 * 按下鼠标的时候window.getSelection没有变化即为点击draggable的东西了
 *
 *
 * 7. 在可拖拽内容处: 按下鼠标, range范围不会变
 *
 *
 * 8. 拖拽后抬起鼠标, 不会触发mouseup事件
 *
 *
 * 9. mouseup事件setTimeout的缘由
 * 如果不用setTimeout的话, 默认是先执行JS脚本, 再执行浏览器默认行为, 这导致一个
 * 问题, 当页面有文本处于选中拖蓝状态, 这时在选中拖蓝处按下鼠标然后抬起鼠标, 浏览器
 * 默认行为是取消选中拖蓝状态, 但是是在JS脚本执行之后, 此时选中拖蓝还在还没删除,
 * 就会生成 Popover, 但是之后执行浏览器默认行为又会把选中拖蓝删除, 这样最终导致的
 * 结果是: 页面上没有选中拖蓝, 但是有一个 Popover
 *
 *
 * 10. 四个很奇怪的地方的解释
 *
 * 为什么Google Chrome点击翻译扩展弹出的icon时, 拖蓝没有消失
 * 答: 具体原因不确定, 因为谷歌的翻译扩展源代码太长, 我不知怎么调试. 但是, 我看到
 * 其源代码中有几个JS文件有preventDefault函数, 所以我猜测可能是preventDefault
 * 起作用.
 *
 * 为什么我写的Popover点击圆圈时, 拖蓝不消失 (现已修复)
 * 答: 因为我写的逻辑是, 鼠标按下立即执行我的JS逻辑, 浏览器默认行为在我的JS执行完
 * 毕后才会执行. 而我的JS逻辑是在圆圈处按下鼠标时删除id为"selection-popover"的
 * 元素, 而这个id为"selection-popover"的元素是圆圈的父元素, 鼠标按下之处父元素
 * 被删除了, 这样mousedown当前的位置就找不到了, 而mousedown当前的位置找不到, 这
 * 样就不被认为是一个正常的mousedown事件, 不被认为是一个正常的mousedown事件就导
 * 致不执行浏览器默认的mousedown行为. 如何支撑我这个论断, 我做了两个实验来支撑我
 * 的猜想, 第一个实验就是把removePopover()函数体注释掉即不执行删除操作只是留个函
 * 数壳子, 然后发现点击点击圆圈时, 高亮消失. 第二个实验就是监听mousedown加上
 * setTimeout(function(){}, 0) 然后发现点击点击圆圈时, 高亮消失. 基于这两个实
 * 验, 我有了上述猜想.
 *
 * 为什么点击Popover之内圆圈之外, 拖蓝会消失 (现已修复)
 * 答: 因为按下鼠标后立即删除id为"selection-popover"的元素, 因为删除的是本元素
 * 而不是父元素, 不会有上一个解释中的"mousedown当前的位置就找不到"的问题,那么就会
 * 接下来继续执行浏览器mousedown的默认行为进而把高亮删除.
 *
 * 为什么有时点击圆圈: Popover消失, 拖蓝也消失 (现已修复)
 * 答: 我怀疑是有时mousedown后, 手发生轻微抖动发生偏移, 这样就发生mousemove事件,
 * 而发生mousemove事件删除了高亮. 这个猜想比较难做复现追踪试验, 我做了个试验, 就
 * 是监听mousemove事件, 但是没有追踪到, 不想浪费时间在这个方面了, 以后有时间再研
 * 究下. 反正, 如果依靠这点来设计一个点击后依然存在于屏幕的逻辑, 那么将是一个非常
 * 不好的设计, 因为容易产生误操作.
 *
 *
 * 11. 目前想到的没有去做的, 可能也是不打算做的
 * 没有考虑shift+键盘选中的逻辑, 其实我不打算做了, 我打算先keep it stupid
 */


/** 监听鼠标按下 */
$(document).on('mousedown', function () {
    /* setTimeout的作用是使得拖蓝消失, 详细原因请参考上述说明第10条的第二点 */
    setTimeout(function () {
        removePopover();
    }, 0);
});


/** 监听鼠标抬起、鼠标拖拽结束 */
$(document).on('mouseup dragend', function (e) {
    let mouseupScreenX = e.screenX;

    /* 设置 setTimeout, 原因见上述说明第9条 */
    setTimeout(function () {
        /* 鼠标只是点击了页面空白处而没有选中任何内容, 不要生成 Popover*/
        let sel = window.getSelection();
        if (sel.isCollapsed) {
            return;
        }

        /* 创建Popover */
        createPopover();

        /* 确定位置 */
        let popover = document.getElementById("selection-popover");
        let position = determinePopover(mouseupScreenX);

        /* 设定位置 */
        if (position.left !== undefined) {
            popover.style.left = position.left + "px";
        }
        if (position.right !== undefined) {
            popover.style.right = position.right + "px";
        }
        if (position.top !== undefined) {
            popover.style.top = position.top + "px";
        }
        if (position.bottom !== undefined) {
            popover.style.bottom = position.bottom + "px";
        }
    }, 0)
});


/** 删除 Popover */
function removePopover() {
    let po = $("#selection-popover")[0];
    if (po !== undefined) {
        po.parentNode.removeChild(po);
    }
}


/** 创建 Popover */
function createPopover() {
    /* 生成 Popover */
    let popover = document.createElement("div");
    popover.setAttribute("id", "selection-popover");
    popover.innerHTML = "<div data-hl-color='color1' class='popover-circle'></div><div data-hl-color='color2' class='popover-circle'></div><div data-hl-color='color3' class='popover-circle'></div>";
    $(popover).hide().appendTo("body").fadeIn(80); // popover弹框追加到body, 显示效果: jQuery fade in effect
}


/**
 * 确定 Popover 的位置
 * @param mouseupScreenX
 * @returns {{top: number, left: (*|number)}}
 */
function determinePopover(mouseupScreenX) {
    /*
     * popover弹框的位置, 有几个好原则:
     * 1. 尽量不要遮挡选中文字,
     * 2. 选中文字后, 鼠标移动最少
     * 3. 标记选中的结束点
     * 但是这些原则可能不能同时全部满足, 现在的做法是采用谷歌翻译扩展的做法, mouseup的x轴
     * 坐标作为popover的position的left, 而window.getSelection().getRangeAt(0).getBoundingClientRect()
     * 作为popover的position的top, 鼠标正向即向右选中内容, popover放在BoundingClientRect
     * 的下方, 鼠标反向即向左选中内容, popover放在BoundingClientRect的上方。值得注意的
     * 是, 判定鼠标选中文本时的方向只能通过Selection对象, 不能通过Selection.getRangeAt(0)
     * 的Range对象, 因为Range对象只有startContainer和endContainer, 这两者无法判定鼠标
     * 移动方向, 没有Selection对象的anchorNode和focusNode
     *
     * 以前的做法是采用紧跟着最后一个字符作为放置popover的参考点, 但是有两个问题, 第一是当
     * 三击时, 可能会需要移动鼠标很远来到达popover, 第二是目前我还不能完全有把握设计一个找
     * 到最后一个字符的方法, HTML文档的文本节点情况可能比我想的复杂, 为了让用户选择文本后,
     * 百分之一百会正确的弹出popover是第一位. 以前我用一个"range"去罩住focusNode的最后一
     * 个字符, 但是如果文本节点可能是N个回车加上M个空格, N大于等于1, M也是大于等于1, 就是
     * 一个在页面不会显示的节点 (关于节点和HTML源码的关系, 请查看我的印象笔记的
     * "DOM Tree & Node"). 所以暂时用能实现的并且是可靠的方法实现. 现在采用的方法除了双击
     * 和三击不能标记结束点外, 其他情况都可以标记结束点
     *
     * Note:
     * - DomRect的left, right, bottom, top是以视口原点为参考原点 (视口就是显示网页文档
     *   的区域, 视口原点就是网页文档的最左上角)
     * - 样式的position的left, right, bottom, top是以视口的四边为参考边, 样式只需要这四个参数中的两个即可
     */

    let left = mouseupScreenX;
    let top;

    /* 本函数主要是处理选中文本, 所以range即可而不需selRange, 同理rect即可而不需selBoundingRect */
    let range = window.getSelection().getRangeAt(0);
    let rect = range.getBoundingClientRect();

    /* 获取popover尺寸 */
    let popover = document.getElementById("selection-popover");
    let popoverHeight = $(popover).outerHeight();
    let popoverWidth = $(popover).outerWidth();

    /* 根据选中文本时的光标移动方向, 判定Popover的位置. if 鼠标正向即向右选中内容, else 鼠标反向即向左选中内容 */
    if (isSelectionForward()) {
        top = rect.bottom + pageYOffset;
    } else {
        top = rect.top - popoverHeight + pageYOffset;
    }

    /* 当超过浏览器边缘时候, 调整Popover位置 */
    let windowSize = getWindowSize();
    if (top - pageYOffset < 0) {
        top = top + popoverHeight + rect.height;
    }
    if (top + popoverHeight > windowSize.h + pageYOffset) {
        top = top - popoverHeight - rect.height;
    }
    if (left + popoverWidth > windowSize.w) {
        left = windowSize.w - popoverWidth;
    }

    return {left: left, top: top};
}


/**
 * 判断选中文本时, 鼠标的移动方向是正向还是反向
 * @returns {boolean}
 */
function isSelectionForward() {
    /*
     * sel.anchorNode.compareDocumentPosition === 0 表示对比节点是同一节点;
     * sel.anchorNode.compareDocumentPosition === Node.DOCUMENT_POSITION_FOLLOWING === 4 表示对比节点位置"在后"
     * 判定鼠标光标选中内容时的方向, 代码参考: https://stackoverflow.com/a/23512678
     * 文档: https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
     */
    let sel = window.getSelection();
    let comparePosition = sel.anchorNode.compareDocumentPosition(sel.focusNode);
    return (comparePosition === 0 && sel.anchorOffset < sel.focusOffset) || (comparePosition === Node.DOCUMENT_POSITION_FOLLOWING);
}


/**
 * 获取浏览器文档窗口宽高
 * @returns {{w: number, h: number}}
 */
function getWindowSize() {
    let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    return {
        w: windowWidth,
        h: windowHeight
    }
}
