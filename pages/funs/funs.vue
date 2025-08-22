<template>
	<view class="page">
		<view class="statuBar" :style="{height: barheight+'px'}"></view>
		<view class="head">
			<view class="title">
				<view class="txt1">
					警情一
				</view>
				<view class="innum">
					<view class="txt_gray">警情编号：</view>
					<view class="txtclick">JJ202508210836</view>
				</view>
			</view>
			<view class="introduction txt2">
				居民赵某某报警称，其女友孙某某因感情不和提出分手后，情绪失控在其住所内砸毁物品（包括手机、花瓶等），并扬言“同归于尽”。赵某某表示孙某某目前反锁卧室门拒绝沟通，手持水果刀但未实施自残行为。
			</view>
			<view class="pepoleinfo">
				<view class="flexrow">
					<view class="txt_gray">
						报警人：
					</view>
					<view class="txtclick">
						刘能
					</view>
				</view>
				 <view  class="flexrow">
				 	<view class="txt_gray">
				 		电话：
				 	</view>
				 	<view class="txtclick">
				 		123456789
				 	</view>
				 </view>
				 
				 
			</view>
			<view class="address flexrow">
				<view class="txt_gray">
					地址：
				</view>
				<view class="txtclick">
					XX市XX区XX街道XX小区3栋2单元
				</view>
			</view>
			<view class="time flexrow">
				<view class="txt_gray">
					接警时间：
				</view>
				<view class="txt_gray_after">
					2025年8月21日20时36分
				</view>
				
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue';
	import {
		getStatusBarHeight
	} from "@/utils/system.js";
	const barheight = ref(getStatusBarHeight());
</script>

<style lang="scss" scoped>
	.page {
		height: 100%;
		width: 100%;
	}

.head{
	border: 1px solid #eee;
	border-radius: 10rpx;
	box-shadow: 0 0 30rpx rgba(0, 0, 0, 0.15);
	background-color: white;
	margin: 10rpx 20rpx;
	padding: 10rpx;
}
	.title {
		margin: 10rpx 10rpx;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.innum {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}
	.pepoleinfo{
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}
	.flexrow{
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	.introduction{
		margin-bottom: 10px;
	}
	.address{
		margin-bottom: 8px;
	}
</style>