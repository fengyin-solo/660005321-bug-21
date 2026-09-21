<template>
  <BigScreen v-if="store.mode === 'bigscreen'" />
  <div v-else class="app-root">
    <header class="top-bar">
      <h1>🏭 数字孪生工厂产线实时监控系统</h1>
      <div class="status-row">
        <ConnectionBadge />
        <span class="prod-count">今日产量: {{ store.data?.production || 0 }}</span>
        <button class="screen-btn" @click="store.setMode('bigscreen')">⛶ 大屏模式</button>
      </div>
    </header>
    <DataStaleBanner />
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
import { onMounted, onUnmounted } from 'vue'
import FactoryScene from './components/FactoryScene.vue'
import DeviceList from './components/DeviceList.vue'
import AnomalyList from './components/AnomalyList.vue'
import OEEChart from './components/OEEChart.vue'
import TrendPanel from './components/TrendPanel.vue'
import FaultPie from './components/FaultPie.vue'
import BigScreen from './components/BigScreen.vue'
import ConnectionBadge from './components/ConnectionBadge.vue'
import DataStaleBanner from './components/DataStaleBanner.vue'
import { useFactoryStore } from './store/factory'
const store = useFactoryStore()
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
.screen-btn{background:transparent;border:1px solid #3b82f6;color:#93c5fd;padding:4px 12px;border-radius:6px;font-size:13px;cursor:pointer}
.screen-btn:hover{background:#1a3a5c}
.prod-count{color:#fbbf24;font-weight:600}
.main-grid{display:grid;grid-template-columns:1fr 360px;gap:12px;padding:12px 24px;min-height:55vh}
.scene-col{background:#0d1b2a;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden}
.panel-col{display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:55vh}
.dashboard-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:0 24px 16px}
</style>
