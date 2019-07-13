/**
 * 鼠标按下或抬起, 先执行浏览器默认的行为: "拖蓝"渲染或移除, 而后再执行脚本
 */
$(function(){
    /**
     * 关于如何判定当前是否有文本处于选中状态
     * Google搜索, 然后在StackOverflow中逛了一圈, 网友们说没有现成的API, 会不会很惊讶, 不过网友们提供了几种方案:
     * 第一种: 监听鼠标抬起mouseup事件
     * 第二种: 监听键盘键位抬起keyup事件
     * 第三种: onselectionchange事件, 不过这个事件太灵敏, 但是可以配合keyup使用
     * 第四种: onselect事件，这个事件仅能用于<input type="text"> 或 <textarea>这两种元素
     * 注: Firefox是可以点击任意文本然后通过键盘shift+方向键来选中文本的, 这样也可以需要考虑. 还可以研究下移动设备的浏览器支持情况.
     * 参考链接和(或)搜索过程
     * 1. Google Search - javascript text selection event
     * 2. https://stackoverflow.com/a/3545073 (2010年的回答了，现在已经2019年了)
     * 3. [Keyboard selection] https://stackoverflow.com/questions/3545018/selected-text-event-trigger-in-javascript#comment3713463_3545073
     * 4. [2019年的评论: selectionchange event] https://stackoverflow.com/questions/3545018/selected-text-event-trigger-in-javascript#comment95687289_3545073
     * 5. https://developer.mozilla.org/en-US/docs/Web/API/Document/selectionchange_event
     * 6. https://web.archive.org/web/20121221172621/http://mark.koli.ch/2009/09/use-javascript-and-jquery-to-get-user-selected-text.html
     * 7. [2013年的一个网友指出onselectionchange事件 https://stackoverflow.com/a/4367567]
     * 最终结论: 就2019年的前端技术，我打算采用"第一种: 监听鼠标抬起mouseup事件"就可以满足我现在的需求，因为我现在是在桌面电脑的浏览器的需求。(但是，
     * 如果有时间我应该考虑接合四种这样更全面。而且，后续如果有新的技术出来，那就再考虑用新的技术。)
     *
     * Popover控件删除: 鼠标按下即检查是否有Popover控件, 有则清除Popover控件
     * Popover控件生成: 鼠标抬起(或称鼠标松开)即检查是否有文本处于选中状态, 有则生成Popover控件 (文本选中事件, 用鼠标抬起事件来判定，这是目前采用的判定方法)
     * mouseup鼠标抬起，首先检查是否有Popover控件, 有则清除Popover控件，然后setTimeout在1ms后再检查是否有文本处于选中状态,
     * 有则生成Popover控件(文本选中事件, 用鼠标抬起事件来判定，这是目前采用的判定方法)
     * popover我要达到的效果是：只要页面有文中选中，鼠标抬起时就生成popover；只要页面有popover，无论是否通过drag-and-drop操作后残留文本选中高亮，popover不会消失
     *
     * 有三种情况要注意，其实这三种情况本质是一种，重现这三种问题：
     * 1. 选中一个文本段落的中间任意部分
     * 2. 段落开头
     * 3. 段落结尾，如果有空格，比如说是英文的段落。
     * 这三种情况的本质是:
     * 文本选中，然后在文本选中区域按下鼠标但是不释放，此时文本选中状态是不会消失的；只有在鼠标释放时，文本选中状态才会消失
     * 目前我想到的方法是把代码放入函数中，然后把函数放入timeout中，使得当鼠标抬起时先去执行清空高亮，这是我的想法，不知具体实施会怎样。
     * （暂时先不管这个小bug。而且我发现
     *
     * 选中文本，在选中文本的区域按下鼠标但不抬起鼠标，鼠标停留一会儿，然后就可以移动文本了，在Mac的WebStorm和印象笔记都试验成功。难道要
     * 在mouseup之前监听mouseover么）
     */

    /* Popover控件删除 */
    $(document).mousedown(function(){
        setTimeout(function () {
            mdown();
        }, 150);
    });

    /* Popover控件生成 */
    $(document).mouseup(function(){
        setTimeout(function () {
            mup()
        }, 100);
    });
});


