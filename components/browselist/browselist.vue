<template>
	  <!-- 新增根节点容器，包裹所有内容 -->
	  <view class="archivelist-root">
	<view class="venuelist flexrow" v-for="item in list" :key="item.id" @click="clickitem(item)">
		<image class="titleimg" :src="item.img" mode=" aspectFill"
			:style="{height: '200rpx',width:'200rpx'}"></image>
		<view class="txtlist ">
			<view class="txttile txt1">
				{{item.title}}
			</view>
			<view class="txtmain txt_gray_after">
				{{item.maintxt}}
			</view>
			<view class="txtlistbot flexrow">
				<view class="txtlistbottime txt_gray_small">
					检查时间：{{item.time}}
				</view>
				<view class="txtlistbotstaff txt_gray_small">
					人员：{{item.inspector}}
				</view>
			</view>
		</view>
		</view>
	</view>
</template>

<script setup>
 defineProps({
 	 list:{
 		 type:[{}],
 		 default(){
 		 	return [{title:"安全检查",
			maintxt:"抽查了三间包厢，暂未发现问题",
			img:"/static/demofile/包房.jpg",
			time:"2025-9-17",
			inspector:"张三、李四",
			id:'1'
			}]
 		 }
 	 }
 })
 const emit=defineEmits(["clickitem"]);
 
 function clickitem(e){
 	 console.log(e);
 	 emit("clickitem",e);
 }
 
</script>

<style lang="scss" scoped>
@import url("../../common/style/common-style.scss");
	.bottomlist {
		width: 100%;
	}

	.titleimg {
		border-radius: 10rpx;
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
		justify-content: space-between;
		
		height: 45rpx;

	}

	.txttile {
		margin-top: 5rpx;
		height: 50rpx;
		
	}

	.txtmain {
		height: 100rpx;
		// 超过两行则省略
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
     display: -webkit-box;
		-webkit-box-orient: vertical;
		 -webkit-line-clamp: 2;
	}
</style>