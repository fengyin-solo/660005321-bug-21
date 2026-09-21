<template>
  <transition name="banner">
    <div v-if="visible" class="data-banner" :class="store.stale ? 'stale' : 'down'">
      <span v-if="store.stale">⚠️ 实时数据已停止更新（连接未中断），以下设备状态与告警为 {{ lastUpdateText }} 的数据</span>
      <span v-else>⚠️ 与服务器连接已断开{{ store.reconnecting ? '，正在自动重连…' : '' }}，当前显示最后一次接收到的数据</span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFactoryStore } from '../store/factory'

const store = useFactoryStore()
// 从未收到过数据（首屏连接建立前）不弹告警，避免误报
const visible = computed(() =>
  store.lastMessageAt > 0 && (!store.connected || store.stale))
const lastUpdateText = computed(() =>
  store.lastMessageAt ? new Date(store.lastMessageAt).toLocaleTimeString() : '—')
</script>

<style scoped>
.data-banner{padding:6px 16px;font-size:12px;text-align:center;font-weight:600}
.data-banner.down{background:#7f1d1d;color:#fecaca;border-bottom:1px solid #b91c1c}
.data-banner.stale{background:#78350f;color:#fde68a;border-bottom:1px solid #d97706}
.banner-enter-active,.banner-leave-active{transition:opacity .25s}
.banner-enter-from,.banner-leave-to{opacity:0}
</style>
