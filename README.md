# 目前兼容的模式

1. mouse only 来选中文本
2. mouse + click 来选中文本

(点击Popover即消失)

# 目前未兼容的模式

1. Keyboard only (shiftKey [+ optionKey ]+ arrowKey). 既是未兼容的模式, 也是不打算实现的模式, Keep it simple, stupid.
2. Popover不可跟踪iframe的文本高亮

# 其他软件的实现

1. Chrome extension: Google Translate用的是display: absolute, 也不兼容Keyboard only来选中文本. 我的基本同这个. 
2. Weava Highlighter使用iframe实现的, 而且部分兼容Keyboard only来选中文本, 部分兼容指的是只跟随一边
