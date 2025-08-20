<template>
	<view>
		<view class="inputView" @click="goClick">
			<image class="iconImg" mode="aspectFill" :src="icon"></image>

			<text class="leftTitle">{{leftTitle}}</text>

			<image class="arrowImg" mode="aspectFit" src="./arrow_right.png"></image>
		</view>
		<view class="lineV"></view>

	</view>
</template>

<script>
	export default {

		props: {
			// 左边标题栏
			leftTitle: {
				type: String,
				default: ""
			},
			// 左边图标
			icon: {
				type: String,
				default: ""
			},


		},
		data() {
			return {

			}
		},
		methods: {
			goClick(e) {


				this.$emit("click", e);

			},

		}

	}
</script>

<style scoped>
	.inputView {
		display: flex;
		flex-direction: row;
		height: 50px;
		align-items: center;
		width: 100%;
		background-color: white;
	}

	.iconImg {

		margin: 0px 16px;
		width: 24px;
		height: 24px;
	}

	.leftTitle {

		width: calc(100vw - 96px);
		font-size: 15px;

	}

	.arrowImg {

		width: 20px;
		height: 20px;
	}

	.lineV {
		width: 90%;
		height: 1px;
		margin-left: 5%;
		background-color: #f6f6f6;


	}
</style>