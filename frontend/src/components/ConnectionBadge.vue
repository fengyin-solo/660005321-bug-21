<template>
  <span class="conn-badge" :class="level">
    <span class="ws-dot" :class="{ on: level === 'live', busy: level === 'stale' || level === 'reconnect' }"></span>
    <span>{{ text }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFactoryStore } from '../store/factory'

const store = useFactoryStore()

// 唯一口径：断开(红) / 重连中(黄) / 已连接但数据停更(黄) / 实时(绿)
const level = computed<'down' | 'reconnect' | 'stale' | 'live'>(() => {
  if (!store.connected) return store.reconnecting ? 'reconnect' : 'down'
  return store.stale ? 'stale' : 'live'
})

const text = computed(() => ({
  down: '连接断开',
  reconnect: '连接断开·重连中',
  stale: '连接正常·数据停更',
  live: '实时连接中'
}[level.value]))
</script>

<style scoped>
.conn-badge{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#94a3b8}
.ws-dot{width:10px;height:10px;border-radius:50%;background:#ef4444;flex:none}
.ws-dot.on{background:#22c55e;box-shadow:0 0 8px #22c55e}
.ws-dot.busy{background:#fbbf24;box-shadow:0 0 8px #fbbf24;animation:pulse 1.2s ease-in-out infinite}
.conn-badge.live{color:#86efac}
.conn-badge.down{color:#fca5a5}
.conn-badge.stale,.conn-badge.reconnect{color:#fcd34d}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
</style>
