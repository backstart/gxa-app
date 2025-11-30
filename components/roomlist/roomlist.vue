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
      <view class="item-title">{{ item.roomInfo }}</view>
            <view class="item-detail">{{ item.tenantName }}</view>
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
  },
  list: {
  	type: [{}],
  	default () {
  		return [{
  			tenantName: "201",
  			roomInfo: "张三",
  			image: 'https://picsum.photos/id/1016/400/500岁',
  			
  		}]
  	}
  }
})

// 暴露事件给父组件
const emit = defineEmits(['loadFinish','clickitem','listChange'])

// 响应式数据
const list = ref([])       // 列表数据
const loading = ref(false) // 加载状态
const hasMore = ref(true)  // 是否有更多数据
const page = ref(1)        // 当前页码
	


	function clickitem(e) {
		console.log(e);
		emit("clickitem", e);
	}
// 预设租房信息数据池（人像图片+房间信息+入住人）
const roomInfoPool = [
  "201",
 "202",
 "203",
 "204",
 "205",
 "206",
 "207",
 "208"
]

const tenantNamePool = [
  "入住人：张三",
  "入住人：李四",
  "入住人：王五",
  "入住人：赵六",
  "入住人：孙七",
  "入住人：周八",
  "入住人：吴九",
  "入住人：郑十",
  "入住人：钱十一",
  "入住人：孙十二",
  "入住人：李十三",
  "入住人：张十四"
]

// 人像图片池（picsum人像分类id）
const avatarImagePool = [
  "https://picsum.photos/id/1001/400/500", // 人像
  "https://picsum.photos/id/1002/400/500",
  "https://picsum.photos/id/1003/400/500",
  "https://picsum.photos/id/1004/400/500",
  "https://picsum.photos/id/1005/400/500",
  "https://picsum.photos/id/1006/400/500",
  "https://picsum.photos/id/1007/400/500",
  "https://picsum.photos/id/1008/400/500",
  "https://picsum.photos/id/1009/400/500",
  "https://picsum.photos/id/1010/400/500",
  "https://picsum.photos/id/1011/400/500",
  "https://picsum.photos/id/1012/400/500"
]

// 组件挂载后初始化加载
onMounted(() => {
  fetchData()
})

// 数据请求核心方法（租房信息）
const fetchData = async (isRefresh = false) => {
  if (loading.value || (!hasMore.value && !isRefresh)) return
  loading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 800)) // 模拟接口延迟

    // 生成租房数据
    let currentPageData = []
    const poolLength = Math.min(avatarImagePool.length, roomInfoPool.length, tenantNamePool.length)
    
    if (poolLength > 0) {
      currentPageData = Array.from({ length: props.pageSize }, (_, i) => {
        const globalIndex = (isRefresh ? 0 : (page.value - 1) * props.pageSize) + i
        const poolIndex = globalIndex % poolLength
        return {
          image: avatarImagePool[poolIndex] || 'https://picsum.photos/id/1005/400/500', // 兜底人像图
          roomInfo: roomInfoPool[poolIndex] || '默认房间信息',
          tenantName: tenantNamePool[poolIndex] || '入住人：未知',
          id: globalIndex + 1 // 房源ID
        }
      })
    }

   // 更新列表数据
       if (isRefresh) {
         list.value = currentPageData
         page.value = 2
         hasMore.value = true
       } else {
         list.value = [...list.value, ...currentPageData]
         page.value++
       }
   
       // 模拟无更多数据（第5页后停止）
       if (page.value > 5) {
         hasMore.value = false
       }
   
       // 通知父组件列表变化
       emit('listChange', list.value)
       emit('loadFinish', { hasMore: hasMore.value, listLength: list.value.length })
     } catch (err) {
       console.error('房源数据加载失败：', err)
       uni.showToast({ title: '加载失败', icon: 'error' })
     } finally {
       loading.value = false
     }
   }
   
   // 父组件直接赋值list的方法
   const setList = (newList) => {
     if (Array.isArray(newList)) {
       list.value = newList
       emit('listChange', list.value)
     }
   }
   
   // 暴露数据和方法给父组件
   defineExpose({
     list,          // 直接暴露list数据
     fetchData,     // 加载更多方法
     refresh: () => fetchData(true), // 刷新方法
     setList        // 父组件赋值list的方法
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