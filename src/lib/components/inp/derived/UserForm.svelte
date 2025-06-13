<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {evForm} from "../../utils/script";

const data = defineProps<{ modelValue: iUser; }>();
const onValueChange = (newValue: string, key: string) => {
  data.modelValue[key  as keyof iUser]=newValue
};

const FelUser = ref<HTMLDivElement | null>(null);
onMounted(() => {
  if (FelUser.value) {
    const Wrap = FelUser.value;
    Wrap.id='d_' + Math.floor(Math.random() * 1000000);
    evForm.init(`#${Wrap.id}`);
  }
});
</script>    
<template ref="FelUser">
    <inpText id="username" name="username" label="Username" :value="data.modelValue.username"  @setChange="onValueChange" />
    <inpPass id="password" name="password"  label="Password" :value="data.modelValue.password" @setChange="onValueChange" />
    <inpText id="first_name" name="first_name" label="First name" :value="data.modelValue.first_name" @setChange="onValueChange" />
    <inpText id="last_name" name="last_name"  label="Last name" :value="data.modelValue.last_name" @setChange="onValueChange" />
    <inpText id="email" name="email"  label="Email" :value="data.modelValue.email" @setChange="onValueChange" />
    <inpText id="email_verified" name="email_verified" label="email_verified" :value="data.modelValue.email_verified" @setChange="onValueChange" />
    <inpText id="scope" name="scope"  label="Scope" :value="data.modelValue.scope" @setChange="onValueChange" />
</template>
