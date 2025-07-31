<template>
		<view class="funs">
			<navigator class="onefun">
				<image class="pic" src="/static/userFuns/meet.png" mode="aspectFill"></image>
				<view class="txt">会议</view>
			</navigator>
		</view>
	
</template>

<script setup>
 
</script>

<style lang="scss" scoped>
.funs{
	 
	.onefun{
		height: 130rpx;
		width: 100rpx;
		overflow: hidden;
		// border-radius: 10rpx;
		display: flex;
		flex-direction: column;
		 align-items: center;
		background-color: cornflowerblue;
		.pic{
			margin-top: 10rpx;
			width: 70rpx;
			height: 70rpx;
			background-color: yellow;
			display: block;//加了这个图片和文字之间就没有空袭了，当成块元素 
		}
		.txt{
			height: 60rpx;
			background-color: green;
			display: flex;
			 justify-content: center;
			
			font-size: 22rpx;
			
		}
	}
}
</style>