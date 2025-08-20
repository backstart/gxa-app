<template>
	<view>
		<!-- leftTitle:标题  icon：左边图标 @click：点击事件  -->
		<cc-wxMenuBtn leftTitle="工作圈" icon="/static/work/朋友圈.png" @click="goFunctionClick(0)"></cc-wxMenuBtn>
		 
	</view>
</template>

<script setup>
 
 function goFunctionClick(e){
	 console.log(e);
 }
 
</script>

<style lang="scss" scoped>

</style>
