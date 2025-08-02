<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="navbar">
			<view class="location">
				<uni-icons type="location-filled" size="20" color="#0089ff"></uni-icons>
				<text class="location-text">北京路步行街</text>
			</view>
			<view class="navbar-actions">
				<view class="nav-btn">
					<uni-icons type="person" size="20"></uni-icons>
				</view>
				<view class="nav-btn">
					<uni-icons type="chat" size="20"></uni-icons>
				</view>
			</view>
		</view>
		
		<!-- 地图区域 -->
		<view class="map-container">
			<!-- 实际项目中替换为map组件 -->
			<view class="map-content">
				<text>地图区域 (实际项目中嵌入map组件)</text>
			</view>
			
			<!-- 地图上的控件 -->
			<view class="map-overlay">
				<view class="map-controls">
					<view class="map-btn">
						<uni-icons type="plus" size="20" color="#0089ff"></uni-icons>
					</view>
					<view class="map-btn">
						<uni-icons type="minus" size="20" color="#0089ff"></uni-icons>
					</view>
					<view class="map-btn primary">
						<uni-icons type="location-filled" size="20" color="#fff"></uni-icons>
					</view>
					<view class="map-btn">
						<uni-icons type="list" size="20" color="#0089ff"></uni-icons>
					</view>
				</view>
				
				<view class="current-location">
					<uni-icons type="location-filled" size="20" color="#0089ff"></uni-icons>
					<view class="location-info">
						<text class="location-title">当前位置</text>
						<text class="location-desc">广州市越秀区北京路</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 可拖拽面板 -->
		<view class="panel-container" :style="{ transform: `translateY(${panelOffset}px)` }" 
			 @touchstart="startDrag" @touchmove="onDrag" @touchend="endDrag">
			<view class="panel-drag-handle">
				<view class="drag-indicator"></view>
			</view>
			
			<view class="panel-header">
				<text class="panel-title">探索周边</text>
				<view class="nav-btn">
					<uni-icons type="scan" size="20"></uni-icons>
				</view>
			</view>
			
			<view class="search-box">
				<uni-icons type="search" size="18" color="#999"></uni-icons>
				<input class="search-input" type="text" placeholder="搜索地点、公交、地铁" />
			</view>
			
			<view class="quick-actions">
				<view class="action-item" v-for="(action, index) in actions" :key="index">
					<view class="action-icon" :style="{ backgroundColor: action.bgColor }">
						<uni-icons :type="action.icon" size="24" :color="action.color"></uni-icons>
					</view>
					<text class="action-text">{{ action.text }}</text>
				</view>
			</view>
			
			<view class="recommend-section">
				<view class="section-title">
					<text>附近推荐</text>
					<text class="see-all">查看全部</text>
				</view>
				<scroll-view class="recommend-list" scroll-x="true">
					<view class="recommend-card" v-for="(item, index) in recommends" :key="index">
						<view class="card-image" :style="{ background: item.bg }">
							<view class="card-tag">{{ item.tag }}</view>
						</view>
						<view class="card-content">
							<text class="card-title">{{ item.title }}</text>
							<text class="card-desc">{{ item.desc }}</text>
							<view class="card-footer">
								<view class="rating">
									<uni-icons type="star-filled" size="14" color="#ffc53d"></uni-icons>
									<text>{{ item.rating }}</text>
								</view>
								<text class="distance">{{ item.distance }}</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
		
	
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
	
// 面板拖拽相关状态
const panelOffset = ref(0);
const dragStartY = ref(0);
const startOffset = ref(0);
const isDragging = ref(false);
const screenHeight = ref(0);

onMounted(() => {
  // 获取屏幕高度
  uni.getSystemInfo({
    success: (res) => {
      screenHeight.value = res.windowHeight;
      // 初始状态设置为部分显示
      panelOffset.value = screenHeight.value * 0.3;
    }
  });
});
	
// 开始拖拽
const startDrag = (e) => {
	isDragging.value = true;
	dragStartY.value = e.touches[0].clientY;
	startOffset.value = panelOffset.value;
};
	
