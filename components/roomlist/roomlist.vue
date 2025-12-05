<template>
	<!-- 新增根节点容器，包裹所有内容 -->
	<view class="archivelist-root">
		<view class="waterfall-container">
			<!-- 2列瀑布流 -->
			<view class="waterfall-grid">
				<view class="waterfall-item" v-for="(item, index) in list" :key="index" @click="clickitem(item)">
					<image class="item-img" :src="item.image" mode="aspectFill" lazy-load />
					<view class="item-title">{{ item.roomInfo }}</view>
					<view class="item-detail">{{ item.tenantName }}</view>
				</view>
			</view>


		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue'

	// 接收父组件属性
	const props = defineProps({

		list: {
			type: [{}],
			default () {
				return [{
					tenantName: "201",
					roomInfo: "张三",
					image: 'https://picsum.photos/id/1016/400/500岁',

				}]
			}
		}
	})

	// 暴露事件给父组件
	const emit = defineEmits(['clickitem'])

	function clickitem(e) {
		console.log(e);
		emit("clickitem", e);
	}
</script>

<style scoped>
	.waterfall-container {
		padding: 15rpx;
		background-color: #f5f5f5;
	}

	.waterfall-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 18rpx;
	}

	.waterfall-item {
		background-color: #fff;
		border-radius: 15rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		transition: transform 0.2s ease;
	}

	.waterfall-item:hover {
		transform: translateY(-4rpx);
	}

	.item-img {
		width: 100%;
		height: 300rpx;
		display: block;
	}

	.item-title {
		padding: 18rpx 18rpx 10rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: #222;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-detail {
		padding: 0 18rpx 18rpx;
		font-size: 24rpx;
		color: #666;
		line-height: 1.6;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		overflow: hidden;
	}

	.load-tips {
		text-align: center;
		padding: 30rpx 0;
		font-size: 24rpx;
		color: #999;
	}
</style>