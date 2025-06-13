<script setup lang="ts">
import { ref, reactive,onMounted } from 'vue';
import {evForm} from "../../utils/script";

// let data=defineProps({}as iOrg)////ref<iUser>({} as iUser)// defineProps<iUser>()
// const data = defineProps<{fmObj: iOrg}>();
const props = defineProps<{ modelValue: iOrg; }>();

const onValueChange = (newValue: string, key: string) => {
  props.modelValue[key  as keyof iOrg]=newValue
};

const FelOrg = ref<HTMLDivElement | null>(null);
onMounted(() => {
  if (FelOrg.value) {
    const Wrap = FelOrg.value;
    Wrap.id='d_' + Math.floor(Math.random() * 1000000);
    evForm.init(`#${Wrap.id}`);
  }
});
</script>    
<template ref="FelOrg">
  <inpText id="org_id" name="org_id" label="ID" :value="props.modelValue.org_id" @setChange="onValueChange" />
  <inpText id="name" name="name" label="Name" :value="props.modelValue.name" @setChange="onValueChange" />
  <inpText id="parent" name="parent"  label="Parent" :value="props.modelValue.parent" @setChange="onValueChange" />    
</template>
