<script setup>
import { onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { fetchAnimeImage } from '@/utils/animeImage'

onMounted(async () => {
  // 网上拉一张二次元图作为全站背景（暗色模式会变灰，见 global.css）
  const bg = await fetchAnimeImage('bg')
  if (bg) {
    document.documentElement.style.setProperty('--bg-image', `url("${bg}")`)
  }
})
</script>

<template>
  <NavBar />
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>
