<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {evForm} from "../../utils/script";

const data = defineProps<{ modelValue: iScope; }>();
const onValueChange = (newValue: string, key: string) => {
  data.modelValue[key  as keyof iScope]=newValue
};

const FelScope = ref<HTMLDivElement | null>(null);
onMounted(() => {
  if (FelScope.value) {
    const Wrap = FelScope.value;
    Wrap.id='d_' + Math.floor(Math.random() * 1000000);
    evForm.init(`#${Wrap.id}`);
  }
});
</script>    
<template ref="FelScope">
    <inpText id="scope" name="scope"  label="Scope" :value="data.modelValue.scope" @setChange="onValueChange" />
    <inpText id="is_default" name="is_default"  label="is_default" :value="data.modelValue.is_default" @setChange="onValueChange" />
    
</template>
