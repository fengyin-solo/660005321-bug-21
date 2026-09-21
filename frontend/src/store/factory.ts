import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FactoryData } from '@/types'

// 大屏/普通模式由同一份 store 驱动，并持久化到 localStorage，
// 刷新后仍停留在进入前的模式。
const MODE_KEY = 'factory-view-mode'
type ViewMode = 'normal' | 'bigscreen'

function readMode(): ViewMode {
  return localStorage.getItem(MODE_KEY) === 'bigscreen' ? 'bigscreen' : 'normal'
}

// 数据刷新判定为 stale 的阈值（正常推送周期约 1s）
const STALE_MS = 5000

export const useFactoryStore = defineStore('factory', () => {
  const data = ref<FactoryData | null>(null)
  const connected = ref(false)
  const reconnecting = ref(false)
  const lastMessageAt = ref(0)

  let ws: WebSocket | null = null
  let retry = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let closedByUser = false

  // 普通模式与大屏共用这一份模式状态
  const mode = ref<ViewMode>(readMode())

  // 每秒走一次的响应式时钟，用于“连接还在但数据已停更”的挂机判定
  const now = ref(Date.now())
  if (typeof window !== 'undefined') {
    setInterval(() => { now.value = Date.now() }, 1000)
  }

  const stale = computed(() => {
    if (!connected.value) return false
    if (!lastMessageAt.value) return false
    return now.value - lastMessageAt.value > STALE_MS
  })

  function setMode(m: ViewMode) {
    mode.value = m
    localStorage.setItem(MODE_KEY, m)
  }

  function connect() {
    closedByUser = false
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const s = new WebSocket(`${protocol}//${location.hostname}:8000/ws`)
    ws = s

    s.onopen = () => {
      // 只有真正收到过数据才算“实时”，避免连接已建立但无推送时误报
      connected.value = true
      reconnecting.value = false
      retry = 0
    }
    s.onmessage = (e) => {
      try {
        data.value = JSON.parse(e.data)
        lastMessageAt.value = Date.now()
        // 挂机期间若推送恢复，stale 会随新数据自动解除
        connected.value = true
        reconnecting.value = false
        retry = 0
      } catch { /* 忽略损坏的帧 */ }
    }
    s.onclose = () => {
      connected.value = false
      ws = null
      if (!closedByUser) scheduleReconnect()
    }
    s.onerror = () => {
      // close 事件会紧随其后触发，重连在 onclose 中统一处理
      connected.value = false
    }
  }

  function scheduleReconnect() {
    if (closedByUser) return
    reconnecting.value = true
    if (retryTimer) clearTimeout(retryTimer)
    // 指数退避，封顶 10s：覆盖“断开再恢复”与长时间挂机后恢复
    const delay = Math.min(1000 * 2 ** retry, 10000)
    retry += 1
    retryTimer = setTimeout(() => connect(), delay)
  }

  function disconnect() {
    closedByUser = true
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
    ws?.close()
    ws = null
    connected.value = false
    reconnecting.value = false
  }

  return {
    data, connected, reconnecting, stale, lastMessageAt,
    mode, setMode, connect, disconnect
  }
})
