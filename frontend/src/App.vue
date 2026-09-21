<template>
  <div class="app-root" :class="{ 'screen-mode': isScreenMode }">
    <header class="top-bar">
      <h1>🏭 数字孪生工厂产线实时监控系统</h1>
      <div class="status-row">
        <span class="ws-dot" :class="dotClass"></span>
        <span>{{ statusText }}</span>
        <span v-if="store.connected" class="fresh-time">更新于 {{ store.lastUpdateText }}</span>
        <span class="prod-count">今日产量: {{ store.data?.production || 0 }}</span>
        <button class="mode-toggle" @click="toggleMode">
          {{ isScreenMode ? '退出大屏' : '进入大屏' }}
        </button>
      </div>
    </header>

    <!-- 普通模式与大屏模式共用同一条提示，状态来自同一份连接 store -->
    <div v-if="showBanner" class="conn-banner" :class="bannerClass">
      <span>{{ bannerText }}</span>
      <button v-if="store.status !== 'connecting'" class="reconnect-btn" @click="store.reconnect()">立即重连</button>
    </div>

    <div class="main-grid">
      <div class="scene-col"><FactoryScene /></div>
      <div class="panel-col">
        <DeviceList />
        <AnomalyList />
      </div>
    </div>
    <div class="dashboard-row">
      <OEEChart />
      <TrendPanel />
      <FaultPie />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import FactoryScene from './components/FactoryScene.vue'
import DeviceList from './components/DeviceList.vue'
import AnomalyList from './components/AnomalyList.vue'
import OEEChart from './components/OEEChart.vue'
import TrendPanel from './components/TrendPanel.vue'
import FaultPie from './components/FaultPie.vue'
import { useFactoryStore } from './store/factory'

const MODE_KEY = 'factory-view-mode'
type ViewMode = 'normal' | 'screen'

// 刷新后仍停在进入前的模式
function readMode(): ViewMode {
  return localStorage.getItem(MODE_KEY) === 'screen' ? 'screen' : 'normal'
}

const viewMode = ref<ViewMode>(readMode())
const isScreenMode = computed(() => viewMode.value === 'screen')

function toggleMode() {
  viewMode.value = isScreenMode.value ? 'normal' : 'screen'
  localStorage.setItem(MODE_KEY, viewMode.value)
}

const store = useFactoryStore()

const dotClass = computed(() => ({
  on: store.status === 'connected',
  pending: store.status === 'connecting' || store.status === 'reconnecting'
}))

const statusText = computed(() => {
  switch (store.status) {
    case 'connected': return '实时连接中'
    case 'connecting': return '正在连接…'
    case 'reconnecting': return '连接断开，重连中…'
    default: return '连接断开'
  }
})

// 有过数据之后连接异常才算“数据停更”；首次未连接走另一套措辞
const showBanner = computed(
  () => store.status === 'reconnecting' || store.status === 'connecting' || store.status === 'disconnected'
)
const bannerText = computed(() => {
  if (store.status === 'connecting') return '正在建立实时连接，请稍候…'
  if (store.status === 'disconnected') return '实时连接已断开，数据为最后一次推送结果。'
  return store.lastUpdateAt !== null
    ? '连接已断开/数据推送停滞，设备状态与告警已停止更新，正在自动重连…'
    : '实时连接已断开，正在自动重连…'
})
const bannerClass = computed(() => ({
  'conn-banner--info': store.status === 'connecting',
  'conn-banner--stale': store.status === 'reconnecting' && store.lastUpdateAt !== null
}))

onMounted(() => store.connect())
onUnmounted(() => store.disconnect())
</script>

<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0a1628;color:#e0e6ed;overflow-x:hidden}
.app-root{min-height:100vh}
.top-bar{display:flex;justify-content:space-between;align-items:center;padding:12px 24px;background:linear-gradient(90deg,#0d2137,#1a3a5c);border-bottom:1px solid #1e3a5f}
.top-bar h1{font-size:1.2rem;color:#64b5f6}
.status-row{display:flex;gap:20px;align-items:center;font-size:13px;color:#94a3b8}
.ws-dot{width:10px;height:10px;border-radius:50%;background:#ef4444}
.ws-dot.on{background:#22c55e;box-shadow:0 0 8px #22c55e}
.ws-dot.pending{background:#fbbf24;box-shadow:0 0 8px #fbbf24;animation:dot-pulse 1s infinite}
@keyframes dot-pulse{50%{opacity:.35}}
.fresh-time{color:#64748b;font-size:12px}
.prod-count{color:#fbbf24;font-weight:600}
.mode-toggle{background:transparent;border:1px solid #2d5a8a;color:#64b5f6;border-radius:4px;padding:4px 12px;font-size:12px;cursor:pointer;transition:background .15s}
.mode-toggle:hover{background:#16324f}
.conn-banner{display:flex;align-items:center;gap:16px;margin:10px 24px 0;padding:8px 16px;background:#3f1d1d;border:1px solid #7f1d1d;color:#fca5a5;border-radius:6px;font-size:13px}
.conn-banner--stale{background:#4a3214;border-color:#92600a;color:#fcd34d}
.conn-banner--info{background:#142c42;border-color:#2d5a8a;color:#93c5fd}
.reconnect-btn{background:#7f1d1d;border:1px solid #b91c1c;color:#fee2e2;border-radius:4px;padding:2px 10px;font-size:12px;cursor:pointer}
.conn-banner--stale .reconnect-btn{background:#78500a;border-color:#a16207;color:#fef3c7}
.main-grid{display:grid;grid-template-columns:1fr 360px;gap:12px;padding:12px 24px;min-height:55vh}
.scene-col{background:#0d1b2a;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden}
.panel-col{display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:55vh}
.dashboard-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:0 24px 16px}

/* ===== 大屏常驻模式：仅切换布局/尺寸，组件不重建、配色不变、口径与图例共用同一实例 ===== */
.screen-mode{height:100vh;display:flex;flex-direction:column}
.screen-mode .top-bar{padding:16px 32px}
.screen-mode .top-bar h1{font-size:1.6rem}
.screen-mode .status-row{font-size:15px}
.screen-mode .conn-banner{margin:12px 32px 0;padding:12px 20px;font-size:15px}
.screen-mode .main-grid{flex:1;min-height:0;grid-template-columns:1fr 420px;padding:16px 32px 8px}
.screen-mode .panel-col{max-height:none}
.screen-mode .dashboard-row{padding:8px 32px 20px;grid-template-columns:1fr 1fr 1fr}
.screen-mode .dashboard-row .chart-panel h4{font-size:16px}
.screen-mode .dashboard-row .chart{height:300px}
.screen-mode .panel h4{font-size:16px}
.screen-mode .dev-row{padding:10px 10px}
.screen-mode .dev-type{font-size:14px}
.screen-mode .dev-id{font-size:13px}
.screen-mode .dev-metrics{font-size:13px}
.screen-mode .anomaly-row{font-size:13px}
.screen-mode .mode-toggle{font-size:13px;padding:6px 16px}
</style>
