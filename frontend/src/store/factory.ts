import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FactoryData } from '@/types'

// 后端模拟线程每 1s 推送一帧；超过此时长没收到数据即认为推送已停滞
const STALE_TIMEOUT = 6000
const FRESHNESS_CHECK_INTERVAL = 2000
const RECONNECT_BASE = 1000
const RECONNECT_MAX = 10000

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export const useFactoryStore = defineStore('factory', () => {
  // data / 连接状态在普通模式与大屏模式之间共享，整个应用只存在这一份
  const data = ref<FactoryData | null>(null)
  const status = ref<ConnectionStatus>('connecting')
  const connected = ref(false)
  const lastUpdateAt = ref<number | null>(null)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let backoff = RECONNECT_BASE
  let everConnected = false
  let manualClose = false

  const lastUpdateText = computed(() =>
    lastUpdateAt.value ? new Date(lastUpdateAt.value).toLocaleTimeString() : ''
  )

  function clearReconnectTimer() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  // socket 处于 OPEN 但长时间没有数据（长时间挂机 / 系统休眠 / 服务端停止推送）时，
  // 主动断开并走重连，避免顶部仍显示“实时”而数据早已冻结
  function checkFreshness() {
    if (
      ws &&
      ws.readyState === WebSocket.OPEN &&
      lastUpdateAt.value !== null &&
      Date.now() - lastUpdateAt.value > STALE_TIMEOUT
    ) {
      const stale = ws
      ws = null
      try {
        stale.onclose = null
        stale.close()
      } catch {}
      connected.value = false
      status.value = 'reconnecting'
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (manualClose || reconnectTimer !== null) return
    status.value = 'reconnecting'
    const delay = backoff
    backoff = Math.min(backoff * 2, RECONNECT_MAX)
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (!manualClose) openSocket()
    }, delay)
  }

  function openSocket() {
    if (ws) return
    if (!manualClose) status.value = everConnected ? 'reconnecting' : 'connecting'
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const s = new WebSocket(`${protocol}//${location.hostname}:8000/ws`)
    ws = s

    s.onopen = () => {
      // 必须收到第一帧数据才算真正恢复，避免空连接被显示成“实时”
      backoff = RECONNECT_BASE
    }
    s.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data)
        data.value = parsed
        lastUpdateAt.value = Date.now()
        everConnected = true
        backoff = RECONNECT_BASE
        clearReconnectTimer()
        status.value = 'connected'
        connected.value = true
      } catch {}
    }
    s.onclose = () => {
      if (ws === s) ws = null
      connected.value = false
      if (manualClose) {
        status.value = 'disconnected'
      } else {
        // 断开后保留最后一帧数据，同时给出提示并重连
        status.value = 'reconnecting'
        scheduleReconnect()
      }
    }
  }

  function connect() {
    manualClose = false
    if (ws || reconnectTimer !== null) return
    openSocket()
  }

  // 手动立即重连（顶部提示条按钮）
  function reconnect() {
    manualClose = false
    clearReconnectTimer()
    if (ws) {
      const s = ws
      ws = null
      try {
        s.onclose = null
        s.close()
      } catch {}
    }
    connected.value = false
    status.value = everConnected ? 'reconnecting' : 'connecting'
    openSocket()
  }

  function disconnect() {
    manualClose = true
    clearReconnectTimer()
    if (ws) {
      const s = ws
      ws = null
      try {
        s.close()
      } catch {}
    }
    connected.value = false
    status.value = 'disconnected'
  }

  setInterval(checkFreshness, FRESHNESS_CHECK_INTERVAL)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkFreshness()
  })

  return {
    data,
    status,
    connected,
    lastUpdateAt,
    lastUpdateText,
    connect,
    reconnect,
    disconnect
  }
})
