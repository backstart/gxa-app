<template>
	<!-- 新增根节点容器，包裹所有内容 -->
	<view class="archivelist-root">
  <view class="waterfall-container">
    <!-- 2列瀑布流 -->
    <view class="waterfall-grid">
      <view class="waterfall-item" v-for="(item, index) in list" :key="index" @click="clickitem(item)">
        <image 
          class="item-img" 
          :src="item.image" 
          mode="aspectFill" 
          lazy-load
        />
        <view class="item-title">{{ item.title }}</view>
        <view class="item-detail">{{ item.detail }}</view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="load-tips" v-if="loading">加载中...</view>
    <view class="load-tips" v-if="!hasMore && list.length > 0">没有更多内容啦~</view>
  </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 接收父组件属性
const props = defineProps({
  pageSize: {
    type: Number,
    default: 12
  }
})

// 暴露事件给父组件
const emit = defineEmits(['loadFinish','clickitem'])

// 响应式数据
const list = ref([])       // 列表数据
const loading = ref(false) // 加载状态
const hasMore = ref(true)  // 是否有更多数据
const page = ref(1)        // 当前页码
	

	function clickitem(e) {
		console.log(e);
		emit("clickitem", e);
	}
// 预设模拟数据池
const titlePool = [
  "春日樱花摄影技巧分享", "极简主义家居设计案例", "新手烘焙入门：戚风蛋糕教程",
  "川西自驾游路线规划", "复古胶片滤镜调色参数", "多肉植物养护全攻略",
  "日式拉面汤底熬制方法", "户外露营装备清单推荐", "手绘插画零基础入门",
  "咖啡手冲技巧详解", "北欧风格装修避坑指南", "宠物猫咪行为解读"
]

const detailPool = [
  "分享3个春日樱花拍摄的关键技巧：光线选择、构图方法和后期调色，新手也能拍出氛围感大片！",
  "以白色为主调，搭配原木色家具，打造简约又温馨的家居空间，附具体尺寸和软装链接。",
  "详细拆解戚风蛋糕失败原因，从蛋白打发到烤箱温度控制，一步步教你做出蓬松不塌陷的蛋糕。",
  "成都出发→四姑娘山→丹巴→新都桥→理塘，7天6晚川西环线攻略，含住宿推荐和注意事项。",
  "VSCO复古胶片滤镜参数分享，适合街拍和人像，附手机修图步骤，轻松get电影感照片。",
  "多肉服盆期养护要点：土壤配比、浇水频率、光照控制，解决多肉化水、徒长问题。",
  "豚骨汤底熬制需要12小时以上，关键在于骨头焯水和火候控制，附配菜搭配建议。",
  "轻量化露营装备清单，适合新手的性价比选择，包含帐篷、睡袋、炊具等必备品。",
  "从线条练习到色彩搭配，零基础手绘插画入门教程，每天10分钟，30天可见进步。",
  "手冲咖啡的水粉比、水温控制和萃取时间详解，不同咖啡豆的研磨度选择技巧。",
  "北欧风装修容易忽略的5个细节：墙面颜色、灯具选择、收纳设计，避坑指南来了！",
  "猫咪摇尾巴、竖耳朵的不同含义，解读猫咪常见行为，增进和主子的感情。"
]

const imagePool = [
  "https://picsum.photos/id/10/400/500", "https://picsum.photos/id/42/400/500", 
  "https://picsum.photos/id/292/400/500", "https://picsum.photos/id/155/400/500",
  "https://picsum.photos/id/96/400/500", "https://picsum.photos/id/118/400/500",
  "https://picsum.photos/id/225/400/500", "https://picsum.photos/id/283/400/500",
  "https://picsum.photos/id/65/400/500", "https://picsum.photos/id/766/400/500",
  "https://picsum.photos/id/164/400/500", "https://picsum.photos/id/40/400/500"
]

// 组件挂载后初始化加载
onMounted(() => {
  fetchData()
})

// 数据请求核心方法
const fetchData = async (isRefresh = false) => {
  if (loading.value || (!hasMore.value && !isRefresh)) return
  loading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 800)) // 模拟接口延迟

    // 生成当前页数据（增加防御性检查）
    let currentPageData = []
    const poolLength = Math.min(imagePool.length, titlePool.length, detailPool.length)
    
    if (poolLength > 0) {
      currentPageData = Array.from({ length: props.pageSize }, (_, i) => {
        const globalIndex = (isRefresh ? 0 : (page.value - 1) * props.pageSize) + i
        const poolIndex = globalIndex % poolLength
        return {
          image: imagePool[poolIndex] || 'https://picsum.photos/400/500',
          title: titlePool[poolIndex] || '默认标题',
          detail: detailPool[poolIndex] || '默认详情描述'
        }
      })
    }

    // 更新列表数据
    if (isRefresh) {
      list.value = currentPageData
      page.value = 2 // 刷新后下一页从2开始
      hasMore.value = true // 刷新重置“是否有更多”
    } else {
      list.value = [...list.value, ...currentPageData]
      page.value++
    }

    // 模拟无更多数据（第5页后停止）
    if (page.value > 5) {
      hasMore.value = false
    }

    // 通知父组件加载完成
    emit('loadFinish', { 
      hasMore: hasMore.value, 
      listLength: list.value.length 
    })
  } catch (err) {
    console.error('数据加载失败：', err)
    uni.showToast({ title: '加载失败', icon: 'error' })
  } finally {
    loading.value = false
  }
}

// 暴露方法给父组件调用（刷新/加载更多）
defineExpose({
  fetchData, // 加载更多：ref.fetchData()
  refresh: () => fetchData(true) // 刷新：ref.refresh()
})
</script>

<style scoped>
.waterfall-container {
  padding: 15rpx;
  background-color: #f5f5f5;
}

.waterfall-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.waterfall-item {
  background-color: #fff;
  border-radius: 15rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.waterfall-item:hover {
  transform: translateY(-4rpx);
}

.item-img {
  width: 100%;
  height: 380rpx;
  display: block;
}

.item-title {
  padding: 18rpx 18rpx 10rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-detail {
  padding: 0 18rpx 18rpx;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.load-tips {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: #999;
}
</style>