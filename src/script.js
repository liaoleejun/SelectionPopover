/**
 * 鼠标按下时删除Popover, 鼠标抬起或鼠标拖拽结束时生成Popover
 */
$(function() {
    /**
     * 0. 想要达到的效果
     * 本来的设想是就是跟随Selection, 发现实现起来复杂, 而且掌握起来也是逻辑不那
     * 么清晰, 所以现在采用: 鼠标按下统一删除 Popover, 鼠标抬起或鼠标拖拽结束时
     * 生成 Popover
     *
     *
     * 1. JS脚本的同步与异步
     * 由于JS的脚本是单线程的同步操作，所以操作是要分前后的
     *
     *
     * 2. addEventListener('mousedown', function(){})与浏览器默认行为执行顺序
     * 按下鼠标会先执行document.addEventListener("mousedown", function (){})
     * 的函数体, 再去执行浏览器默认行为比如清除文本拖蓝。mouseup和mousedown都是
     * 默认是先执行用户写的脚本, 再执行浏览器默认行为。请查看我的实验证明。
     *
     *
     * 3. Window.getSelection()
     * The Window.getSelection() method returns a Selection object
     * representing the range of text selected by the user or the
     * current position of the caret. 参考自:
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
     * window.getSelection.type为None, 另一种是当页面有Selection且这个
     * selection不是iframe里面的selection, 这时点击这个Selection, 抬
     * 起鼠标后，window.getSelection.type就是None，值得指出的是，页面
     * 非iframe的拖蓝选中时如果点击的是空白页而不是这个selection则
     * window.getSelection.type为Caret
     * Firefox目前只发现一种情况, 即是首次打开页面时
     *
     *
     * 4. "draggable" global attribute
     * draggable的取值只有三个: true, false, auto
     * 如果某元素的draggable属性设置为true即draggable="true", 那么该元素可拖
     * 拽, 如果某元素的draggable属性设置为false即draggable="false", 那么该元
     * 素不可拖拽
     * 如果draggable这个属性没有被设置, 那么它的默认值是auto, 这意味着拖拽行为遵循浏览器的
     * 默认行为: 只有文本选择、图片、链接可以被拖拽. 参考自:
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable
     *
     *
     * 5. 鼠标按下, 要么选取, 要么拖拽, 二者之一
     * 如果拖拽, 那么选取的范围不变, 任何时候都可以window.getSelection(),
     * window.getSelection()和mouseup、mousedown无关, 无论是处于鼠标按下还是
     * 鼠标抬起，还是鼠标当前没有任何操作, 均可以window.getSelection()
     *
     * 一种是是can be selected，另外一种是can be dragged. 一种用于选取，一种用
     * 于拖拽. 按下鼠标，接下来的操作可分为两种，一种是拖蓝，一种是拖拽。拖蓝就是拖
     * 动鼠标来选中文本，因为文本选中时是默认是蓝色，所以俗称为拖蓝。拖拽是指在按下
     * 鼠标时光标指向的页面内容是可拖拽的，哪些页面内容可拖拽请
     * 查看 "4. "draggable" global attribute"
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
     * 如果不用setTimeout的话, 默认是先执行JS脚本, 再执行浏览器默认行为, 这导致
     * 一个问题, 当页面有文本处于选中拖蓝状态, 这时在选中拖蓝处按下鼠标然后抬起鼠
     * 标, 浏览器默认行为是取消选中拖蓝状态, 但是是在JS脚本执行之后, 此时选中拖蓝
     * 还在还没删除, 就会生成 Popover, 但是只有执行浏览器默认行为又会把选中拖蓝删
     * 除, 这样最终导致的结果是: 页面上没有选中拖蓝, 但是有一个 Popover
     *
     *
     * 10. 四个很奇怪的地方的解释
     *
     * 为什么Google Chrome点击翻译扩展弹出的icon时, 高亮没有消失
     * 答: 具体原因不确定, 因为谷歌的翻译扩展源代码太长, 我不知怎么调试. 但是, 我
     * 看到其源代码中有几个JS文件有preventDefault函数, 所以我猜测可能是
     * preventDefault起作用.
     *
     * 为什么我写的Popover点击圆圈时, 高亮不消失
     * 答: 因为我写的逻辑是, 鼠标按下立即执行我的JS逻辑, 浏览器默认行为在我的JS执
     * 行完毕后才会执行. 而我的JS逻辑是在圆圈处按下鼠标时删除id为"selection-popover"
     * 的元素, 而这个id为"selection-popover"的元素是圆圈的父元素, 鼠标按下之处
     * 父元素被删除了, 这样mousedown当前的位置就找不到了, 而mousedown当前的位置
     * 找不到, 这样就不被认为是一个正常的mousedown事件, 不被认为是一个正常的mousedown
     * 事件就导致不执行浏览器默认的mousedown行为. 如何支撑我这个论断, 我做了两个
     * 实验来支撑我的猜想, 第一个实验就是把removePopover()函数体注释掉即不执行删
     * 除操作只是留个函数壳子, 然后发现点击点击圆圈时, 高亮消失. 第二个实验就是监
     * 听mousedown加上setTimeout(function(){}, 0) 然后发现点击点击圆圈时, 高
     * 亮消失. 基于这两个实验, 我有了上述猜想.
     *
     * 为什么点击Popover之内, 但是圆圈之外, 高亮会消失
     * 答: 因为按下鼠标后立即删除id为"selection-popover"的元素, 因为删除的是本
     * 元素而不是父元素, 不会有上一个解释中的"mousedown当前的位置就找不到"的问题,
     * 那么就会接下来继续执行浏览器mousedown的默认行为进而把高亮删除.
     *
     * 为什么有时点击圆圈: Popover消失, 高亮也消失
     * 答: 我怀疑是有时mousedown后, 手发生轻微抖动发生偏移, 这样就发生mousemove
     * 事件, 而发生mousemove事件删除了高亮. 这个猜想比较难做复现追踪试验, 我做了
     * 个试验, 就是监听mousemove事件, 但是没有追踪到, 不想浪费时间在这个方面了,
     * 以后有时间再研究下. 反正, 如果依靠这点来设计一个点击后依然存在于屏幕的逻辑,
     * 那么将是一个非常不好的设计, 因为容易产生误操作.
     *
     *
     * 11. 目前想到的没有去做的, 可能也是不打算做的
     * 第一是没有考虑shift+鼠标选中的逻辑, 其实我不打算做了, 我打算先keep it stupid
     * 第二是Selection.anchorNode和Selection.focusNode可能是元素节点, 也可能
     * 是文本节点, determinePopover()函数没有考虑是文本节点的情况 (而且我经过调
     * 测, 发现选择文本时不会出现Selection.anchorNode或Selection.focusNode是
     * 文本节点的情况, 但是在两端之间的空白处点击时出现了Selection.anchorNode或
     * Selection.focusNode是文本节点的情况, 有点奇怪的感觉), 直接在mouseup和
     * dragend中用Selection.isCollapsed给挡掉了
     */


    /* 监听鼠标按下 */
    $(document).on('mousedown', function (e) {
        /* 当mousedown在Popover时, 不删除Popover */
        if ($(e.target).hasClass('circle') || e.target.id === "selection-popover") {
            // 如果不想消失高亮状态, 打开下面的代码
            // e.preventDefault();
            return;
        }
        setTimeout(function () {
            removePopover();
        }, 0);
    });


    /* 监听鼠标抬起 */
    $(document).on('mouseup dragend', function (e) {
        /* 当mouseup在Popover时, 不生成Popover */
        if ($(e.target).hasClass('circle') || e.target.id === "selection-popover") {
            return;
        }

        // 设置 setTimeout, 原因见上面第9条
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
            let position = determinePopover();

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
});


/**
 * 删除 Popover
 */
function removePopover() {
    let po = $("#selection-popover")[0];
    if (po !== undefined) {
        po.parentNode.removeChild(po);
    }
}


/**
 * 创建 Popover
 */
function createPopover() {
    /* 生成 Popover */
    let popover = document.createElement("div");
    popover.setAttribute("id", "selection-popover");
    popover.innerHTML = "<div class='circle-red circle'></div></div><div class='circle-green circle'></div><div class='circle-yellow circle'>";
    $(popover).hide().appendTo("body").fadeIn(80); // popover弹框追加到body, 显示效果: jQuery fade in effect
}


/**
 * 确定 Popover 的位置
 *
 * @returns {{top: number, left: number}}
 */
function determinePopover() {
    /*
     * popover弹框的位置, 选择出现在光标结束的位置, 这是比较自然的位置, 因为鼠标抬起
     * 时, 就可以立马去点击popover控件. 有几个问题需要注意:
     * Note: 不能遮挡选中文字
     * Note: DomRect和Position的left, right, bottom, top注意是不同的
     *
     * 获取鼠标选中内容, 并判定鼠标光标选中内容时的方向, 代码参考: https://stackoverflow.com/a/23512678
     * 为什么需要判定鼠标光标选中内容时的方向? 因为:
     * 如果向右移动鼠标来选中内容, 那么为了不遮挡文字鼠标出现在文字下方;
     * 如果向左移动鼠标来选中内容, 那么为了不遮挡文字鼠标出现在文字上方.
     * 注: 判定鼠标选中文本时的方向只能通过Selection对象, 不能通过Selection.getRangeAt(0)的Range对象, 因为Range对象只有
     * startContainer和endContainer, 这两者无法判定鼠标移动方向, 没有Selection对象的anchorNode和focusNode
     *
     * 获取光标选中文本结束时的位置
     * 为什么要获取光标选中文本结束时的位置? 因为在光标选中文本结束点放置popover弹框
     * 如何获取光标选中文本结束时的位置? 用一个"range"去罩住focusNode的第一个字符
     */

    /* 获取鼠标选中文本内容，光标结束点位置 */
    let sel = window.getSelection();
    let range = document.createRange();
    let focusNode = sel.focusNode;
    range.setStart(focusNode, sel.focusOffset);
    range.setEnd(focusNode, sel.focusOffset);
    let rect = range.getBoundingClientRect();

    /* 判定鼠标选中文本内容时，光标移动的方向 */
    let backward = (function () {
        // sel.anchorNode.compareDocumentPosition === 0 表示对比节点是同一节点;
        // sel.anchorNode.compareDocumentPosition === Node.DOCUMENT_POSITION_PRECEDING === 2 表示对比节点位置"在前"
        let comparePosition = sel.anchorNode.compareDocumentPosition(sel.focusNode);
        return (comparePosition === 0 && sel.anchorOffset > sel.focusOffset) || (comparePosition === Node.DOCUMENT_POSITION_PRECEDING);
    })();

    /* 根据选中文本时的光标移动方向, 判定Popover的位置 */
    let left;
    let top;
    let popover = document.getElementById("selection-popover");
    let popoverHeight = $(popover).outerHeight();
    let popoverWidth = $(popover).outerWidth();
    // if 鼠标向左选中内容, else 鼠标向右选中内容
    if (backward) {
        /* 处理边界条件: 选择的终点位置是介于一个段落和另一个段落之间的空白时 */
        if (sel.focusOffset === focusNode.length) {
            let boundaryNode = sel.focusNode.parentNode.nextElementSibling.childNodes[0];
            range.setStart(boundaryNode, 0);
            range.setEnd(boundaryNode, 0);
            rect = range.getBoundingClientRect();
        }
        left = rect.left + pageXOffset;
        top = rect.top - popoverHeight + pageYOffset;
    } else {
        /* 处理边界条件: 选择的终点位置是介于一个段落和另一个段落之间的空白时 */
        if (sel.focusOffset === 0) {
            let boundaryNode = sel.focusNode.previousElementSibling.lastChild;
            range.setStart(boundaryNode, boundaryNode.length);
            range.setEnd(boundaryNode, boundaryNode.length);
            rect = range.getBoundingClientRect();
        }
        left = rect.right;
        top = rect.bottom + pageYOffset;
    }

    /* 文字太靠近四条边时, Popover位置需要调整以防只能看到部分Popover */
    let windowSize = getWindowSize();
    if (top < 0) {
        top = top + popoverHeight + rect.height;
    }
    if (top + popoverHeight > windowSize.h) {
        top = top - popoverHeight - rect.height;
    }
    if (left + popoverWidth > windowSize.w) {
        left = windowSize.w - popoverWidth;
    }

    return {left: left, top: top};
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
