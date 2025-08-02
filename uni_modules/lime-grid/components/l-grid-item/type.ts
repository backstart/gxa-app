// @ts-nocheck
export interface GridItemProps {
	/**
	 * 文本，可以通过 Props 传入文本，也可以自定义标题节点
	 */
	text?: string;
	/**
	 * 文本以外的更多描述，辅助信息。可以通过 Props 传入文本，也可以自定义标题节点
	 */
	description?:string;
	/**
	 * 点击后的跳转链接
	 */
	url?: string;
	/**
	 * 链接跳转类型
	 */
	openType: 'switchTab' | 'reLaunch' | 'redirectTo' | 'navigateTo';
	/**
	 * 图标名称。值为字符串表示图标名称
	 */
	icon?: string;
	/**
	 * 图标前缀
	 */
	prefix?: string;
	
	/**
	 * 图片，可以是图片地址
	 */
	image?: string;
	imageWidth ?: string;
	imageHeight ?: string;
	bgColor ?: string;
	padding ?: string;
	layout: 'vertical' | 'horizontal';
	dot: boolean;
	// #ifdef APP-ANDROID || APP-IOS
	/**
	 * 图标大小
	 */
	iconSize : string;
	/**
	 * 图标颜色
	 */
	iconColor : string;
	badge?: any;
	// #endif
	// #ifndef APP-ANDROID || APP-IOS
	/**
	 * 图标大小
	 */
	iconSize ?: string;
	/**
	 * 图标颜色
	 */
	iconColor ?: string;
	badge?: string | number;
	// #endif
	borderColor?:string;
	lStyle?: string|UTSJSONObject;
	lImageStyle?: string|UTSJSONObject;
	lTitleStyle?: string|UTSJSONObject;
	lDescriptionStyle?: string|UTSJSONObject;
	lClass?: string;
	lClassIcon?: string;
}