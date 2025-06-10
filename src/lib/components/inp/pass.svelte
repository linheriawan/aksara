<script setup lang="ts"> 
defineProps({
    id: String,
    name: String,
    label: String,
    value: String,
})
</script>
<template>
    <div class="fField">
        <label for="">{{ label }}</label>
        <input type="password" :id="id" :name="name" :placeholder="label" :value="value">
    </div>
</template>