// 拖拽中
const onDrag = (e) => {
	if (!isDragging.value) return;
	
	const currentY = e.touches[0].clientY;
	const deltaY = currentY - dragStartY.value;
	
	// 计算新的偏移量
	let newOffset = startOffset.value + deltaY;
	
	// 限制拖动范围
	const maxOffset = screenHeight.value * 0.7; // 最大向下拖动距离
	const minOffset = -screenHeight.value * 0.3; // 最大向上拖动距离
	
	if (newOffset > maxOffset) newOffset = maxOffset;
	if (newOffset < minOffset) newOffset = minOffset;
	
	panelOffset.value = newOffset;
};
	
// 结束拖拽
const endDrag = () => {
	if (!isDragging.value) return;
	
	isDragging.value = false;
	
	// 根据当前位置决定面板最终状态
	const threshold = screenHeight.value * 0.15;
	
	if (panelOffset.value > screenHeight.value * 0.5) {
		// 向下拖动超过屏幕一半，关闭面板
		panelOffset.value = screenHeight.value * 0.7;
	} else if (panelOffset.value < screenHeight.value * 0.2) {
		// 向上拖动超过屏幕20%，完全展开
		panelOffset.value = -screenHeight.value * 0.3;
	} else {
		// 否则回到初始状态
		panelOffset.value = screenHeight.value * 0.3;
	}
};

// 快捷操作数据
const actions = ref([
	{ icon: 'bus', text: '公交', bgColor: '#e6f4ff', color: '#0089ff' },
	{ icon: 'subway', text: '地铁', bgColor: '#e6f4ff', color: '#0089ff' },
	{ icon: 'bicycle', text: '骑行', bgColor: '#e6f4ff', color: '#0089ff' },
	{ icon: 'car', text: '打车', bgColor: '#e6f4ff', color: '#0089ff' },
	{ icon: 'map-pin', text: '导航', bgColor: '#e6f4ff', color: '#0089ff' }
]);

// 推荐数据
const recommends = ref([
	{ 
		title: '广州塔', 
		desc: '城市地标，昵称小蛮腰', 
		rating: '4.8', 
		distance: '3.5km', 
		tag: '热门', 
		bg: 'linear-gradient(120deg, #ff9a9e, #fad0c4)' 
	},
	{ 
		title: '沙面岛', 
		desc: '欧陆风情建筑群', 
		rating: '4.7', 
		distance: '2.1km', 
		tag: '必游', 
		bg: 'linear-gradient(120deg, #a1c4fd, #c2e9fb)' 
	},
	{ 
		title: '点都德茶楼', 
		desc: '地道广式早茶', 
		rating: '4.6', 
		distance: '800m', 
		tag: '美食', 
		bg: 'linear-gradient(120deg, #ffecd2, #fcb69f)' 
	}
]);



const activeNav = ref(0);
</script>

<style lang="scss">
.container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	position: relative;
	background-color: #f5f5f5;
	color: #333;
	overflow: hidden;
}
	
/* 顶部导航栏 */
.navbar {
	position: absolute;
	top: var(--status-bar-height, 0); /* 适配状态栏高度 */
	left: 0;
	width: 100%;
	z-index: 100;
	padding: 15px 20px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
}
	
