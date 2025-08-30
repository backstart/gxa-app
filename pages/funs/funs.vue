<template>
	<view class="page">
		<view class="statuBar" :style="{height: barheight+'px'}"></view>
		<view class="head">
			<view class="title">
				<view class="txt1">
					龙井坊KTV
				</view>

			</view>

			<view class="pepoleinfo">
				<view class="flexrow">
					<view class="txt_gray">
						负责人：
					</view>
					<view class="txtclick">
						张三
					</view>
				</view>
				<view class="flexrow">
					<view class="txt_gray">
						电话：
					</view>
					<view class="txtclick">
						123456789
					</view>
				</view>
			</view>

			<view class="pepoleinfo">
				<view class="flexrow">
					<view class="txt_gray">
						管理员：
					</view>
					<view class="txtclick">
						李四
					</view>
				</view>
				<view class="flexrow">
					<view class="txt_gray">
						电话：
					</view>
					<view class="txtclick">
						1855522365
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
					最近检查时间：
				</view>
				<view class="txt_gray_after">
					2025年8月21日20时36分
				</view>

			</view>
			<com-tag></com-tag>




		</view>
		<view class="body">
			<l-grid :inset="true">
				<l-grid-item @click="lgClick('1')" text="检查记录" badge="15" image="/static/venue/检查记录 .png" />
				<l-grid-item @click="lgClick('1')" text="从业人员" image="/static/venue/人员信息.png" />
				<l-grid-item @click="lgClick('1')" text="档案" badge="5" image="/static/venue/档案.png" />
				<l-grid-item @click="lgClick('1')" text="关联警情" badge="New" image="/static/venue/关联警情.png" />
			</l-grid>
		</view>
		<view class="bottomlist">
			<browselist :list="list" @clickitem="clickitem"></browselist>
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

	// 点击图标
	function lgClick(e) {
		console.log(e);
	}
	// 点击检查记录列表
	function clickitem(e) {

	}

	const list = ref([{
		title: "安全检查",
		maintxt: "抽查了三间包厢，暂未发现问题",
		img: "/static/demofile/包房.jpg",
		time: "2025-9-17",
		inspector: "张三、李四",
		id: '1'
	}, {
		title: "消防检查",
		maintxt: "干粉灭火器3台，均未过期",
		img: "/static/demofile/ktv灭火器.jpg",
		time: "2025-9-17",
		inspector: "李四",
		id: '2'
	}])
</script>



<style lang="scss" scoped>
	@import url("../../common/style/common-style.scss");

	.page {
		height: 100%;
		width: 750rpx;
	}

	.head {
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

	.pepoleinfo {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}
</style>