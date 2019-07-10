/**
 * Popover控件的生成与删除
 * Popover控件删除: 鼠标按下即检查是否有Popover控件, 有则清除Popover控件
 * Popover控件生成: 鼠标抬起(或称鼠标松开)即检查是否有文本处于选中状态, 有则生成Popover控件(文本选中事件, 用鼠标抬起事件来判定，这是目前采用的判定方法)
 *
 * 关于如何判定当前是否有文本处于选中状态
 * Google搜索, 然后在StackOverflow中逛了一圈, 网友们说没有现成的API, 会不会很惊讶, 不过网友们提供了几种方案:
 * 第一种: 监听鼠标抬起mouseup事件
 * 第二种: 监听键盘键位抬起keyup事件
 * 第三种: onselectionchange事件, 不过这个事件太灵敏, 但是可以配合keyup使用
 * 第四种: onselect事件，这个事件仅能用于<input type="text"> 或 <textarea>这两种元素
 * 注: Firefox是可以点击任意文本然后通过键盘shift+方向键来选中文本的, 这样也可以需要考虑. 还可以研究下移动设备的浏览器支持情况.
 * 参考链接和(或)搜索过程
 *   1. Google Search - javascript text selection event
 *   2. https://stackoverflow.com/a/3545073 (2010年的回答了，现在已经2019年了)
 *   3. [Keyboard selection] https://stackoverflow.com/questions/3545018/selected-text-event-trigger-in-javascript#comment3713463_3545073
 *   4. [2019年的评论: selectionchange event] https://stackoverflow.com/questions/3545018/selected-text-event-trigger-in-javascript#comment95687289_3545073
 *   5. https://developer.mozilla.org/en-US/docs/Web/API/Document/selectionchange_event
 *   6. https://web.archive.org/web/20121221172621/http://mark.koli.ch/2009/09/use-javascript-and-jquery-to-get-user-selected-text.html
 *   7. [2013年的一个网友指出onselectionchange事件 https://stackoverflow.com/a/4367567]
 * 最终结论:
 *   就2019年的前端技术，我打算采用"第一种: 监听鼠标抬起mouseup事件"就可以满足我现在的需求，因为我现在是在桌面电脑的浏览器的需求。(但是，
 *   如果有时间我应该考虑接合四种这样更全面。而且，后续如果有新的技术出来，那就再考虑用新的技术。)
 */
$(function(){
    /* Popover控件删除: 鼠标按下即检查是否有Popover控件, 有则清除Popover控件 */


    /* Popover控件生成: 鼠标抬起(或称鼠标松开)即检查是否有文本处于选中状态, 有则生成Popover控件 (文本选中事件, 用鼠标抬起事件来判定，这是目前采用的判定方法)*/
    // 有三种情况要注意，其实这三种情况本质是一种，重现这三种问题：
    //    1. 选中一个文本段落的中间任意部分
    //    2. 段落开头
    //    3. 段落结尾，如果有空格，比如说是英文的段落。
    // 这三种情况的本质是:
    //    文本选中，然后在文本选中区域按下鼠标但是不释放，此时文本选中状态是不会消失的；只有在鼠标释放时，文本选中状态才会消失
    //    目前我想到的方法是把代码放入函数中，然后把函数放入timeout中，使得当鼠标抬起时先去执行清空高亮，这是我的想法，不知具体实施会怎样。
    //   （暂时先不管这个小bug。而且我发现选中文本，在选中文本的区域按下鼠标但不抬起鼠标，鼠标停留一会儿，然后就可以移动文本了，在Mac的WebStorm和印象笔记都试验成功。难道要
    //    在mouseup之前监听mouseover么）
    $(document).bind('mouseup', function(){

        let po = $("#selection-popover")[0]; // 每次都是仅有一个Popover存在
        if (po !== undefined) {
            po.parentNode.removeChild(po);
        }

        /* 设置Popover空间的放置位置为光标结束位置 */
        /* 判定鼠标光标选中内容时的方向, 参考: https://stackoverflow.com/a/23512678 */
        let sel = window.getSelection();
        console.log(sel);
        if (sel.isCollapsed) {
            return;
        }
        let position = sel.anchorNode.compareDocumentPosition(sel.focusNode);
        // position == 0 if nodes are the same; position === Node.DOCUMENT_POSITION_PRECEDING === 2 表示节点比较结果为"在前"
        let backward;
        if ((!position && sel.anchorOffset > sel.focusOffset) || (position === Node.DOCUMENT_POSITION_PRECEDING)) {
            backward = true;
        } else {
            backward = false;
        }

        /* 用一个"range"去罩住选中的光标终点(终点是focus, 起点是anchor)*/
        let range = document.createRange();
        let focusNode = window.getSelection().focusNode; // let node = window.getSelection().anchorNode.parentNode;
        range.setStart(focusNode, sel.focusOffset); // node和offset
        range.setEnd(focusNode, sel.focusOffset); // node和offset
        let rects = range.getClientRects();

        /* 创建弹框 (创建Popover) */
        let popover = document.createElement("div");
        $(popover).attr("id", "selection-popover");
        popover.innerHTML = "<div class='circle-red circle'></div></div><div class='circle-green circle'></div><div class='circle-yellow circle'>";

        /* 确定Popover的位置坐标 x, y 的值*/
        let x;
        let y;
        /* 向上移动鼠标来选中内容 */
        if (backward) {
            /* 有一个边界条件需要单独处理: 选择的终点位置是介于一个段落和另一个段落之间的空白时 */
            if (sel.focusOffset === focusNode.length) {
                let boundaryNode = window.getSelection().focusNode.parentNode.nextElementSibling.childNodes[0];
                range.setStart(boundaryNode, 0);
                range.setEnd(boundaryNode, 0);
                rects = range.getClientRects();
                x = rects[0].x + pageXOffset;
                y = rects[0].y + pageYOffset - 40; // 40px是任选的, 只要不遮挡即可
                console.log("focusOffset equals node length.");
                console.log(x, y);
                /* 非边界条件的情况 */
            } else {
                x = rects[0].x + pageXOffset;
                y = rects[0].y + pageYOffset - 40; // 40px是任选的, 只要不遮挡即可
                console.log(x, y);
            }
            /* 向下移动鼠标来选中内容 */
        } else {
            /* 有一个边界条件需要单独处理: 选择的终点位置是介于一个段落和另一个段落之间的空白时 */
            if (sel.focusOffset === 0) {
                let boundaryNode = window.getSelection().focusNode.previousElementSibling.lastChild;
                range.setStart(boundaryNode, boundaryNode.length);
                range.setEnd(boundaryNode, boundaryNode.length);
                rects = range.getClientRects();
                x = rects[0].x + pageXOffset;
                y = rects[0].y + pageYOffset + 20; // 20px也是任选的, 只要不遮挡即可
                console.log("focusOffset equals 0.");
                console.log(x, y);
                /* 非边界条件的情况 */
            } else {
                x = rects[0].x + pageXOffset;
                y = rects[0].y + pageYOffset + 20; // 20px也是任选的, 只要不遮挡即可
                // console.log(x, y);
            }
        }
        $(popover).css({
            "left": x + "px",
            "top": y + "px",
            position: "absolute",
            display: "inline-block"
        });

        /* 创建Popover, 具体操作是在Body底部, 追加元素popover*/
        $(popover).hide().appendTo("body").fadeIn(100); // jQuery fade in effect
        // console.log(sel.toString());
    });
});
