<template>
	<view class="l-grid" ref="resizeRef" 
		:class="{
			'l-grid--inset': inset,
			'l-grid--wrap': wrap,
			'l-grid--bordered': border && gutter == 0
		}">
		<slot></slot>
	</view>
</template>
<script lang="ts">
	// @ts-nocheck
	/**
	 * Grid 栅格布局组件
	 * @description 用于实现瀑布流、等分等网格布局场景
	 * @tutorial https://ext.dcloud.net.cn/plugin?name=lime-grid
	 * 
	 * @property {'left'|'center'} align 内容对齐方式
	 * @value left 左对齐
	 * @value center 居中对齐
	 * @property {boolean} border 是否显示边框
	 * @property {number} column 列数（0表示使用固定尺寸布局）
	 * @property {number} gutter 网格间隔（单位px/rpx）
	 * @property {boolean} hover 是否启用点击反馈效果
	 * @property {boolean} inset 卡片式圆角风格
	 * @property {string} [gridWidth] 固定尺寸布局时的网格宽度（支持CSS单位）
	 * @property {string} [padding] 内边距（支持CSS简写格式）
	 * @property {string} [bgColor] 背景颜色（卡片式布局生效）
	 * @property {boolean} wrap 超出是否换行
	 */
	import { defineComponent, ref, provide, onMounted, nextTick, getCurrentInstance } from '@/uni_modules/lime-shared/vue';
	import gridProps from './props'
	// import { getRect } from '@/uni_modules/lime-shared/getRect'
	
	export default defineComponent({
		name: 'l-grid',
		props: gridProps,
		setup(props) {
			
			const instance = getCurrentInstance()
			const width = ref<number>(0)
			const children = ref<number[]>([])
			
			// onMounted(()=>{
			// 	nextTick(()=>{
			// 		getRect('.l-grid', instance?.proxy).then(res => {
			// 			width.value = res.width;
			// 			console.log(width.value)
			// 		})
			// 	})
			// })
			
			provide('limeGrid', {
				children,
				props,
				width
			})
		}
	})
</script>
<style lang="scss">
	@import './index';
</style>