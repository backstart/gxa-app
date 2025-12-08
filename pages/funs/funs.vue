<!-- 功能页面 -->
<template>
	<view class="page">
		<view class="statuBar" :style="{height: barheight+'px'}"></view>
		<view class="head">
			<!-- 轮播区 -->
			<swiper :indicator-dots="true" :autoplay="true" interval="3000" circular="true" :duration="1000">
				<swiper-item v-for="(item, index) in newsList" :key="index">
					<image :src="item.image" mode="aspectFill" class="swiper-image" />
					<text class="swiper-text">{{ item.title }}</text>
				</swiper-item>
			</swiper>
		</view>
	</view>

	<view class="body">
		<l-grid :inset="true">
			<l-grid-item @click="lgClick('a')" text="娱乐场所" badge="15" image="/static/fun/娱乐场所.png" />
			<l-grid-item @click="lgClick('b')" text="出租房" image="/static/fun/出租房屋.png" />
			<l-grid-item @click="lgClick('c')" text="足浴" badge="5" image="/static/fun/足浴.png" />
			<l-grid-item @click="lgClick('d')" text="走访" badge="New" image="/static/fun/走访记录.png" />
			<l-grid-item @click="lgClick('e')" text="重点人" badge="New" image="/static/fun/重点人.png" />
			<l-grid-item @click="lgClick('f')" text="棋牌室" badge="New" image="/static/fun/棋牌室.png" />
			<l-grid-item @click="lgClick('g')" text="任务指派" badge="New" image="/static/fun/任务.png" />
		</l-grid>
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
	const newsList = ref([{
			id: 1,
			title: '新闻标题1',
			image: '/static/demofile/新闻1.jpg',
			detailUrl: '/pages/detail/detail?id=1'
		},
		{
			id: 2,
			title: '新闻标题2',
			image: '/static/demofile/新闻2.jpg',
			detailUrl: '/pages/detail/detail?id=2'
		},
		{
			id: 3,
			title: '新闻标题3',
			image: '/static/demofile/新闻3.jpg',
			detailUrl: '/pages/detail/detail?id=3'
		}
	]);

	function lgClick(e) {
		if (e === 'a') {
			uni.navigateTo({
				url: '/pages/venue/KTVVenue'
			})
		} else if (e === 'b') {
			uni.navigateTo({
				url: '/pages/venue/rentalhouseVenue'
			})
		}

	}
</script>



<style lang="scss" scoped>
	.page {

		width: 750rpx;
	}

	.head {
		height: 300rpx;
		width: 730rpx;
	}

	.newswiper {
		height: 300rpx;
		width: 730rpx;
	}

	.swiper-image {
		width: 700rpx;
		margin-left: 25rpx;
		height: 300rpx;
		margin-top: 25rpx;
	}

	.swiper-text {
		position: absolute;
		bottom: 10rpx;
		left: 25rpx;
		color: white;
		font-size: 18px;
	}
</style>