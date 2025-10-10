<!-- 档案组件 -->
<template>
	  <!-- 新增根节点容器，包裹所有内容 -->
	  <view class="archivelist-root">
	<view class="venuelist flexrow" v-for="item in list" :key="item.id" @click="clickitem(item)">
		<view class="titleimg">
			<image   :src="item.img"  mode=" aspectFit"></image>
		</view>
		<view class="txtlist ">
			<view class="txt1 titletxt">
				{{item.title}}
			</view>
			<view class="txtmain txt_gray_after">
				{{item.maintxt}}
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
					title: "营业执照",
					maintxt: "贵州省贵阳市南明区龙洞堡见龙路138-15号",
					img: "/static/demofile/营业执照.png",
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
@import url("../../common/style/common-style.scss");
	.titleimg {
		display: block;
		height: 200rpx;
		width: 250rpx;
		padding: 10rpx;
        background-color: red;
		image {
			width: 100%;
			height: 100%;
			border-radius: 10rpx;
		}
	}
	.titletxt{
		height: 50rpx;
		background-color: magenta;
	}
	.txtlist {
		margin-left: 10rpx;
		height: 200rpx;
		width: 480rpx;
		padding-left: 5rpx;
		padding-right: 10rpx;
	
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
	
</style>