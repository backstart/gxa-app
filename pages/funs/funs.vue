<template>
	<view class="page">
		<view class="statuBar" :style="{height: barheight+'px'}"></view>
		<view class="head">
			<view class="title">
				<view class="titletxt">
					警情一
				</view>
				<view class="innum">
					<view class="txt2">警情编号：</view>
					<view>JJ202508210836</view>
				</view>
			</view>
			<view class="introduction txt2">
				居民赵某某报警称，其女友孙某某因感情不和提出分手后，情绪失控在其住所内砸毁物品（包括手机、花瓶等），并扬言“同归于尽”。赵某某表示孙某某目前反锁卧室门拒绝沟通，手持水果刀但未实施自残行为。
			</view>
			<view class="pepoleinfo">
				<view>
					报警人：刘能
				</view>
				<view>
					电话：123456789
				</view>
			</view>
			<view class="address">
				XX市XX区XX街道XX小区3栋2单元
			</view>
			<view class="time">
				接警时间：2025年8月21日20时36分
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
	}
</style>