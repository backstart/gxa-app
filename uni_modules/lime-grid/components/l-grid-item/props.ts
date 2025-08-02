export default {
	/**
	 * 文本，可以通过 Props 传入文本，也可以自定义标题节点
	 */
	text: {
		type: String
	},
	/**
	 * 文本以外的更多描述，辅助信息。可以通过 Props 传入文本，也可以自定义标题节点
	 */
	description: {
		type: String
	},
	/**
	 * 点击后的跳转链接
	 */
	url: {
		type: String
	},
	/**
	 * 链接跳转类型
	 */
	openType: {
		type: String,
		default: 'navigateTo'
	},
	/**
	 * 图标名称。值为字符串表示图标名称
	 */
	icon: {
		type: String
	},
	/**
	 * 图标名称。值为字符串表示图标名称
	 */
	prefix: {
		type: String
	},
	/**
	 * 图片，可以是图片地址
	 */
	image: {
		type: String
	},
	imageWidth: {
		type: String
	},
	imageHeight: {
		type: String
	},
	bgColor: {
		type: String
	},
	layout: {
		type: String,
		default: 'vertical'
	},
	padding: {
		type: String,
		default: null
	},
	dot: {
		type: Boolean,
		default: false
	},
	iconSize: {
		type: String
	},
	iconColor: {
		type: String
	},
	badge: {
		type: [String, Number]
	},
	borderColor: {
		type: String
	},
	lClass:{
		type: String
	},
	lClassIcon:{
		type: String
	},
	lStyle:{
		type: [String, Object, Array]
	},
	lTitleStyle:{
		type: [String, Object, Array]
	},
	lImageStyle:{
		type: [String, Object, Array]
	},
	lDescriptionStyle:{
		type: [String, Object, Array]
	},
}