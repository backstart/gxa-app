// @ts-nocheck
export interface GridProps {
	/** 内容对齐方式 */
	align: 'left' | 'center';
	/** 边框，默认不显示。值为 true 则显示默认边框 */
	border: boolean;
	/** 每一行的列数量；为 0 时等于固定大小 */
	column: number;
	/** 间隔大小 */
	gutter: number;
	/** 是否开启点击反馈 */
	hover: boolean;
	/** 是否展示为圆角卡片风格 */
	inset: boolean
	gridWidth?: string;
	padding?: string;
	bgColor?: string;
	wrap: boolean;
}


export type GridProvide = {
	children: Ref<number[]>,
	width: Ref<number>,
	props: LGridComponentPublicInstance
}