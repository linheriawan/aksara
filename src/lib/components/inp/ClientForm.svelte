<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {evForm} from "../../utils/script";

const data = defineProps<{ modelValue: iClient; }>();
const onValueChange = (newValue: string, key: string) => {
  data.modelValue[key  as keyof iClient]=newValue
};

const FelClient = ref<HTMLDivElement | null>(null);
onMounted(() => {
  if (FelClient.value) {
    const Wrap = FelClient.value;
    Wrap.id='d_' + Math.floor(Math.random() * 1000000);
    evForm.init(`#${Wrap.id}`);
  }
});
</script>    
<template ref="FelClient">
    <inpText id="client_id" name="client_id" label="ID" :value="data.modelValue.client_id" @setChange="onValueChange"/>
    <inpPass id="client_secret" name="client_secret"  label="Secret" :value="data.modelValue.client_secret" @setChange="onValueChange"/>
    <inpText id="redirect_uri" name="redirect_uri" label="client uri" :value="data.modelValue.redirect_uri" @setChange="onValueChange"/>
    <inpText id="grant_types" name="grant_types"  label="Allowed grant types" :value="data.modelValue.grant_types" @setChange="onValueChange"/>
    <inpText id="scope" name="scope"  label="Email" :value="data.modelValue.scope" @setChange="onValueChange"/>
    <inpText id="hash" name="hash" label="email_verified" :value="data.modelValue.hash" @setChange="onValueChange"/>
    <inpText id="hmac_key" name="hmac_key"  label="Scope" :value="data.modelValue.hmac_key"  @setChange="onValueChange"/>
</template>