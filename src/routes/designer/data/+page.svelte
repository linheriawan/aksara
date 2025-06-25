<!-- src/routes/designer/data/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DataSourceStep from './DataSourceStep.svelte';
  import ObjectMappingStep from './ObjectMappingStep.svelte';
  import { STEPS } from "./conf";
  import type { DataSource, ObjectDef } from "./conf";

  // State
  let currentStep = $state(1);
  let dataSources = $state<DataSource[]>([]);
  let objects = $state<ObjectDef[]>([]);
  let dataSourceConfig = $state<DataSource | null>(null);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // Derived state
  const canProceed = $derived(currentStep < STEPS.length);
  const canGoBack = $derived(currentStep > 1);
  const currentStepData = $derived(STEPS[currentStep - 1]);
  
  // Load existing configurations on mount
  onMount(async () => {
    isLoading = true;
    error = null;
    
    try {
      const response = await fetch('/designer/data/load-configs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      dataSources = data.configs || [];
      objects = data.objects || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load configurations';
      console.error('Error loading existing configurations:', err);
    } finally {
      isLoading = false;
    }
  });
  
  // Navigation functions
  function nextStep() {
    if (canProceed) {
      currentStep++;
    }
  }
  
  function prevStep() {
    if (canGoBack) {
      currentStep--;
    }
  }
  
  // Event handlers
  function handleDataSourceComplete(config: DataSource) {
    dataSourceConfig = config;
    nextStep();
  }
  
  function handleObjectMappingBack() {
    prevStep();
  }
  
  async function handleWizardComplete(_objects: ObjectDef[]) {
    if (!dataSourceConfig) {
      error = 'No data source configuration found';
      return;
    }
    
    const finalConfig = {
      dataSource: dataSourceConfig,
      objects: _objects
    };
    
    isLoading = true;
    error = null;
    
    try {
      const response = await fetch('/designer/data/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalConfig)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save configuration');
      }
      
      // Success - navigate away
      goto('/');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save configuration';
      console.error('Error saving configuration:', err);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Data Access Wizard</h1>
    </div>
    
    <!-- Error Display -->
    {#if error}
      <div class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <p class="font-medium">Error:</p>
        <p>{error}</p>
        <button 
          on:click={() => error = null}
          class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Dismiss
        </button>
      </div>
    {/if}
    
    <!-- Progress Bar -->
    <div class="flex justify-center my-8">
      {#each STEPS as step, i}
        <div class="flex">
          <div class="flex flex-col items-center">
            <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors {
              i + 1 <= currentStep 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 text-gray-400'
            }">
              {i + 1}
            </div>
            <span class="text-sm mt-1 {i + 1 <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'}">{step.name}</span>
          </div>
          {#if i < STEPS.length - 1}
            <div class="mt-4 w-16 h-1 mx-2 transition-colors {
              i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-300'
            }"></div>
          {/if}
        </div>
      {/each}
    </div>
    <div class="text-center mb-4">
      <p class="text-gray-600">Step {currentStep} of {STEPS.length}: {currentStepData.name}</p>
    </div>
    
    
    <!-- Loading Overlay -->
    {#if isLoading}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="text-gray-700">Loading...</span>
        </div>
      </div>
    {/if}
    
    <!-- Wizard Content -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      {#if currentStep === 1}
        <DataSourceStep 
          dataSources={dataSources}
          onComplete={handleDataSourceComplete}
        />
      {:else if currentStep === 2}
        <ObjectMappingStep 
          {dataSourceConfig}
          Objects={objects}
          onComplete={handleWizardComplete}
          onBack={handleObjectMappingBack}
        />
      {/if}
    </div>
  </div>
</div>