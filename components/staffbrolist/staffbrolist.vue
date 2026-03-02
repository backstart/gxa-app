<template>
	  <!-- 新增根节点容器，包裹所有内容 -->
	  <view class="archivelist-root">
	<view class="venuelist flexrow" v-for="item in list" :key="item.id" @click="clickitem(item)">
		<view class="titleimg">
			<image :src="item.img" mode="aspectFill"></image>
		</view>

		<view class="txtlist ">
			<view class="txttile txt3 flexrow">
				<view class="name">
					{{item.name}}
				</view>
				<view class="age">
					{{item.age}}
				</view>

			</view>
			<view class="txtmain txt_gray_after">
				住址：{{item.maintxt}}
			</view>
			<view class="txtlistbot flexrow">
				<view class="txtlistbottime txt_gray_small">
					入职时间：{{item.time}}
				</view>
				<view class="txtlistbotstaff txt_gray_small">
					岗位：{{item.position}}
				</view>
			</view>
		</view>
		</view>
	</view>

</template>

<script setup>
	defineProps({
		list: {
			type: [{}],
			default () {
				return [{
					name: "上官玩儿",
					maintxt: "贵州省贵阳市南明区龙洞堡见龙路138-15号",
					age: '25岁',
					img: "/static/demofile/headshot_1.jpg",
					time: "2025-9-17",
					position: "经理",
					id: '1',
				}]
			}
		}
	})
	const emit = defineEmits(["clickitem"]);

	function clickitem(e) {
		console.log(e);
		emit("clickitem", e);
	}
</script>

<style lang="scss" scoped>
	.titleimg {
		display: block;
		height: 200rpx;
		width: 200rpx;
		padding: 10rpx;

		image {
			width: 100%;
			height: 100%;
			border-radius: 10rpx;
		}
	}


	.venuelist {
		margin: 15rpx 10rpx;
		width: 730rpx;
		height: 200rpx;

	}

	.txtlist {
		margin-left: 10rpx;

		height: 200rpx;
		width: 530rpx;
		padding-left: 5rpx;
		padding-right: 10rpx;


	}

	.txtlistbot {
		width: 100%;

		height: 45rpx;

		padding-right: 10rpx;
	}

	.txttile {
		margin-top: 5rpx;
		height: 50rpx;

	}

	.txtmain {
		height: 100rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: normal;

		padding-top: 10rpx;

		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.name {
		width: 350rpx;
	}

	.age {
		width: auto;
	}

	.txtlistbottime {
		width: 350rpx;
	}
</style>
