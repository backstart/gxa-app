<template>
	<view class="userLayout pageBg">
		<view class="statuBar" :style="{height: barheight+'px'}"></view>
		<view class="userInfo">
			<view class="avator">
				<image src="/static/logo.png" mode="aspectFill"></image>
			</view>
			<view class="info">
				<view class="name">
					张三
				</view>
				<view class="level">
					一级警员
				</view>
			</view>
		</view>

		<l-grid>
		    <l-grid-item text="会议" :dot="true" image="/static/userFuns/meet.png" />
		    <l-grid-item text="OA" badge="5" image="/static/userFuns/oa.png" />
		    <l-grid-item text="休假" badge="15" image="/static/userFuns/leave.png" />
		    <l-grid-item text="值班" badge="New" image="/static/userFuns/duty.png" />
			<l-grid-item text="用车" badge="4" image="/static/userFuns/car.png" @click="goToUseCar" />
		</l-grid>

	</view>
</template>

<script setup>
import { ref } from 'vue';
import { getStatusBarHeight } from "@/utils/system.js";

const barheight = ref(getStatusBarHeight());

const goToUseCar = () => {
	uni.navigateTo({
		url: '/pages/car/list'
	});
};
</script>

<style lang="scss">
.userLayout{
	.userInfo{
		display: flex;
		padding: 50rpx 0;
		.avator{
			width: 160rpx;
			height: 160rpx;
			overflow: hidden;
			border-radius: 10%;
			margin-left: 30rpx;
			image{
				width: 100%;
				height: 100%;
			}
		}
		.info{
			margin-left: 50rpx;
			.name{
				font-size: 40rpx;
				font-weight: 550;
			}
			.level{
				margin-top: 15rpx;
				font-size: 30rpx;
				color: #aaa;
			}
		}
	}
	.userfuns{
		width: 700rpx;
		margin: 10rpx auto;
		padding-left: 10rpx;
		border: 1px solid #eee;
		border-radius: 10rpx;
		box-shadow: 0 0 30rpx rgba(0, 0, 0, 0.15);
		background-color: white;
		display: grid;
		gap: 5rpx 10rpx;
		grid-template-columns: repeat(4,1fr);
	}
}
</style>
