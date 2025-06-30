<script lang="ts">
  import PageComponent from '$lib/components/pages/AccountManager.svelte';
  
  // Page configuration from route definition
  const pageConfig = {
  "type": "component",
  "title": "Account Management",
  "description": "User account settings and preferences",
  "componentPath": "$lib/components/pages/AccountManager.svelte",
  "objectRef": "UserProfile",
  "config": {
    "props": {
      "allowProfileEdit": true,
      "showBilling": true
    }
  }
};
  
  // Pass configuration to your component
  const componentProps = {
    pageConfig,
    objectRef: pageConfig.objectRef,
    config: pageConfig.config || {},
    ...(pageConfig.config?.props || {})
  };
</script>

<svelte:head>
  <title>{pageConfig.title || 'Page'}</title>
  {#if pageConfig.description}
    <meta name="description" content={pageConfig.description} />
  {/if}
</svelte:head>

<PageComponent {...componentProps} />