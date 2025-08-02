# lime-grid 宫格
- 宫格布局用于功能入口布局，将页面或特定区域切分成若干等大的区块，形成若干功能入口。uniapp/uniappx(h5,ios,安卓)
- 插件依赖`lime-style`,`lime-icon`,`lime-badge`,`lime-shared`,不喜勿下

## 安装
在插件市场导入即可，首次可能需要重新编译<br><br>
**注意** 
*  本插件依赖的[lime-svg](https://ext.dcloud.net.cn/plugin?id=18519)在 uniapp x app中是原生插件，如果购买(收费为5元)则需要自定义基座，才能使用！uniapp可忽略。
*  如果不需要[lime-svg](https://ext.dcloud.net.cn/plugin?id=18519)在lime-icon代码中注释掉即可

```html
// lime-icon/components/l-icon.uvue 第4行 注释掉即可。
<!-- <l-svg class="l-icon" :class="classes" :style="styles" :color="color" :src="iconUrl" v-else :web="web" @error="imageError" @load="imageload" @click="$emit('click')"></l-svg> -->
```

## 文档
[宫格](https://limex.qcoon.cn/components/grid.html)

## 代码演示
### 基础使用
通过`icon`属性设置格子内的图标，通过`image`属性设置格子图片，`text`属性设置文字内容。

```html
<l-grid>
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
	<l-grid-item text="最多五个字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
</l-grid>
```

### 自定义列数
默认一行展示四个格子，可以通过`column`自定义列数。

```html
<l-grid :column="5">
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
	<l-grid-item text="最多四字" image="https://tdesign.gtimg.com/mobile/demos/avatar5.png" />
</l-grid>
```

### 页面导航
可以通过`url`属性进行页面跳转，通过`openType`属性控制跳转类型。

```html
<l-grid :column="3">
	<l-grid-item text="跳到首页" url="/pages/index/index" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="跳到首页" url="/pages/index/index" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
	<l-grid-item text="跳到首页" url="/pages/index/index" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
</l-grid>
```

### 格子间距
通过`gutter`属性设置格子之间的距离。

```html
<l-grid :gutter="10">
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
</l-grid>
```

### 带描述宫格
通过`description`属性详细描述

```html
<l-grid :column="3">
	<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
	<l-grid-item text="最多六个文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
</l-grid>
```

### 内容横排
通过`layout`属性设置为`horizontal`，可以让宫格的内容呈横向排列。

```html
<l-grid :column="2" align="left">
	<l-grid-item text="标题文字" description="描述文字" layout="horizontal" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" description="描述文字" layout="horizontal" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
</l-grid>
```

### 带边框宫格
通过`border`属性设置为`true`可给格子加描边。

```html
<l-grid :column="3" :border="true">
	<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
	<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
	<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
	<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar5.png" />
	<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
</l-grid>
```

### 提示信息
设置`dot`属性后，会在图标右上角展示一个小红点。设置`badge`属性后，会在图标右上角展示相应的徽标。

```html
<l-grid>
	<l-grid-item text="标题文字" :dot="true" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" badge="5" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
	<l-grid-item text="标题文字" badge="15" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
	<l-grid-item text="标题文字" badge="New" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
</l-grid>
```


### 插槽
`icon`插槽，`text`插槽,`description`插槽
```html
<l-grid>
	<l-grid-item text="标题文字">
		<template #icon>
			<l-icon name="undertake-hold-up" size="48rpx"></l-icon>
		</template>
	</l-grid-item>
	<l-grid-item icon="undertake-hold-up">
		<template #text>
			<text>标题文字</text>
		</template>
	</l-grid-item>
	<l-grid-item text="标题文字" icon="undertake-hold-up">
		<template #description>
			<text>详情描述</text>
		</template>
	</l-grid-item>
</l-grid>
```


### 卡片
通过`inset`属性可以设置为卡片
```html
<l-grid :inset="true">
	<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
	<l-grid-item text="标题文字" icon="star"/>
	<l-grid-item text="标题文字" icon="download"/>
	<l-grid-item text="标题文字" icon="edit"/>
</l-grid>
```


### 查看示例
- 导入后直接使用这个标签查看演示效果

```html
 // 代码位于 uni_modules/lime-grid/compoents/lime-grid 
<lime-grid />
```

### 插件标签
- 默认 l-grid 为 component
- 默认 l-grid-item 为 component
- 默认 lime-grid 为 demo

### 关于vue2的使用方式
- 插件使用了`composition-api`, 如果你希望在vue2中使用请按官方的教程[vue-composition-api](https://uniapp.dcloud.net.cn/tutorial/vue-composition-api.html)配置
- 关键代码是: 在main.js中 在vue2部分加上这一段即可.

```js
// vue2
import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'
Vue.use(VueCompositionAPI)
```

## API

### Grid Props

| 参数   | 说明                   | 类型      | 默认值  |
| ------ | ---------------------- | --------- | ------- |
| title  | 分组标题               | _string_  | `-`     |
| inset  | 是否展示为圆角卡片风格 | _boolean_ | `false` |
| align | 内容的对齐方式，默认居中对齐。可选项：left/center | _string_ | `center` |
| bgColor | 每个格子的背景色 | _string_ | `` |
| padding | 每个格子的padding | _string_ | `` |

### GridItem Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| text | 标题 | _string_ | - |
| description | 标题下方的描述信息 | _string_ | - |
| icon | 图标名称，等同于 Icon 组件的 [name 属性](https://ext.dcloud.net.cn/plugin?id=14057) | _string_ | - |
| iconColor | 图标颜色 | _string_ | - |
| prefix | 图标前缀，用于自定义图标 | _string_ | - |
| iconSize | 图标尺寸 | _string_ | - |
| layout | 内容布局方式。可选项：vertical/horizontal | _string_ | `vertical` |
| image | 图片链接 | _string_ | - |
| url | 点击后跳转的链接地址 | _string_ | - |
| dot | 是否显示图标右上角小红点 | _boolean_ | `false` |
| badge | 图标右上角徽标的内容 | _string \| number_ | `_` |
| bordered | 是否显示内边框 | _boolean_ | `true` |
| hover | 是否开启点击反馈 | _boolean_ | `false` |
| openType | 链接跳转类型,可选值：switchTab/reLaunch/redirectTo | _string_ | `navigateTo` |
| imageWidth | 图片宽度 | _string_ | `-` |
| imageHeight | 图片高度 | _string_ | `-` |
| bgColor | 背景色 | _string_ | `-` |
| borderColor | 描边色 | _string_ | `-` |
| padding | 边距 | _string_ | `-` |
| lStyle | 自定义样式 | _string_ | `-` |
| lImageStyle | 自定义图片样式 | _string\|object_ | `-` |
| lTitleStyle | 自定义村里样式 | _string\|object_ | `-` |
| lDescriptionStyle | 自定义简介样式 | _string\|object_ | `-` |
| lClass | 自定义类名 | _string_ | `-` |
| lIconClass | 自定义图标类名 | _string_ | `-` |

### GridItem Events

| 事件名 | 说明             | 回调参数            |
| ------ | ---------------- | ------------------- |
| click  | 点击单元格时触发 | _event: UniPointerEvent_ |


### GridItem Slots

| 名称       | 说明                         |
| ---------- | ---------------------------- |
| title      | 自定义左侧标题               |
| description | 自定义标题下方的描述信息     |
| icon       | 自定义左侧图标               |
| extra       | 自定义额外底部的槽           |


## 主题定制

### 样式变量

组件提供了下列 CSS 变量，可用于自定义样式)。uvue app无效。

| 名称 | 默认值 | 描述 |
| --- | --- | --- |
| --l-grid-item-padding-y: | _32rpx 0 24rpx_ | - |
| --l-grid-item-padding-x: | _32rpx 0_ | - |
| --l-grid-item-bg-color: | _white_ | - |
| --l-grid-item-image-bg-color: | _$fill-4_ | - |
| --l-grid-item-image-border-radius: | _$border-radius_ | - |
| --l-grid-item-image-width: | _96rpx_ | - |
| --l-grid-item-image-small-width: | _32rpx_ | - |
| --l-grid-item-image-middle-width: | _80rpx_ | - |
| --l-grid-item-text-color: | _$text-color-1_ | - |
| --l-grid-item-text-font-size: | _28rpx_ | - |
| --l-grid-item-text-small-font-size: | _24rpx_ | - |
| --l-grid-item-text-line-height: | _44rpx_ | - |
| --l-grid-item-text-padding-top: | _16rpx_ | - |
| --l-grid-item-description-font-size: | _24rpx_ | - |
| --l-grid-item-description-line-height: | _40rpx_ | - |
| --l-grid-item-description-color: | _$text-color-3_ | - |
| --l-grid-item-description-padding-top: | _8rpx_ | - |
| --l-grid-item-hover-bg-color: | _$fill-4_ | - |
| --l-grid-item-horizontal-text-padding-left: | _24rpx_ | - |
| --l-grid-item-horizontal-text-description-top: | _4rpx_ | - |
| --l-grid-item-border-color: | _$border-color-1_ | - |
| --l-grid-item-icon-size: | _48rpx_ | - |


## 打赏

如果你觉得本插件，解决了你的问题，赠人玫瑰，手留余香。  
![](https://testingcf.jsdelivr.net/gh/liangei/image@1.9/alipay.png)
![](https://testingcf.jsdelivr.net/gh/liangei/image@1.9/wpay.png)