---
title: Hexo NexT 博客增加瀑布流相册页面
categories:
  - 随手记
tags:
  - JavaScript
  - blog
  - 技术
date: '2018-06-11 12:24:01'
sticky: 0
mathjax: false
comments: true
---

要展示自己拍摄的照片，可以给博客添加一个瀑布流的相册页面。本文基于 Hexo 3.9.0 / NexT 7.3.0，参考了 [asdfv1929 的方法](https://asdfv1929.github.io/2018/05/26/next-add-photos/)。<!-- more -->

## 1. json 文件处理图片信息
在博客根目录的 `/scripts/` 文件夹下新建一个 `phototool.js` 文件，内容如下。主要功能是访问照片文件夹，获取每张照片的大小和文件名，并生成对应的 `json` 文件：

```js /scripts/phototool.js
"use strict";
    const fs = require("fs");
    const sizeOf = require('image-size');
    //本地照片所在目录
    const path = "source/photos/images"; 
    //要放置生成的照片信息文件目录，建议直接放在 source/photos/ 文件夹下
    const output = "source/photos/photoslist.json";
    var dimensions;
    fs.readdir(path, function (err, files) {
        if (err) {
            return;
        }
        let arr = [];
        (function iterator(index) {
            if (index == files.length) {
                fs.writeFileSync(output, JSON.stringify(arr, null, "\t"));
                return;
            }
            fs.stat(path + "/" + files[index], function (err, stats) {
                if (err) {
                    return;
                }
                if (stats.isFile()) {
                    dimensions = sizeOf(path + "/" + files[index]);
                    console.log(dimensions.width, dimensions.height);
                    arr.push(dimensions.width + '.' + dimensions.height + ' ' + files[index]);
                }
                iterator(index + 1);
            })
        }(0));
    });
```

创建好并把照片放在目录后，执行以下命令：

```sh
cd <folder-path>  #定位到 Hexo 博客目录
npm install image-size --save #如果已安装了 image-size 可以跳过
node scripts/phototool.js  #生成对应的 json 文件
```

`node scripts/phototool.js` 这个步骤以后可以不用手动执行，每次 `hexo s` 或者 `hexo deploy` 时候会被自动执行。如果报错，请注意检查保存本地照片的文件夹里有没有非图片类文件，特别是要删除如 `.DS_Store` 这样的隐藏文件。`json` 文件样例如下：

```json /source/photos/photoslist.json
[
	"4032.3024 IMG_0391.JPG",
	"12500.3874 IMG_0404.JPG",
	"4032.3024 IMG_0416.JPG",
	"4032.3024 IMG_0424.JPG",
]
```

## 2. 加载 js 文件和配置样式

首先，在 `/source/js/` 目录下创建 `photo.js`：

```js /source/js/photo.js
photo ={
    page: 1,
    //offset 用于设置照片数量的上限
    offset: 100,
    init: function () {
        var that = this;
        //这里设置的是刚才生成的 json 文件路径
        $.getJSON("/photos/photoslist.json", function (data) {
            that.render(that.page, data);
            //that.scroll(data);
        });
    },
    render: function (page, data) {
        var begin = (page - 1) * this.offset;
        var end = page * this.offset;
        if (begin >= data.length) return;
        var html, imgNameWithPattern, imgName, imageSize, imageX, imageY, li = "";
        for (var i = begin; i < end && i < data.length; i++) {
           imgNameWithPattern = data[i].split(' ')[1];
           imgName = imgNameWithPattern.split('.')[0]
           imageSize = data[i].split(' ')[0];
           imageX = imageSize.split('.')[0];
           imageY = imageSize.split('.')[1];
           //这里 250 指的是图片的宽度，可以根据自己的需要调整相册中照片的大小
            li += '<div class="card" style="width:250px">' +
                    '<div class="ImageInCard" style="height:'+ 250 * imageY / imageX + 'px">' +
                    //href 和 src 的链接地址是相册照片外部链接，也可以放博客目录里
                      '<a data-fancybox="gallery" href="/photos/images/' + imgNameWithPattern + '?raw=true" data-caption="' + imgName + '">' +
                        '<img srcset="/photos/' + imgNameWithPattern + '?raw=true" src="/photos/' + imgNameWithPattern + '?raw=true"/>' +
                      '</a>' +
                    '</div>' +
                    // '<div class="TextInCard">' + imgName + '</div>' +  //图片下显示文件名作为说明的功能
                  '</div>'
        }
        $(".ImageGrid").append(li);
        //$(".ImageGrid").lazyload();
        this.minigrid();
    },
    minigrid: function() {
        var grid = new Minigrid({
            container: '.ImageGrid',
            item: '.card',
            gutter: 12
        });
        grid.mount();
        $(window).resize(function() {
           grid.mount();
        });
    }
}
photo.init();
```

然后，在 `/source/_data/` 下创建 `body-end.swig` 文件，并添加如下代码：

```html /source/_data/body-end.swig
{% if page.type ==='picture' %}
  <script src="//cdn.jsdelivr.net/npm/minigrid@3.1.1/dist/minigrid.min.js"></script>
  <script src="/js/photo.js"></script>
{% endif %}
```

在主题 CSS 自定义文件中设置好相册的样式：

```css /source/_data/styles.styl
.ImageGrid {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  text-align: center;
}
.card {
  overflow: hidden;
  transition: .3s ease-in-out;
  border-radius: 8px;
  background-color: #ddd;
}
.ImageInCard img {
  padding: 0 0 0 0;
  border-radius: 8px;
}
```

因为这里利用到了主题注入功能，所以需要在**主题配置文件**启用该功能：

```diff /themes/next/_config.yml
 custom_file_path:
-  #bodyEnd: source/_data/body-end.swig
+  bodyEnd: source/_data/body-end.swig
-  #style: source/_data/styles.styl
+  style: source/_data/styles.styl
```

## 4. 开启 lazyload 和 fancybox
在主题配置文件中，一步一步按照说明安装和开启 `lazyload` 和 `fancybox` 功能即可。

## 5. 放入相册
新建相册页面 ` hexo new page photos`，创建  `/source/photos/index.md`。编辑文档为以下内容：

```markdown /source/photos/index.md
---
title: 相册
type: picture
comments: true
---

<div class="ImageGrid"></div>

```

在**主题配置文件**中的 `menu` 添加如下内容可以添加导航菜单：

```diff /themes/next/_config.yml
 menu:
+  photos: /photos || camera-retro
```
