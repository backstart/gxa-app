# cc-wxMenuBtn


#### 使用方法 
```使用方法
	
<!-- leftTitle:标题  icon：左边图标 @click：点击事件  -->
<cc-wxMenuBtn leftTitle="我的报名" icon="../../static/my_enroll.png" @click="goFunctionClick(0)"></cc-wxMenuBtn>
							

```

#### HTML代码实现部分
```html

<template>
	<view class="content">
		<view style="height: 190px;background-color: bisque;"></view>
		<!-- leftTitle:标题  icon：左边图标 @click：点击事件  -->
		<cc-wxMenuBtn leftTitle="我的报名" icon="../../static/my_enroll.png" @click="goFunctionClick(0)"></cc-wxMenuBtn>
		<cc-wxMenuBtn leftTitle="我的交易" icon="../../static/my_exchange.png" @click="goFunctionClick(1)"></cc-wxMenuBtn>
		<cc-wxMenuBtn leftTitle="我的兑换" icon="../../static/my_booktrade.png" @click="goFunctionClick(1)"></cc-wxMenuBtn>
		<cc-wxMenuBtn leftTitle="我的资料" icon="../../static/my_info.png" @click="goFunctionClick(3)"></cc-wxMenuBtn>
	
	</view>
</template>

<script>
	
	
	export default {
		
		data() {
			return {
				title: 'Hello'
			}
		},
		
		methods: {
            goFunctionClick(flag){
				
				console.log("点击的功能菜单 = " + flag);
				uni.showModal({
					title:'温馨提示',
					content:'我点击的是第' + (flag+1) + '个功能菜单'
				})
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
	
	}

</style>



```
