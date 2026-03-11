<template>
  <AppPage :bg="PAGE_BG">
    <view class="redirectPage pageBg"></view>
  </AppPage>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app';
import AppPage from '@/components/app/AppPage.vue';

const PAGE_BG = 'linear-gradient(to bottom, rgba(0,0,0,0), #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4E2D8)';

onLoad(() => {
  uni.redirectTo({ url: '/pages/assets/inventory/index' });
});
</script>

<style lang="scss" scoped>
.redirectPage {
  min-height: 100vh;
}
</style>
