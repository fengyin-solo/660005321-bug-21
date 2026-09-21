<template>
  <div class="screen-root">
    <header class="screen-top">
      <h1 class="screen-title">🏭 数字孪生工厂产线实时监控系统</h1>
      <div class="screen-status">
        <ConnectionBadge />
        <span class="prod-count">今日产量: {{ store.data?.production || 0 }}</span>
        <button class="exit-btn" @click="store.setMode('normal')">⤢ 退出大屏</button>
      </div>
    </header>
    <DataStaleBanner />
    <div class="screen-body">
      <section class="left-col">
        <DeviceList big />
        <AnomalyList big />
      </section>
      <section class="center-col">
        <div class="scene-panel"><FactoryScene /></div>
        <div class="center-charts">
          <OEEChart /><TrendPanel />
        </div>
      </section>
      <section class="right-col">
        <FaultPie big />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import FactoryScene from './FactoryScene.vue'
import DeviceList from './DeviceList.vue'
import AnomalyList from './AnomalyList.vue'
import OEEChart from './OEEChart.vue'
import TrendPanel from './TrendPanel.vue'
import FaultPie from './FaultPie.vue'
import ConnectionBadge from './ConnectionBadge.vue'
import DataStaleBanner from './DataStaleBanner.vue'
import { useFactoryStore } from '../store/factory'
const store = useFactoryStore()
</script>

<style scoped>
.screen-root{
  min-height:100vh;
  display:flex;flex-direction:column;
  background:#0a1628;color:#e0e6ed;
}
.screen-top{
  display:flex;justify-content:space-between;align-items:center;
  padding:14px 32px;
  background:linear-gradient(90deg,#0d2137,#1a3a5c);
  border-bottom:1px solid #1e3a5f;
}
.screen-title{font-size:1.5rem;color:#64b5f6;letter-spacing:2px}
.screen-status{display:flex;gap:28px;align-items:center;font-size:15px;color:#94a3b8}
.prod-count{color:#fbbf24;font-weight:600}
.exit-btn{
  background:transparent;border:1px solid #3b82f6;color:#93c5fd;
  padding:5px 14px;border-radius:6px;font-size:13px;cursor:pointer;
}
.exit-btn:hover{background:#1a3a5c}
.screen-body{
  flex:1;display:grid;
  grid-template-columns:minmax(300px,26%) 1fr minmax(300px,24%);
  gap:14px;padding:14px;min-height:0;
}
.left-col,.right-col{display:flex;flex-direction:column;gap:14px;min-height:0}
.center-col{display:flex;flex-direction:column;gap:14px;min-height:0}
.scene-panel{
  flex:1.4;background:#0d1b2a;border-radius:12px;border:1px solid #1e3a5f;
  overflow:hidden;min-height:35vh;
}
.center-charts{
  flex:1;display:grid;grid-template-columns:1fr 1fr;gap:14px;min-height:28vh;
}
</style>
