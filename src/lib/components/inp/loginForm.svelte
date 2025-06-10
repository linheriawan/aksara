<script setup lang="ts">
defineProps(['provider','token']) 
</script>    
<template>
    <form class="w-fit justify-self-center " :action="'http://localhost:3000/api/auth/signin/'+provider.toLocaleLowerCase()+''" method="POST">
        <input type="hidden" name="csrfToken" :value="token">
        <input type="hidden" name="callbackUrl" value="http://localhost:3000/">
        <button type="submit" class="flex items-center btn-clean px-3 gap-2 w-48">
            <icoGithub v-if="provider.toLocaleLowerCase()=='github'"/>
            <icoGoogle v-if="provider.toLocaleLowerCase()=='google'"/>
            <span>Sign in with {{ provider }}</span>
        </button>
    </form>
</template>