.location {
	display: flex;
	align-items: center;
	background: rgba(255,255,255,0.9);
	padding: 8px 15px;
	border-radius: 20px;
	min-width: 150px;
	box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
	
.location-text {
	font-size: 16px;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 120px;
	margin-left: 8px;
}
	
.navbar-actions {
	display: flex;
	gap: 12px;
}
	
.nav-btn {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(255,255,255,0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
	
/* 地图容器 */
.map-container {
	flex: 1;
	position: relative;
	background-color: #aad3df;
	overflow: hidden;
}
	
.map-content {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, #6ecbf5, #3a8dde);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 24px;
	font-weight: bold;
	text-align: center;
	padding: 20px;
}
	
.map-overlay {
	position: absolute;
	bottom: 160px;
	left: 20px;
	right: 20px;
	display: flex;
	justify-content: space-between;
}
	
.map-controls {
	display: flex;
	flex-direction: column;
	gap: 15px;
}
	
.map-btn {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: rgba(255,255,255,0.95);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 15px rgba(0,0,0,0.15);
	
	&.primary {
		background: #0089ff;
		color: white;
	}
}
	
.current-location {
	background: white;
	border-radius: 30px;
	padding: 12px 20px;
	box-shadow: 0 4px 15px rgba(0,0,0,0.15);
	display: flex;
	align-items: center;
	max-width: 240px;
}
	
.location-info {
	display: flex;
	flex-direction: column;
	margin-left: 10px;
}
	
.location-title {
	font-size: 16px;
	font-weight: bold;
	margin-bottom: 3px;
}
	
.location-desc {
	font-size: 14px;
	color: #666;
}
	
/* 可拖动面板 */
.panel-container {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	z-index: 200;
	background: white;
	border-top-left-radius: 25px;
	border-top-right-radius: 25px;
	box-shadow: 0 -5px 20px rgba(0,0,0,0.1);
	height: 85vh;
	transition: transform 0.3s ease;
}
	
.panel-drag-handle {
	display: flex;
	justify-content: center;
	padding: 15px 0 10px;
}
	
.drag-indicator {
	width: 40px;
	height: 5px;
	background: #e0e0e0;
	border-radius: 3px;
}
	
.panel-header {
	padding: 0 20px 15px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid #f0f0f0;
}
	
.panel-title {
	font-size: 22px;
	font-weight: bold;
}
	
.search-box {
	background: #f5f5f5;
	border-radius: 30px;
	padding: 12px 20px;
	display: flex;
	align-items: center;
	margin: 0 20px 20px;
}
	
.search-input {
	flex: 1;
	border: none;
	background: transparent;
	font-size: 16px;
	outline: none;
	margin-left: 10px;
}
	
.quick-actions {
	display: flex;
	justify-content: space-around;
	padding: 15px 20px;
	border-bottom: 1px solid #f0f0f0;
}
	
.action-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}
	
.action-icon {
	width: 60px;
	height: 60px;
	border-radius: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 8px;
}
	
.action-text {
	font-size: 13px;
	color: #555;
}
	
.recommend-section {
	padding: 20px;
}
	
.section-title {
	font-size: 18px;
	font-weight: bold;
	margin-bottom: 15px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
	
.see-all {
	font-size: 14px;
	color: #0089ff;
}
	
.recommend-list {
	display: flex;
	overflow-x: auto;
	gap: 15px;
	padding-bottom: 10px;
	
	&::-webkit-scrollbar {
		display: none;
	}
}
	
.recommend-card {
	min-width: 260px;
	border-radius: 15px;
	overflow: hidden;
	background: white;
	box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}
	
.card-image {
	height: 140px;
	position: relative;
}
	
.card-tag {
	position: absolute;
	top: 10px;
	right: 10px;
	background: #ff4d4f;
	color: white;
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 12px;
}
	
.card-content {
	padding: 15px;
}
	
.card-title {
	font-size: 16px;
	font-weight: bold;
	margin-bottom: 5px;
	display: block;
}
	
.card-desc {
	font-size: 13px;
	color: #888;
	margin-bottom: 10px;
	display: block;
}
	
.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
	
.rating {
	display: flex;
	align-items: center;
	color: #ffc53d;
	font-size: 14px;
	
	text {
		margin-left: 5px;
	}
}
	
.distance {
	font-size: 13px;
	color: #666;
}
	
/* 底部导航 */
.bottom-nav {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	background: white;
	display: flex;
	justify-content: space-around;
	padding: 10px 0;
	box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
	z-index: 300;
}
	
.nav-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}
	
.nav-text {
	font-size: 12px;
	color: #999;
	margin-top: 3px;
	
	&.active {
		color: #0089ff;
	}
}
</style>