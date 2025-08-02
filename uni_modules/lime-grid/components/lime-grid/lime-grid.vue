<template>
	<view class="demo-block">
		<text class="demo-block__title-text ultra">Grid 宫格</text>
		<text class="demo-block__desc-text">用于功能入口布局，将页面或特定区域切分成若干等大的区块，形成若干功能入口。</text>	
		<view class="demo-block__body">
			<view class="demo-block">
				<text class="demo-block__title-text">基础用法</text>
				<view class="demo-block__body">
					<l-grid>
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
						<l-grid-item text="最多五个字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
					</l-grid>
					
				</view>	
			</view>	
			<view class="demo-block">
				<text class="demo-block__title-text">自定义列数</text>
				<view class="demo-block__body">
					<l-grid :column="5">
						<l-grid-item text="标题文字" l-image-style="border-radius:120px" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
						<l-grid-item text="最多四字" image="https://tdesign.gtimg.com/mobile/demos/avatar5.png" />
					</l-grid>
				</view>	
			</view>	
			<view class="demo-block">
				<text class="demo-block__title-text">页面导航</text>
				<view class="demo-block__body">
					<l-grid :column="3"  :hover="true">
						<l-grid-item text="跳到首页" url="/pages/index/index" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="跳到首页" url="/pages/index/index" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
						<l-grid-item text="跳到首页" url="/pages/index/index" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
					</l-grid>
				</view>	
			</view>	
			<view class="demo-block">
				<text class="demo-block__title-text">间隔</text>
				<view class="demo-block__body">
					<l-grid :gutter="10">
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
					</l-grid>
				</view>	
			</view>
			<view class="demo-block">
				<text class="demo-block__title-text">内容横排</text>
				<view class="demo-block__body">
					<l-grid :column="2" align="left">
						<l-grid-item text="标题文字" description="描述文字" layout="horizontal" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" description="描述文字" layout="horizontal" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
					</l-grid>
				</view>	
			</view>	
			<view class="demo-block">
				<text class="demo-block__title-text">带描述宫格</text>
				<view class="demo-block__body">
					<l-grid :column="3">
						<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
						<l-grid-item text="最多六个文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
					</l-grid>
				</view>	
			</view>	
			<view class="demo-block">
				<text class="demo-block__title-text">带边框宫格</text>
				<view class="demo-block__body">
					<l-grid :column="3" :border="true">
						<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
						<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
						<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
						<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar5.png" />
						<l-grid-item text="标题文字" description="描述文字" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
					</l-grid>
				</view>	
			</view>
			<view class="demo-block">
				<text class="demo-block__title-text">提示信息</text>
				<view class="demo-block__body">
					<l-grid>
						<l-grid-item text="标题文字" :dot="true" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" badge="5" image="https://tdesign.gtimg.com/mobile/demos/avatar2.png" />
						<l-grid-item text="标题文字" badge="15" image="https://tdesign.gtimg.com/mobile/demos/avatar3.png" />
						<l-grid-item text="标题文字" badge="New" image="https://tdesign.gtimg.com/mobile/demos/avatar4.png" />
					</l-grid>
				</view>	
			</view>
			<view class="demo-block">
				<text class="demo-block__title-text">图标插槽</text>
				<view class="demo-block__body">
					<l-grid>
						<l-grid-item text="标题文字">
							<template #icon>
								<l-icon name="undertake-hold-up" size="48rpx"></l-icon>
								<l-checkbox style="position: absolute; top: 0; right: 0"></l-checkbox>
							</template>
						</l-grid-item>
						<l-grid-item text="标题文字" icon="star"/>
						<l-grid-item text="标题文字" icon="download"/>
						<l-grid-item text="标题文字" icon="edit"/>
					</l-grid>
				</view>	
			</view>
			<view class="demo-block">
				<text class="demo-block__title-text">卡片</text>
				<view class="demo-block__body">
					<l-grid :inset="true">
						<l-grid-item text="标题文字" image="https://tdesign.gtimg.com/mobile/demos/avatar1.png" />
						<l-grid-item text="标题文字" icon="star"/>
						<l-grid-item text="标题文字" icon="download"/>
						<l-grid-item text="标题文字" icon="edit"/>
					</l-grid>
				</view>	
			</view>
		</view>	
	</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		methods: {
			
		},
		mounted() {
			
		}
	}
</script>

<style lang="scss">
	
	.btn {
		margin-bottom: 20rpx;
		margin-right: 20rpx;
		align-self: center;
	}
	.demo-block {
		margin: 32px 0 0;
		
		// overflow: visible;
		&.card{
			// background-color: white;
			padding: 30rpx;
			margin-bottom: 20rpx;
		}
		&__title {
			margin: 0;
			margin-top: 8px;
			&-text {
				color: rgba(0, 0, 0, 0.6);
				font-weight: 400;
				font-size: 14px;
				line-height: 16px;
				display: flex;
				margin-left: 20px;
				&.large {
					color: rgba(0, 0, 0, 0.9);
					font-size: 18px;
					font-weight: 700;
					line-height: 26px;
					margin-left: 20px;
				}
				&.ultra {
					color: rgba(0, 0, 0, 0.9);
					font-size: 24px;
					font-weight: 700;
					line-height: 32px;
				}
			}
		}
		&__desc-text {
			color: rgba(0, 0, 0, 0.6);
			margin: 8px 16px 0 0;
			font-size: 14px;
			line-height: 22px;
			margin-left: 20px;
		}
		&__body {
			margin: 16px 0;
			overflow: visible;
			.demo-block {
				// margin-top: 0px;
				margin: 0;
				overflow: visible;
			}
		}
	}
</style>