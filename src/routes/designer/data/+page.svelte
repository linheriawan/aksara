<!-- src/routes/designer/data/+page.svelte -->
<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import DataSourceStep from './DataSourceStep.svelte';
import SelectObject from './SelectObject.svelte';
import MappingStep from './MappingStep.svelte';
import ConfigurationReview from './ConfigurationReview.svelte';
import { STEPS } from "./conf";
import type { DataSource, ObjectDef } from "./conf";

// State management with proper runes
let currentStep = $state(1);
let dataSources = $state<DataSource[]>([]);
let objects = $state<ObjectDef[]>([]);
let currentObject = $state<ObjectDef | null>(null);
let dataSourceConfig = $state<DataSource | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived state
const canProceed = $derived(currentStep < STEPS.length);
const canGoBack = $derived(currentStep > 1);
const currentStepData = $derived(STEPS[currentStep - 1]);

// Step status indicators
const getStepStatus = $derived(() => {
  return [{},
    {
      completed: !!dataSourceConfig,
      current: currentStep === 1,
      info: dataSourceConfig ? `${dataSourceConfig.name} (${dataSourceConfig.type.toUpperCase()})` : null
    },
    {
      completed: currentObject !== null,
      current: currentStep === 2,
      info: currentObject?.name ? `Selected: ${currentObject.name}` : null
    },
    {
      completed: currentObject && currentObject.fields.length > 0,
      current: currentStep === 3,
      info: currentObject?.fields ? `${currentObject.name}: ${currentObject.fields.length} fields` : null
    },
    {
      completed: false,
      current: currentStep === 4,
      info: dataSourceConfig && currentObject && currentObject.fields.length > 0 ? 'Ready to save' : null
    }
  ];
});

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
    
    // If we have existing data, potentially restore the data source config
    if (dataSources.length > 0 && !dataSourceConfig) {
      // You might want to implement logic to restore the last used data source
      // For now, we'll let the user select it again
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load configurations';
    console.error('Error loading existing configurations:', err);
  } finally {
    isLoading = false;
  }
});

// Reload objects when data source changes
$effect(() => {
  if (dataSourceConfig && currentStep === 2) {
    async function loadObjects() {
      try {
        const response = await fetch(`/designer/data/load-configs?dataSource=${dataSourceConfig?.name}`);
        if (response.ok) {
          const data = await response.json();
          objects = data.objects || [];
        }
      } catch (err) {
        console.error('Error loading data source objects:', err);
      }
    }
    
    loadObjects();
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

// Event handlers for step 1: Data Source
async function handleDataSourceComplete(config: DataSource) {
  dataSourceConfig = config;
  
  // Load objects for this specific data source
  try {
    const response = await fetch(`/designer/data/load-configs?dataSource=${config.name}`);
    if (response.ok) {
      const data = await response.json();
      objects = data.objects || [];
    }
  } catch (err) {
    console.error('Error loading data source objects:', err);
    objects = [];
  }
  
  nextStep();
}

// Event handlers for step 2: Object Selection
function handleObjectSelect(selectedObject: ObjectDef, index: number) {
  currentObject = selectedObject;
  nextStep();
}

function handleNewObject(newObject: ObjectDef) {
  currentObject = newObject;
  nextStep();
}

function handleObjectSelectionBack() {
  // Clear objects when going back to data source selection
  objects = [];
  currentObject = null;
  prevStep();
}

// Event handlers for step 3: Field Mapping
function handleMappingSave(mappedObject: ObjectDef) {
  currentObject = mappedObject;
  nextStep();
}

function handleMappingBack() {
  prevStep();
}

// Event handlers for step 4: Review
function handleReviewBack() {
  prevStep();
}

async function handleWizardComplete(finalObject: ObjectDef) {
  if (!dataSourceConfig) {
    error = 'No data source configuration found';
    return;
  }
  
  // Update object with the data source reference
  const objectWithDataSource: ObjectDef = {
    ...finalObject,
    dataSource: dataSourceConfig.name
  };
  
  const finalConfig = {
    dataSource: dataSourceConfig,
    object: objectWithDataSource
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
    
    const result = await response.json();
    console.log('Configuration saved successfully:', result);
    
    // Success - navigate away
    goto('/designer');
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to save configuration';
    console.error('Error saving configuration:', err);
  } finally {
    isLoading = false;
  }
}

function dismissError() {
  error = null;
}
</script>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-6xl mx-auto px-4">
    <h1 class="text-center mb-8 text-3xl font-bold text-gray-900">Data Access Wizard</h1>
    
    <!-- Error Display -->
    {#if error}
      <div class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-medium">Error:</p>
            <p class="mt-1">{error}</p>
          </div>
          <button 
            onclick={dismissError}
            class="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Enhanced Progress Bar with State Information -->
    <div class="mb-8">
      <div class="flex justify-center items-center">
        {#each STEPS as step, i}
          {@const stepStatus = getStepStatus()[step.id]}
          <div class="flex items-center">
            <!-- Step Circle -->
            <div class="flex flex-col items-center">
              <div class="flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 {
                stepStatus.completed
                  ? 'bg-green-600 border-green-600 text-white' 
                  : stepStatus.current
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-400 bg-white'
              }">
                {#if stepStatus.completed}
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <span class="text-sm font-semibold">{i + 1}</span>
                {/if}
              </div>
              
              <!-- Step Name and Info -->
              <div class="text-center mt-3 max-w-32">
                <span class="text-sm font-medium {
                  stepStatus.current ? 'text-blue-600' : stepStatus.completed ? 'text-green-600' : 'text-gray-500'
                } block">
                  {step.shortName || step.name}
                </span>
                {#if stepStatus.info}
                  <span class="text-xs text-gray-500 mt-1 block leading-tight">
                    {stepStatus.info}
                  </span>
                {/if}
              </div>
            </div>
            
            <!-- Connector Line -->
            {#if i < STEPS.length - 1}
              <div class="w-20 h-1 mx-6 transition-colors duration-200 {
                stepStatus.completed ? 'bg-green-600' : 'bg-gray-300'
              } mt-[-2rem]"></div>
            {/if}
          </div>
        {/each}
      </div>
      
      <!-- Current Step Description -->
      <div class="text-center mt-8 max-w-2xl mx-auto">
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          {currentStepData.name}
        </h2>
        <p class="text-gray-600">
          {currentStepData.description}
        </p>
      </div>
    </div>
    
    <!-- Loading Overlay -->
    {#if isLoading}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg shadow-xl flex items-center space-x-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div>
            <p class="text-gray-700 font-medium">Processing...</p>
            <p class="text-gray-500 text-sm">Please wait while we save your configuration</p>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Wizard Content -->
    <div class="bg-white rounded-lg shadow-lg p-8">
      {#if currentStep === 1}
        <DataSourceStep 
          {dataSources}
          onComplete={handleDataSourceComplete}
          selectedDataSource={dataSourceConfig}
        />
      {:else if currentStep === 2}
        <SelectObject 
          {dataSourceConfig}
          {objects}
          onObjectSelect={handleObjectSelect}
          onNewObject={handleNewObject}
          onBack={handleObjectSelectionBack}
        />
      {:else if currentStep === 3}
        <MappingStep 
          {dataSourceConfig}
          {currentObject}
          onSave={handleMappingSave}
          onCancel={handleMappingBack}
        />
      {:else if currentStep === 4}
        <ConfigurationReview 
          {dataSourceConfig}
          {currentObject}
          onComplete={handleWizardComplete}
          onBack={handleReviewBack} 
        />
      {/if}
    </div>
  </div>
</div>