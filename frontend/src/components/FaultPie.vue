<template>
  <div class="chart-panel" :class="{big}"><h4>🥧 故障分布</h4><div ref="chart" class="chart"></div></div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useFactoryStore } from '../store/factory'
import { DEVICE_COLORS } from '../types'
withDefaults(defineProps<{ big?: boolean }>(), { big: false })
const store = useFactoryStore(); const chart = ref<HTMLDivElement>(); let inst: echarts.ECharts|null=null
let ro: ResizeObserver|null = null
function update() {
  if (!inst||!store.data) return
  const faults: Record<string,number> = {}
  store.data.devices.forEach(d=>{ faults[d.type] = (faults[d.type]||0) + d.fault_count })
  // 口径：按设备类型汇总 fault_count；颜色与 3D 场景设备配色（DEVICE_COLORS）保持一致
  const types = Object.keys(faults).sort()
  const data = types.map(k=>({
    name:k, value:faults[k], itemStyle:{color: DEVICE_COLORS[k] || '#95a5a6'}
  }))
  inst.setOption({
    backgroundColor:'transparent',
    legend:{bottom:0,textStyle:{color:'#94a3b8',fontSize:10},itemWidth:10,itemHeight:10,type:'scroll'},
    series:[{type:'pie',data,radius:['40%','65%'],center:['50%','48%'],label:{color:'#94a3b8',fontSize:10},
      itemStyle:{borderColor:'#0d1b2a',borderWidth:2}}],animation:false
  }, true)
}
onMounted(()=>{
  if(chart.value){
    inst=echarts.init(chart.value);update()
    ro=new ResizeObserver(()=>inst?.resize()); ro.observe(chart.value)
  }
})
watch(()=>store.data,update)
onUnmounted(()=>{ro?.disconnect();inst?.dispose()})
</script>
<style scoped>.chart-panel{background:#0d1b2a;border-radius:8px;padding:12px;border:1px solid #1e3a5f}.chart-panel h4{color:#64b5f6;font-size:13px;margin-bottom:4px}.chart{width:100%;height:200px}
.chart-panel.big{flex:1;min-height:0;display:flex;flex-direction:column}
.chart-panel.big .chart{flex:1;height:auto}</style>
