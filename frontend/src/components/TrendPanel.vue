<template>
  <div class="chart-panel"><h4>📈 温度/振动趋势</h4><div ref="chart" class="chart"></div></div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useFactoryStore } from '../store/factory'
const store = useFactoryStore(); const chart = ref<HTMLDivElement>(); let inst: echarts.ECharts|null=null
let ro: ResizeObserver|null = null
function update() {
  if (!inst||!store.data) return
  const ds = store.data.devices.slice(0,4)
  inst.setOption({
    backgroundColor:'transparent', grid:{left:40,right:15,top:10,bottom:32},
    xAxis:{type:'category',data:ds.map(d=>d.type+'-'+d.id),axisLabel:{color:'#94a3b8',fontSize:9,rotate:20}},
    yAxis:[
      {type:'value',name:'°C',nameTextStyle:{color:'#94a3b8',fontSize:9},axisLabel:{color:'#94a3b8'}},
      {type:'value',name:'mm/s',nameTextStyle:{color:'#94a3b8',fontSize:9},axisLabel:{color:'#94a3b8'}}
    ],
    series:[
      // 双 Y 轴：温度走左轴(°C)，振动走右轴(mm/s,原始值)，避免量级差异导致振动被压扁
      {type:'bar',data:ds.map(d=>d.temperature),name:'温度(°C)',itemStyle:{color:'#f97316'},yAxisIndex:0},
      {type:'line',data:ds.map(d=>d.vibration),name:'振动(mm/s)',itemStyle:{color:'#a78bfa'},smooth:true,yAxisIndex:1}
    ],
    animation:false,
    legend:{bottom:0,textStyle:{color:'#94a3b8',fontSize:10},itemWidth:10,itemHeight:10,type:'scroll'}
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
<style scoped>.chart-panel{background:#0d1b2a;border-radius:8px;padding:12px;border:1px solid #1e3a5f}.chart-panel h4{color:#64b5f6;font-size:13px;margin-bottom:4px}.chart{width:100%;height:200px}</style>
