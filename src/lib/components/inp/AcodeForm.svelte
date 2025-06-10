<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {evForm} from "../../utils/script";

const data = defineProps<{ modelValue: iAcode; }>();
const onValueChange = (newValue: string, key: string) => {
  data.modelValue[key  as keyof iAcode]=newValue
};

const FelAcode = ref<HTMLDivElement | null>(null);
onMounted(() => {
  if (FelAcode.value) {
    const Wrap = FelAcode.value;
    Wrap.id='d_' + Math.floor(Math.random() * 1000000);
    evForm.init(`#${Wrap.id}`);
  }
});
</script>    
<template ref="FelAcode">
    <inpText id="authorization_code" name="authorization_code" label="authorization_code" :value="data.modelValue.authorization_code" @setChange="onValueChange"/>
    <inpText id="client_id" name="client_id"  label="Client" :value="data.modelValue.client_id"  @setChange="onValueChange"/>
    <inpText id="user_id" name="user_id" label="user_id" :value="data.modelValue.user_id" @setChange="onValueChange"/>
    <inpText id="redirect_uri" name="redirect_uri"  label="redirect uri" :value="data.modelValue.redirect_uri" @setChange="onValueChange"/>
    <inpText id="expires" name="expires"  label="expires" :value="data.modelValue.expires" @setChange="onValueChange"/>
    <inpText id="scope" name="scope"  label="Scope" :value="data.modelValue.scope"  @setChange="onValueChange"/>
    <inpText id="id_token" name="id_token" label="id_token" :value="data.modelValue.id_token" @setChange="onValueChange"/>
    <inpText id="challenge_method" name="challenge_method" label="challenge method" :value="data.modelValue.challenge_method" @setChange="onValueChange"/>
    <inpText id="challenge" name="challenge" label="challenge" :value="data.modelValue.challenge" @setChange="onValueChange"/>
</template>