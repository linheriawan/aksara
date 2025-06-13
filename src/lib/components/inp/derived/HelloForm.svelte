<script setup lang="ts">
import inpComplex from './complex.vue'
interface DD{
    name: { label:String, value:String },
    nicks: { label:String, value:String },
}
const data=defineProps<DD>()
</script>    
<template>
    <h2>Form Element:</h2>
    <inpComplex v-bind="data.name"/>
    <inpComplex v-bind="data.nicks"/>
    
</template>