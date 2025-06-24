<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  // Stores
  const currentStep = writable(1);
  const dataAccess = writable({});
  const dataStructure = writable({});
  const objectMapping = writable({});
  const savedConfigs = writable([]);
  const existingObjects = writable([]);

  // Form data
  let selectedDataAccess = '';
  let newDataAccessName = '';
  let dataAccessConfig = {
    type: 'mysql',
    server: '',
    username: '',
    password: '',
    database: '',
    filePath: ''
  };

  let objectName = '';
  let objectExists = false;
  let fields = [{ name: '', type: 'string', required: false }];
  let mappings = [{ objectField: '', dataField: '' }];

  // Validation
  let errors = {};

  onMount(async () => {
    await loadSavedConfigurations();
  });

  async function loadSavedConfigurations() {
    try {
      // Simulate loading saved configurations
      // In real implementation, this would fetch from your backend
      const mockConfigs = [
        { name: 'ProductionDB', type: 'mysql', server: 'prod.server.com' },
        { name: 'LocalFiles', type: 'filesystem', filePath: './data' }
      ];
      const mockObjects = ['User', 'Product', 'Order'];
      
      savedConfigs.set(mockConfigs);
      existingObjects.set(mockObjects);
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  }

  function validateStep(step) {
    errors = {};
    
    switch (step) {
      case 1:
        if (!selectedDataAccess && !newDataAccessName) {
          errors.dataAccess = 'Please select existing or create new data access';
        }
        if (newDataAccessName) {
          if (dataAccessConfig.type === 'mysql') {
            if (!dataAccessConfig.server) errors.server = 'Server address is required';
            if (!dataAccessConfig.username) errors.username = 'Username is required';
            if (!dataAccessConfig.password) errors.password = 'Password is required';
            if (!dataAccessConfig.database) errors.database = 'Database name is required';
          } else if (dataAccessConfig.type === 'filesystem') {
            if (!dataAccessConfig.filePath) errors.filePath = 'File path is required';
          }
        }
        break;
        
      case 2:
        if (!objectName.trim()) {
          errors.objectName = 'Object name is required';
        }
        break;
        
      case 3:
        if (fields.some(f => !f.name.trim())) {
          errors.fields = 'All field names are required';
        }
        break;
        
      case 4:
        if (mappings.some(m => !m.objectField || !m.dataField)) {
          errors.mappings = 'All mappings must be complete';
        }
        break;
    }
    
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep($currentStep)) {
      if ($currentStep === 2) {
        checkObjectExists();
      }
      currentStep.update(n => n + 1);
    }
  }

  function prevStep() {
    currentStep.update(n => n - 1);
  }

  function checkObjectExists() {
    existingObjects.subscribe(objects => {
      objectExists = objects.includes(objectName);
    })();
  }

  function addField() {
    fields = [...fields, { name: '', type: 'string', required: false }];
  }

  function removeField(index) {
    fields = fields.filter((_, i) => i !== index);
  }

  function addMapping() {
    mappings = [...mappings, { objectField: '', dataField: '' }];
  }

  function removeMapping(index) {
    mappings = mappings.filter((_, i) => i !== index);
  }

  function updateMappingOptions() {
    // Update available object fields for mapping
    mappings = mappings.map(m => ({
      ...m,
      availableFields: fields.map(f => f.name).filter(n => n.trim())
    }));
  }

  $: if (fields) updateMappingOptions();

  async function saveConfiguration() {
    if (!validateStep(4)) return;

    const config = {
      dataAccess: selectedDataAccess || {
        name: newDataAccessName,
        ...dataAccessConfig
      },
      object: {
        name: objectName,
        fields: fields.filter(f => f.name.trim()),
        mappings: mappings.filter(m => m.objectField && m.dataField)
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Simulate saving to YAML files
      // In real implementation, this would call your backend API
      await saveToYAML(config);
      alert('Configuration saved successfully!');
      resetWizard();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    }
  }

  async function saveToYAML(config) {
    // Mock function - in real implementation, this would send data to backend
    // Backend would save as YAML files:
    // - data-access/{name}.yaml
    // - objects/{objectName}.yaml
    // - mappings/{objectName}-mapping.yaml
    
    console.log('Saving configuration:', config);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  function resetWizard() {
    currentStep.set(1);
    selectedDataAccess = '';
    newDataAccessName = '';
    dataAccessConfig = {
      type: 'mysql',
      server: '',
      username: '',
      password: '',
      database: '',
      filePath: ''
    };
    objectName = '';
    objectExists = false;
    fields = [{ name: '', type: 'string', required: false }];
    mappings = [{ objectField: '', dataField: '' }];
    errors = {};
  }
</script>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Data Configuration Wizard</h1>
      <p class="text-gray-600">Configure your data access, structure, and mappings</p>
    </div>

    <!-- Progress Bar -->
    <div class="mb-8">
      <div class="flex items-center justify-center space-x-4">
        {#each [1, 2, 3, 4, 5] as step}
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        {$currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}">
              {step}
            </div>
            {#if step < 5}
              <div class="w-16 h-1 mx-2 {$currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}"></div>
            {/if}
          </div>
        {/each}
      </div>
      <div class="flex justify-center mt-2 space-x-8 text-sm text-gray-600">
        <span class="{$currentStep === 1 ? 'font-medium text-blue-600' : ''}">Data Access</span>
        <span class="{$currentStep === 2 ? 'font-medium text-blue-600' : ''}">Object Name</span>
        <span class="{$currentStep === 3 ? 'font-medium text-blue-600' : ''}">Data Structure</span>
        <span class="{$currentStep === 4 ? 'font-medium text-blue-600' : ''}">Mapping</span>
        <span class="{$currentStep === 5 ? 'font-medium text-blue-600' : ''}">Review</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      
      <!-- Step 1: Data Access Configuration -->
      {#if $currentStep === 1}
        <div class="space-y-6">
          <h2 class="text-xl font-semibold text-gray-900">Configure Data Access</h2>
          
          <!-- Existing Data Access -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Use Existing Data Access
            </label>
            <select bind:value={selectedDataAccess} class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">-- Select existing configuration --</option>
              {#each $savedConfigs as config}
                <option value={config.name}>{config.name} ({config.type})</option>
              {/each}
            </select>
          </div>

          <div class="text-center text-gray-500">OR</div>

          <!-- New Data Access -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Create New Data Access
            </label>
            <input
              type="text"
              bind:value={newDataAccessName}
              placeholder="Configuration name"
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {#if errors.dataAccess}
              <p class="mt-1 text-sm text-red-600">{errors.dataAccess}</p>
            {/if}
          </div>

          {#if newDataAccessName}
            <div class="space-y-4 p-4 bg-gray-50 rounded-md">
              <!-- Data Access Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Access Type</label>
                <select bind:value={dataAccessConfig.type} class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="mysql">MySQL Database</option>
                  <option value="filesystem">Filesystem (JSON)</option>
                </select>
              </div>

              {#if dataAccessConfig.type === 'mysql'}
                <!-- MySQL Configuration -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Server Address</label>
                    <input
                      type="text"
                      bind:value={dataAccessConfig.server}
                      placeholder="localhost:3306"
                      class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {#if errors.server}
                      <p class="mt-1 text-sm text-red-600">{errors.server}</p>
                    {/if}
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
                    <input
                      type="text"
                      bind:value={dataAccessConfig.database}
                      placeholder="database_name"
                      class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {#if errors.database}
                      <p class="mt-1 text-sm text-red-600">{errors.database}</p>
                    {/if}
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      bind:value={dataAccessConfig.username}
                      placeholder="username"
                      class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {#if errors.username}
                      <p class="mt-1 text-sm text-red-600">{errors.username}</p>
                    {/if}
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      bind:value={dataAccessConfig.password}
                      placeholder="password"
                      class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {#if errors.password}
                      <p class="mt-1 text-sm text-red-600">{errors.password}</p>
                    {/if}
                  </div>
                </div>
              {:else if dataAccessConfig.type === 'filesystem'}
                <!-- Filesystem Configuration -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">File Path</label>
                  <input
                    type="text"
                    bind:value={dataAccessConfig.filePath}
                    placeholder="./data or /path/to/data"
                    class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {#if errors.filePath}
                    <p class="mt-1 text-sm text-red-600">{errors.filePath}</p>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Step 2: Object Name -->
      {#if $currentStep === 2}
        <div class="space-y-6">
          <h2 class="text-xl font-semibold text-gray-900">Define Object Name</h2>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Object Name</label>
            <input
              type="text"
              bind:value={objectName}
              placeholder="e.g., User, Product, Order"
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              on:blur={checkObjectExists}
            />
            {#if errors.objectName}
              <p class="mt-1 text-sm text-red-600">{errors.objectName}</p>
            {/if}
            {#if objectExists}
              <p class="mt-1 text-sm text-orange-600">⚠️ Warning: Object "{objectName}" already exists and will be overwritten.</p>
            {/if}
          </div>

          {#if $existingObjects.length > 0}
            <div>
              <p class="text-sm text-gray-600 mb-2">Existing objects:</p>
              <div class="flex flex-wrap gap-2">
                {#each $existingObjects as obj}
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{obj}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Step 3: Data Structure -->
      {#if $currentStep === 3}
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Define Data Structure</h2>
            <button
              on:click={addField}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Add Field
            </button>
          </div>

          <div class="space-y-4">
            {#each fields as field, index}
              <div class="p-4 border border-gray-200 rounded-md">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                    <input
                      type="text"
                      bind:value={field.name}
                      placeholder="field_name"
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select bind:value={field.type} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                    </select>
                  </div>
                  <div>
                    <label class="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        bind:checked={field.required}
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span class="text-sm text-gray-700">Required</span>
                    </label>
                  </div>
                  <div>
                    {#if fields.length > 1}
                      <button
                        on:click={() => removeField(index)}
                        class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Remove
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>

          {#if errors.fields}
            <p class="text-sm text-red-600">{errors.fields}</p>
          {/if}
        </div>
      {/if}

      <!-- Step 4: Mapping -->
      {#if $currentStep === 4}
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Field Mapping</h2>
            <button
              on:click={addMapping}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Add Mapping
            </button>
          </div>

          <p class="text-sm text-gray-600">Map object fields to data source fields</p>

          <div class="space-y-4">
            {#each mappings as mapping, index}
              <div class="p-4 border border-gray-200 rounded-md">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Object Field</label>
                    <select bind:value={mapping.objectField} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">-- Select field --</option>
                      {#each fields.filter(f => f.name.trim()) as field}
                        <option value={field.name}>{field.name}</option>
                      {/each}
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Data Source Field</label>
                    <input
                      type="text"
                      bind:value={mapping.dataField}
                      placeholder="database_column or json_key"
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    {#if mappings.length > 1}
                      <button
                        on:click={() => removeMapping(index)}
                        class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Remove
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>

          {#if errors.mappings}
            <p class="text-sm text-red-600">{errors.mappings}</p>
          {/if}
        </div>
      {/if}

      <!-- Step 5: Review -->
      {#if $currentStep === 5}
        <div class="space-y-6">
          <h2 class="text-xl font-semibold text-gray-900">Review Configuration</h2>
          
          <div class="space-y-4">
            <!-- Data Access Review -->
            <div class="p-4 bg-gray-50 rounded-md">
              <h3 class="font-medium text-gray-900 mb-2">Data Access</h3>
              {#if selectedDataAccess}
                <p class="text-sm text-gray-600">Using existing: <span class="font-medium">{selectedDataAccess}</span></p>
              {:else}
                <p class="text-sm text-gray-600">New configuration: <span class="font-medium">{newDataAccessName}</span></p>
                <p class="text-sm text-gray-600">Type: <span class="font-medium">{dataAccessConfig.type}</span></p>
                {#if dataAccessConfig.type === 'mysql'}
                  <p class="text-sm text-gray-600">Server: <span class="font-medium">{dataAccessConfig.server}</span></p>
                  <p class="text-sm text-gray-600">Database: <span class="font-medium">{dataAccessConfig.database}</span></p>
                {:else}
                  <p class="text-sm text-gray-600">Path: <span class="font-medium">{dataAccessConfig.filePath}</span></p>
                {/if}
              {/if}
            </div>

            <!-- Object Review -->
            <div class="p-4 bg-gray-50 rounded-md">
              <h3 class="font-medium text-gray-900 mb-2">Object Definition</h3>
              <p class="text-sm text-gray-600">Name: <span class="font-medium">{objectName}</span></p>
              {#if objectExists}
                <p class="text-sm text-orange-600">⚠️ Will overwrite existing object</p>
              {/if}
            </div>

            <!-- Fields Review -->
            <div class="p-4 bg-gray-50 rounded-md">
              <h3 class="font-medium text-gray-900 mb-2">Fields ({fields.filter(f => f.name.trim()).length})</h3>
              <div class="space-y-1">
                {#each fields.filter(f => f.name.trim()) as field}
                  <p class="text-sm text-gray-600">
                    <span class="font-medium">{field.name}</span> 
                    ({field.type})
                    {#if field.required}<span class="text-red-600">*</span>{/if}
                  </p>
                {/each}
              </div>
            </div>

            <!-- Mappings Review -->
            <div class="p-4 bg-gray-50 rounded-md">
              <h3 class="font-medium text-gray-900 mb-2">Field Mappings ({mappings.filter(m => m.objectField && m.dataField).length})</h3>
              <div class="space-y-1">
                {#each mappings.filter(m => m.objectField && m.dataField) as mapping}
                  <p class="text-sm text-gray-600">
                    <span class="font-medium">{mapping.objectField}</span> → <span class="font-medium">{mapping.dataField}</span>
                  </p>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Navigation Buttons -->
      <div class="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          on:click={prevStep}
          disabled={$currentStep === 1}
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div class="space-x-4">
          {#if $currentStep < 5}
            <button
              on:click={nextStep}
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Next
            </button>
          {:else}
            <button
              on:click={saveConfiguration}
              class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
            >
              Save Configuration
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Additional custom styles if needed */
</style>