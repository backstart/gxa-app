<template>
	<view 
		ref="gridRef"
		class="l-grid-item" 
		@click="onClick"
		:hover-stay-time="200"
		:class="[
			'l-grid-item--' + layout,
			'l-grid-item--' + align,
			border ? 'l-grid-item--bordered': ''
		]" 
		:hover-class="hover ? 'l-grid-item--hover': ''"
		:style="[styles, lStyle]">
		<slot>
			<l-badge
				v-if="(dot || badge) && (icon || image || $slots['icon'])" 
				:content="badge"
				:dot="dot">
				<slot name="icon">
					<view 
						class="l-grid-item__icon" 
						:class="['l-grid-item__image--' + size]" 
						v-if="icon" >
						<l-icon
							:l-class="lClassIcon"
							:prefix="prefix"
							:name="icon" 
							:color="iconColor" 
							:size="iconSize">
						</l-icon>
					</view>
					<image
						class="l-grid-item__image"
						:class="['l-grid-item__image--' + size]"
						v-else-if="image"
						:style="[lImageStyle]"
						:src="image" 
						mode="aspectFill">
					</image>
				</slot>
			</l-badge>
			<slot name="icon"  v-else-if="icon || image || $slots['icon']">
				<view class="l-grid-item__icon" 
					:class="['l-grid-item__image--' + size]" 
					v-if="icon" >
					<l-icon
						:l-class="lClassIcon"
						:prefix="prefix"
						:name="icon" 
						:color="iconColor" 
						:size="iconSize">
					</l-icon>
				</view>
				<image
					class="l-grid-item__image"
					:class="['l-grid-item__image--' + size]" 
					v-else-if="image"
					:style="[lImageStyle]"
					:src="image" 
					mode="aspectFill">
				</image>
			</slot>
			
			<view class="l-grid-item__content">
				<slot name="text">
					<view class="l-grid-item__title" :style="[lTitleStyle]" :class="['l-grid-item__title--' + size]">{{text}}</view>
				</slot>
				<slot name="description">
					<view class="l-grid-item__description" :style="[lDescriptionStyle]">{{description}}</view>
				</slot>
			</view>
		</slot>
		<slot name="extra"></slot>
	</view>
</template>
<script lang="ts">
	// @ts-nocheck
	/**
	 * GridItem 网格项组件
	 * @description 用于构建功能入口或导航项的布局元素
	 * @tutorial https://ext.dcloud.net.cn/plugin?name=lime-grid
	 * 
	 * @property {string} text 主文本内容（支持插槽自定义）
	 * @property {string} description 辅助描述文本（支持插槽自定义）
	 * @property {string} url 点击跳转链接
	 * @property {'switchTab'|'reLaunch'|'redirectTo'|'navigateTo'} openType 跳转方式
	 * @value navigateTo
	 * @value switchTab 切换Tab页
	 * @value reLaunch 重新加载页面
	 * @value redirectTo 页面重定向
	 * @value navigateTo 保留当前页跳转
	 * @property {string} icon 图标名称/图片地址（支持base64）
	 * @property {string} prefix 图标类名前缀（默认'lime-icon'）
	 * @property {string} image 图片地址（优先级高于icon）
	 * @property {string} imageWidth 图片宽度（支持CSS单位）
	 * @property {string} imageHeight 图片高度（支持CSS单位）
	 * @property {string} bgColor 背景颜色（支持十六进制/rgba）
	 * @property {string} padding 内边距（CSS简写格式）
	 * @property {'vertical'|'horizontal'} layout 内容排列方向
	 * @value vertical
	 * @value horizontal
	 * @property {boolean} dot 是否显示右上角小红点
	 * @property {string} borderColor 边框颜色（需设置父级border）
	 * @property {string|object} lStyle 自定义根节点样式
	 * @property {string|object} lImageStyle 自定义图片节点样式
	 * @property {string|object} lTitleStyle 自定义标题节点样式
	 * @property {string|object} lDescriptionStyle 自定义简介节点样式
	 * @property {string} lClass 自定义根节点类名
	 * 
	 * @event {Function} click 点击事件
	 */
	import { defineComponent, inject, getCurrentInstance, computed, onBeforeMount, onUnmounted } from '@/uni_modules/lime-shared/vue';
	import gridItemProps from './props'
	
	export default defineComponent({
		name: 'l-grid-item',
		props: gridItemProps,
		options: {
			addGlobalClass: true,
			virtualHost: true,
		},
		emits: ['click'],
		setup(props, {emit}) {
			const parent = inject('limeGrid', null);
			const instance = getCurrentInstance();
			const index = computed(():number => parent?.children.value.indexOf(instance!.uid) || -1);
			const column = computed(():number => parent?.props.column || 0)
			const gutter = computed(():number => parent?.props.gutter || 0)
			// const width = computed(():number => parent?.width.value || 0)
			const hover = computed(():boolean => parent?.props.hover || false)
			const border = computed(():boolean => parent?.props.border || false)
			const align = computed(():boolean => parent?.props.align || 'center')
			
			const size = computed(():string=>{
				if (column.value > 4 || column.value == 0) return 'small';
				return column.value < 4 ? 'large' : 'middle';
			})
			
			
			const styles = computed(()=>{
				const style:Record<string, any> = {};
				
				const percent = `calc((100% - ${(column.value - 1) * gutter.value}px) / ${column.value})` //`calc(${100 / column.value}% - ${gutter.value}px)`;
				
				style['flex-basis'] = percent
				
				if(index.value % (column.value) != column.value - 1) {
					style['margin-right'] = `${gutter.value}px`
				}
			
				if (index.value >= column.value) {
					style['margin-top'] = `${gutter.value}px`
				}
				
				if(props.borderColorl) {
					style['--l-grid-item-border-color'] = props.borderColor!
				}
				
				if(props.imageWidth) {
					style[size.value == 'large' ? `--l-grid-item-image-width`: `--l-grid-item-${size.value}-width`] = props.imageWidth;
				}
				if(props.imageHeight) {
					style[size.value == 'large' ? `--l-grid-item-image-height`: `--l-grid-item-${size.value}-height`] = props.imageHeight;
				}
				
				const bgColor = props.bgColor || parent?.props.bgColor
				if(bgColor) {
					style['background'] =  bgColor!
				}
				const padding = props.padding || parent?.props.padding
				if(padding) {
					style['padding'] = padding
				}
				
				return style
			})
			
			const onClick = (e: UniPointerEvent) => {
				emit('click', e)
				if(props.url == null) return
				uni[props.openType]({url: props.url!})
			}
			
			onBeforeMount(() => {
				if(instance && parent) {
					parent.children.value.push(instance.uid)
				}
			})
			onUnmounted(() => {
				if(instance && parent) {
					parent.children.value = parent.children.value.filter((it):boolean => it != instance.uid)
				}
			})
			
			return {
				styles,
				border,
				hover,
				align,
				size,
				onClick
			}
			
		}
	})
</script>
<style lang="scss">
	@import './index';
</style>