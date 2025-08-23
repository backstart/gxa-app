<template>
	
		<view class="tag-container" >
			<text class="cellView"
				:style="{ color: bindColor(index) , backgroundColor: bindBgColor(index) }"
				v-for="(tagItem, index) in item" :key="index">
				{{tagItem.tag}}
			</text>
	 
	</view>
</template>

<script setup>
 defineProps({
 	 item:{
 		 type:[{}],
 		 default(){
 		 	return [{tag:"文字1"},{tag:"文字2"},{tag:"文字3"}]
 		 }
 	 }
 })
 

 
 // 标签颜色
 function bindColor(index) {
 	const colorArr = ['#4473FF', '#FFA01B', '#41D380'];
 	return colorArr[index % 3];
 }
 
 // 标签背景色
 function bindBgColor(index) {
 	const bgColorArr = ['#F1F4FA', '#FFF5E8', '#ECFAF2'];
 	return bgColorArr[index % 3];
 }
 
</script>

<style lang="scss" scoped>
	.tag-container {
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		margin-top: 0px;
		height: 38px;
		width: calc(100vw - 62px);
	}

	.cellView {
		margin-top: 8px;
		margin-left: 8px;
		height: 22px;
		line-height: 22px;
		text-align: center;
		border-radius: 2px;
		padding: 0px 4px;
		font-size: 15px;
		color: #4272FF;
		background: #F3F4F6;
	}
</style>