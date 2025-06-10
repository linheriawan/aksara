<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {evForm} from "../../utils/script";

const data = defineProps<{ modelValue: iRefresh; }>();
const onValueChange = (newValue: string, key: string) => {
  data.modelValue[key  as keyof iRefresh]=newValue
};

const FelRefresh = ref<HTMLDivElement | null>(null);
onMounted(() => {
  if (FelRefresh.value) {
    const Wrap = FelRefresh.value;
    Wrap.id='d_' + Math.floor(Math.random() * 1000000);
    evForm.init(`#${Wrap.id}`);
  }
});
</script>    
<template ref="FelRefresh">
    <inpText id="refresh_token" name="refresh_token" label="refresh_token" :value="data.modelValue.refresh_token" @setChange="onValueChange" />
    <inpPass id="client_id" name="client_id"  label="client_id" :value="data.modelValue.client_id" @setChange="onValueChange"/>
    <inpText id="user_id" name="user_id" label="user_id name" :value="data.modelValue.user_id" @setChange="onValueChange"/>
    <inpText id="expires" name="expires"  label="expires name" :value="data.modelValue.expires" @setChange="onValueChange"/>
    <inpText id="scope" name="scope"  label="Scope" :value="data.modelValue.scope"  @setChange="onValueChange"/>
</template>