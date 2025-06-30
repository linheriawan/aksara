<!-- src/routes/designer/data/DataSourceStep.svelte -->
<script lang="ts">
  import type { DataSource, DS_DBConf, DS_APIConf, DS_FSConf } from "./conf";
  
  const { dataSources = [], onComplete, selectedDataSource } = $props<{
      dataSources?: DataSource[];
      selectedDataSource: DataSource | null;
      onComplete: (config: DataSource) => void;
  }>();
  
  // State
  let selectedType = $state<DataSource['type'] | ''>('');
  let configName = $state('');
  let useExisting = $state(false);
  let selectedExisting = $state('');
  let loading = $state(false);
  let testResult = $state<{success: boolean, message: string} | null>(null);
  let tableSchema = $state<string[]>([]);

  // Configuration states with proper typing
  let mysqlConfig = $state<DS_DBConf>({
    server: '',
    port: '3306',
    username: '',
    password: '',
    database: ''
  });

  let apiConfig = $state<DS_APIConf & {username?: string, password?: string}>({
    baseUrl: '',
    authentication: 'none',
    apiKey: '',
    username: '',
    password: ''
  });

  let fileConfig = $state<DS_FSConf>({
    basePath: './data',
    format: 'json'
  });

  // Derived state
  const hasExistingConfigs = $derived(dataSources.length > 0);
  const selectedConfig = $derived(
    selectedExisting ? dataSources.find((c: DataSource) => c.name === selectedExisting) : null
  );
  const canTest = $derived(
    selectedType && selectedType !== 'filesystem' && !useExisting
  );
  const canProceed = $derived(
    useExisting 
      ? !!selectedExisting 
      : !!(configName && selectedType && (testResult?.success || selectedType === 'filesystem'))
  );

  // Effects
  $effect(() => {
    if (selectedConfig) {
      selectedType = selectedConfig.type;
      configName = selectedConfig.name;
      
      // Update config objects based on type
      switch (selectedConfig.type) {
        case 'mysql':
          mysqlConfig = { ...selectedConfig.config as DS_DBConf };
          break;
        case 'rest':
          apiConfig = { ...selectedConfig.config as DS_APIConf };
          break;
        case 'filesystem':
          fileConfig = { ...selectedConfig.config as DS_FSConf };
          break;
      }
    }
  });

  // Reset test result when configuration changes
  $effect(() => {
    if (selectedType && !useExisting) {
      testResult = null;
      tableSchema = [];
    }
  });
  
  // Functions
  async function testConnection() {
    loading = true;
    testResult = null;

    try {
      const config = getConfigForType();
      const response = await fetch('/designer/data/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, config })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      testResult = result;
      
      if (result.success && selectedType === 'mysql' && result.schema) {
        tableSchema = result.schema;
      }
    } catch (error) {
      testResult = { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    } finally { 
      loading = false; 
    }
  }

  function getConfigForType(): DS_DBConf | DS_APIConf | DS_FSConf {
    switch (selectedType) {
      case 'mysql':
        return mysqlConfig;
      case 'rest':
        return apiConfig;
      case 'filesystem':
        return fileConfig;
      default:
        return {} as any;
    }
  }

  function handleNext() {
    if (useExisting && selectedConfig) {
      onComplete(selectedConfig);
    } else if (selectedType) {
      const config: DataSource = {
        type: selectedType,
        name: configName,
        config: getConfigForType(),
        ...(selectedType === 'mysql' && tableSchema.length > 0 && { schema: tableSchema })
      };
      onComplete(config);
    }
  }

  function resetForm() {
    selectedType = '';
    configName = '';
    testResult = null;
    tableSchema = [];
    mysqlConfig = { server: '', port: '3306', username: '', password: '', database: '' };
    apiConfig = { baseUrl: '', authentication: 'none', apiKey: '', username: '', password: '' };
    fileConfig = { basePath: './data', format: 'json' };
  }

  // Reset form when switching between existing/new
  $effect(() => {
    if (useExisting) {
      resetForm();
    } else {
      selectedExisting = '';
    }
  });
</script>

<div>
  <!-- Use Existing or Create New -->
  <div class="mb-6">
    <label class="flex items-center mb-4 cursor-pointer">
      <input 
        type="checkbox" 
        bind:checked={useExisting}
        class="mr-2"
      />
      <span class="select-none">Use existing configuration</span>
    </label>
    
    {#if useExisting}
      {#if hasExistingConfigs}
        <select 
          bind:value={selectedExisting}
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select existing configuration...</option>
          {#each dataSources as config}
            <option value={config.name}>{config.name} ({config.type.toUpperCase()})</option>
          {/each}
        </select>
      {:else}
        <div class="p-4 bg-gray-50 rounded-md border border-gray-200">
          <p class="text-gray-600 italic">No existing configurations found.</p>
        </div>
      {/if}
    {/if}
  </div>
  
  {#if !useExisting}
    <!-- Configuration Name -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Configuration Name *
      </label>
      <input 
        type="text" 
        bind:value={configName}
        placeholder="Enter configuration name"
        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
    </div>
    
    <!-- Data Source Type -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Data Source Type *
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedType === 'mysql' ? 'border-blue-500 bg-blue-50' : ''}">
          <input 
            type="radio" 
            bind:group={selectedType} 
            value="mysql"
            class="mr-3"
          />
          <div>
            <div class="font-medium text-gray-900">MySQL</div>
            <div class="text-sm text-gray-500">Relational database</div>
          </div>
        </label>
        
        <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedType === 'rest' ? 'border-blue-500 bg-blue-50' : ''}">
          <input 
            type="radio" 
            bind:group={selectedType} 
            value="rest"
            class="mr-3"
          />
          <div>
            <div class="font-medium text-gray-900">REST API</div>
            <div class="text-sm text-gray-500">HTTP endpoints</div>
          </div>
        </label>
        
        <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedType === 'filesystem' ? 'border-blue-500 bg-blue-50' : ''}">
          <input 
            type="radio" 
            bind:group={selectedType} 
            value="filesystem"
            class="mr-3"
          />
          <div>
            <div class="font-medium text-gray-900">File System</div>
            <div class="text-sm text-gray-500">JSON files</div>
          </div>
        </label>
      </div>
    </div>
    
    <!-- MySQL Configuration -->
    {#if selectedType === 'mysql'}
      <div class="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900">MySQL Configuration</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Server *</label>
            <input 
              type="text" 
              bind:value={mysqlConfig.server}
              placeholder="localhost"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input 
              type="text" 
              bind:value={mysqlConfig.port}
              placeholder="3306"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Database *</label>
          <input 
            type="text" 
            bind:value={mysqlConfig.database}
            placeholder="database_name"
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input 
              type="text" 
              bind:value={mysqlConfig.username}
              placeholder="username"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              bind:value={mysqlConfig.password}
              placeholder="password"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    {/if}
    
    <!-- REST API Configuration -->
    {#if selectedType === 'rest'}
      <div class="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900">REST API Configuration</h3>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Base URL *</label>
          <input 
            type="url" 
            bind:value={apiConfig.baseUrl}
            placeholder="https://api.example.com"
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
          <select 
            bind:value={apiConfig.authentication}
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="none">None</option>
            <option value="apikey">API Key</option>
            <option value="basic">Basic Auth</option>
          </select>
        </div>
        
        {#if apiConfig.authentication === 'apikey'}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">API Key *</label>
            <input 
              type="password" 
              bind:value={apiConfig.apiKey}
              placeholder="Your API key"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        {:else if apiConfig.authentication === 'basic'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input 
                type="text" 
                bind:value={apiConfig.username}
                placeholder="username"
                class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input 
                type="password" 
                bind:value={apiConfig.password}
                placeholder="password"
                class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- File System Configuration -->
    {#if selectedType === 'filesystem'}
      <div class="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900">File System Configuration</h3>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Base Path *</label>
          <input 
            type="text" 
            bind:value={fileConfig.basePath}
            placeholder="./data"
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Format</label>
          <select 
            bind:value={fileConfig.format}
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="json">JSON</option>
          </select>
        </div>
      </div>
    {/if}
    
    <!-- Test Connection -->
    {#if canTest}
      <div class="mb-6">
        <button 
          on:click={testConnection}
          disabled={loading}
          class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {#if loading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Testing...</span>
          {:else}
            <span>Test Connection</span>
          {/if}
        </button>
        
        {#if testResult}
          <div class="mt-3 p-3 rounded-md {testResult.success ? 'bg-green-100 border border-green-400 text-green-800' : 'bg-red-100 border border-red-400 text-red-800'}">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                {#if testResult.success}
                  <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium">
                  {testResult.success ? 'Connection successful!' : 'Connection failed'}
                </p>
                <p class="text-sm">{testResult.message}</p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Schema Preview for MySQL -->
    {#if selectedType === 'mysql' && tableSchema.length > 0}
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-2 text-gray-900">Available Tables</h3>
        <div class="bg-gray-50 border border-gray-200 p-4 rounded-md max-h-40 overflow-y-auto">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            {#each tableSchema as table}
              <div class="text-sm font-mono bg-white px-2 py-1 rounded border">{table}</div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  {/if}
  
  <!-- Navigation -->
  <div class="flex justify-end">
    <button 
      on:click={handleNext} 
      disabled={!canProceed}
      class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Next
    </button>
  </div>
</div>