/**
 * 鼠标按下
 */
function mdown() {
    /*
     * 需要判定的情况是点击当前页面已有的高亮时，按下鼠标是不会清除高亮状态的
     */

    let sel = window.getSelection();
    // Selection的anchorNode和focusNode都可能为null, 比如当选中的文本是iframe时 (请参阅 https://developer.mozilla.org/en-US/docs/Web/API/Selection),
    // 再比如有一次我在调试时无意的也打印出为null的情形不过现在难以复现。至于如果选取的是iframe的内容那该怎么办? 这个问题, 后面再考虑, 至少要给用户提示, 然后给一个选项让
    // 用户手动添加
    if (sel.isCollapsed || sel.anchorNode === null || sel.focusNode === null) {
        removePopover();
    }
}


/**
 * 鼠标抬起
 */
function mup() {
    /*
     * 首先在默认位置即页面最下方生成popover, 然后再重新放置popover
     *
     * 为什么不先确定popover的位置再生成? 因为不生成则无法获取到popover的宽高, 进而以致无
     * 法在角落里调整popover的位置, 也就是不先生成popover获取到宽高.
     * 注: 在css样式中设定popover显示方式为"absolute", "inline-block", 这样就可以设定
     * popover宽度为实际足够宽度, 而不会横跨整个浏览器的宽度
     *
     * 为什么鼠标抬起时需要检测是否有内容? 场景: 页面有选中内容, 然后去点击选中的内容，在鼠
     * 标抬起时，高亮会消失，此时根据popover跟随selection原则，应该删除掉Popover
     */

    /* 拦截: 鼠标只是点击而未选取内容、鼠标选取的是诸如iframe的内容 */
    let sel = window.getSelection();
    // Selection的anchorNode和focusNode都可能为null, 比如当选中的文本是iframe时 (请参阅 https://developer.mozilla.org/en-US/docs/Web/API/Selection),
    // 再比如有一次我在调试时无意的也打印出为null的情形不过现在难以复现。至于如果选取的是iframe的内容那该怎么办? 这个问题, 后面再考虑, 至少要给用户提示, 然后给一个选项让
    // 用户手动添加
    if (sel.isCollapsed || sel.anchorNode === null || sel.focusNode === null) {
        removePopover();
        return;
    }

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
}


/**
 * 删除 Popover
 */
function removePopover() {
    let po = $("#selection-popover")[0]; // 每次都是仅有一个Popover存在
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

    /* 根据光标移动的方向, 判定popover的位置 */
    let left, right, bottom, top;
    let popover = document.getElementById("selection-popover");
    let popoverHeight = $(popover).outerHeight();
    // if 鼠标向左选中内容, else 鼠标向右选中内容
    if (backward) {
        // 处理边界条件: 选择的终点位置是介于一个段落和另一个段落之间的空白时
        if (sel.focusOffset === focusNode.length) {
            let boundaryNode = sel.focusNode.parentNode.nextElementSibling.childNodes[0];
            range.setStart(boundaryNode, 0);
            range.setEnd(boundaryNode, 0);
            rect = range.getBoundingClientRect();
        }
        left = rect.left + pageXOffset;
        top = rect.top - popoverHeight + pageYOffset;
        return {left: left, top: top};
    } else {
        // 处理边界条件: 选择的终点位置是介于一个段落和另一个段落之间的空白时
        if (sel.focusOffset === 0) {
            let boundaryNode = window.getSelection().focusNode.previousElementSibling.lastChild;
            range.setStart(boundaryNode, boundaryNode.length);
            range.setEnd(boundaryNode, boundaryNode.length);
            rect = range.getBoundingClientRect();
        }
        left = rect.right;
        top = rect.bottom + pageYOffset;
        return {left: left, top: top};
    }
}
