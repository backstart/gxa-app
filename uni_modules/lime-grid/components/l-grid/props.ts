export default {
	/** 内容对齐方式 */
	align: {
		type: String,
		default: 'center'
	},
	/** 边框，默认不显示。值为 true 则显示默认边框 */
	border: {
		type: Boolean,
		default: false
	},
	/** 每一行的列数量；为 0 时等于固定大小 */
	column: {
		type: Number,
		default: 4
	},
	/** 间隔大小 */
	gutter: {
		type: Number,
		default: 0
	},
	wrap: {
		type: Boolean,
		default: true
	},
	/** 是否开启点击反馈 */
	hover: {
		type: Boolean,
		default: false
	},
	/** 是否展示为圆角卡片风格 */
	inset: {
		type: Boolean,
		default: false
	},
	bgColor: {
		type: String,
		default: null
	},
	padding: {
		type: String,
		default: null
	},
}