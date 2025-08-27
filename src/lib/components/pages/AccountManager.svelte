<script lang="ts">
  export let pageConfig: any = {};
  export let objectRef: string = '';
  export let config: any = {};
  export let allowProfileEdit: boolean = true;
  export let showBilling: boolean = true;
</script>

<div class="account-manager">
  <h1>{pageConfig.title || 'Account Management'}</h1>
  
  <div class="account-sections">
    {#if allowProfileEdit}
      <section class="profile-section">
        <h2>Profile Settings</h2>
        <p>Manage your profile information</p>
      </section>
    {/if}
    
    {#if showBilling}
      <section class="billing-section">
        <h2>Billing Information</h2>
        <p>View and manage billing details</p>
      </section>
    {/if}
  </div>
</div>

<style>
  .account-manager {
    padding: 1rem;
  }
  
  .account-sections {
    margin-top: 1rem;
  }
  
  section {
    margin-bottom: 2rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
  }
  
  h1 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.25rem;
    font-weight: semibold;
    margin-bottom: 0.5rem;
  }
</style>