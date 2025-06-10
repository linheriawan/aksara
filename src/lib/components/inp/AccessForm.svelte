<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {evForm} from "../../utils/script";

const data = defineProps<{ modelValue: iAccess; }>();
const onValueChange = (newValue: string, key: string) => {
  data.modelValue[key  as keyof iAccess]=newValue
};

const FelAccess = ref<HTMLDivElement | null>(null);
onMounted(() => {
  if (FelAccess.value) {
    const Wrap = FelAccess.value;
    Wrap.id='d_' + Math.floor(Math.random() * 1000000);
    evForm.init(`#${Wrap.id}`);
  }
});
</script>    
<template ref="FelAccess">
    <inpText id="access_token" name="access_token" label="access_token" :value="data.modelValue.access_token" @setChange="onValueChange"/>
    <inpPass id="client_id" name="client_id"  label="Password" :value="data.modelValue.client_id"  @setChange="onValueChange"/>
    <inpText id="user_id" name="user_id" label="First user_id" :value="data.modelValue.user_id" @setChange="onValueChange"/>
    <inpText id="expires" name="expires"  label="expires name" :value="data.modelValue.expires" @setChange="onValueChange"/>
    <inpText id="scope" name="scope"  label="Scope" :value="data.modelValue.scope"  @setChange="onValueChange"/>
</template>