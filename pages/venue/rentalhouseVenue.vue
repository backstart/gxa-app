<!-- 出租屋场所 -->
<template>
	<view class="page">
		<view class="statuBar" :style="{height: barheight+'px'}"></view>
		<view class="head">
			<view class="title">
				<view class="txt1">
					温馨租房
				</view>

			</view>

			<view class="pepoleinfo">
				<view class="flexrow">
					<view class="txt_gray">
						负责人：
					</view>
					<view class="txtclick">
						李华
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
					2025年8月18日20时36分
				</view>

			</view>
			<com-tag :taglist="tag"></com-tag>




		</view>
		<view class="body">
			<l-grid :inset="true">
				<l-grid-item @click="lgClick('a')" text="检查记录" badge="15" image="/static/venue/检查记录 .png" />
				<l-grid-item @click="lgClick('b')" text="房间" image="/static/venue/人员信息.png" />
				<l-grid-item @click="lgClick('c')" text="档案" badge="5" image="/static/venue/档案.png" />
				<l-grid-item @click="lgClick('d')" text="关联警情" badge="New" image="/static/venue/关联警情.png" />
			</l-grid>
		</view>
		<view class="bottomlist">
			<!-- 检查记录组件 -->

			<browselist :list="list" v-show="currentTab==='a'" @clickitem="clickitem"></browselist>


			<!-- 从业人员组件 -->
			<!-- <staffbrolist :list="stafflist" v-show="currentTab==='b'" @clickitem="clickitem"></staffbrolist> -->
			<roomlist :list="customHouseList" v-show="currentTab==='b'" @clickitem="clickitem"></roomlist>
			<!-- 档案组件 -->
			<!-- <archivelist :list="archivelists" v-show="currentTab==='c'" @clickitem="clickitem"></archivelist> -->


		</view>
		<view>
			<FloatPopupMenu :menuItems="customMenuItems" :disabled="false"
				buttonBgColor="linear-gradient(165deg, #FF6B6B 0%, #FFD166 100%)"
				activeButtonBgColor="linear-gradient(165deg, #FFD166 0%, #FF6B6B 100%)" iconColor="#333333"
				textColor="#333333" @menuClick="onMenuClick">
			</FloatPopupMenu>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		watch
	} from 'vue';
	import {
		onReady,
		onPullDownRefresh,
		onReachBottom
	} from "@dcloudio/uni-app";



	import {
		getStatusBarHeight
	} from "@/utils/system.js";

	const tag = [{
		tag: "黄名单"
	}, {
		tag: "重点场所"
	}];

	const barheight = ref(getStatusBarHeight());
	// 页面索引，1-检查记录，2-从业人员，3-档案
	const currentTab = ref('a');

	// 点击图标
	function lgClick(e) {
		currentTab.value = e;

	}
	// 点击检查记录列表
	function clickitem(e) {

	}
	onReady(() => {
		console.log("主界面onready");
	})


	// 页面触底：触发组件加载更多
	onReachBottom(() => {

	})


	import FloatPopupMenu from "@/uni_modules/stars-Float-Popup-Menu/components/stars-Float-Popup-Menu/FloatPopupMenu.vue";

	const customMenuItems = [{
			icon: 'home',
			text: '检查',
			menuBgColor: "linear-gradient(165deg, #2B5BDB 20%, #00C9FF 50%, #ffffff 100%)",
			textColor: "#fff",
			iconColor: "#fff"
		},
		{
			icon: 'staff',
			text: '修改',
			menuBgColor: "linear-gradient(165deg, #2B5BDB 0%, #00C9FF 100%)",
			textColor: "#fff",
			iconColor: "#fff"
		},
		{
			icon: 'person',
			text: '新增',
			menuBgColor: "linear-gradient(165deg, #FF6B6B 0%, #FFD166 100%)",
			textColor: "#333333",
			iconColor: "#333333"
		},
		{
			icon: 'scan',
			text: '识别',
			menuBgColor: "linear-gradient(165deg, #2B5BDB 0%, #00C9FF 100%)",
			textColor: "#fff",
			iconColor: "#fff"
		}
	];

	const onMenuClick = (item) => {
		uni.showToast({
			title: `点击了${item.text}`,
			icon: 'none'
		});
		console.log('点击了菜单项:', item);
	};

	// 监听变化，打印日志
	watch(currentTab, (newVal) => {
		console.log('currentTab 最新值：', newVal, '类型：', typeof newVal);
	});
	//#regoin 数据定义
	const list = ref([{
		title: "安全检查",
		maintxt: "房间内一切正常",
		img: "/static/demofile/检查出租房 (2).jpg",
		time: "2025-9-17",
		inspector: "张三、李四",
		id: '1'
	}, {
		title: "安全检查",
		maintxt: "手续齐全，粤居码如实登记",
		img: "/static/demofile/检查出租房 (1).jpg",
		time: "2025-9-17",
		inspector: "李四",
		id: '2'
	}])

	const stafflist = ref([{
		name: "上官婉儿",
		maintxt: "贵州省贵阳市南明区龙洞堡见龙路138-15号",
		age: '25岁',
		img: "/static/demofile/大头照.jpg",
		time: "2025-9-17",
		position: "经理",
		id: '1',
	}, {
		name: "大司命",
		maintxt: "广东省深圳市南山区海天二路33号腾讯滨海大厦",
		age: '25岁',
		img: "/static/demofile/大头照2.jpg",
		time: "2021-4-17",
		position: "前台",
		id: '2',
	}])
	//这里还不能跟组件名称相同，不然报错
	const archivelists = ref([{
		title: "营业执照",
		maintxt: "这是一张营业执照，有效期截至2022年",
		img: "/static/demofile/营业执照.png",
		id: '1',
	}, {
		title: "保安证",
		maintxt: "张三的保安证",
		img: "/static/demofile/保安证.png",
		id: '2',
	}])

	//出租房数据
	const customHouseList = ref([{
			id: 1,
			image: '/static/demofile/人像 (1).png',
			roomInfo: '201',
			tenantName: '入住人：小明'
		},
		{
			id: 2,
			image: '/static/demofile/人像 (2).png',
			roomInfo: '202',
			tenantName: '入住人：小红'
		},

		{
			id: 3,
			image: '/static/demofile/房间 (1).png',
			roomInfo: '203',
			tenantName: '入住人：无'
		},

		{
			id: 4,
			image: '/static/demofile/人像 (3).png',
			roomInfo: '204',
			tenantName: '入住人：小英'
		},
		{
			id: 5,
			image: '/static/demofile/人像 (4).png',
			roomInfo: '205',
			tenantName: '入住人：小美'
		}
	])
	//#endregion
</script>



<style lang="scss" scoped>
	@import url("../../common/style/common-style.scss");

	.page {
		height: 100vh;
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




	.bottomlist {
		width: 100%;
	}
</style>