<script lang="ts">
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import type { DataSource, DS_DBConf, DS_APIConf, DS_FSConf } from './conf';

  interface Props {
    dataSource?: DataSource | null;
    onSave?: (dataSource: DataSource) => void;
    
  }

  const { dataSource, onSave }: Props = $props();

  // State
  let name = $state(dataSource?.name || '');
  let originalName = $state(dataSource?.name || ''); // Track original name for proper updates
  let type = $state<DataSource['type']>(dataSource?.type || 'mysql');
  let saving = $state(false);
  let testing = $state(false);
  let testResult = $state<{success: boolean, message: string} | null>(null);
  let errors = $state<Record<string, string>>({});

  // Configuration states
  let mysqlConfig = $state<DS_DBConf>({
    server: '',
    port: '3306',
    username: '',
    password: '',
    database: ''
  });

  let apiConfig = $state<DS_APIConf>({
    baseUrl: '',
    authentication: 'none',
    apiKey: ''
  });

  let fileConfig = $state<DS_FSConf>({
    basePath: './data',
    format: 'json'
  });

  // Initialize with existing data
  $effect(() => {
    if (dataSource) {
      name = dataSource.name;
      originalName = dataSource.name; // Make sure originalName is set when editing
      type = dataSource.type;
      
      switch (dataSource.type) {
        case 'mysql':
          mysqlConfig = { ...dataSource.config as DS_DBConf };
          break;
        case 'rest':
          apiConfig = { ...dataSource.config as DS_APIConf };
          break;
        case 'filesystem':
          fileConfig = { ...dataSource.config as DS_FSConf };
          break;
      }
    }
  });

  const isEditing = $derived(!!dataSource);
  const isValid = $derived(name.trim().length > 0 && hasValidConfig());

  function hasValidConfig(): boolean {
    switch (type) {
      case 'mysql':
        return !!(mysqlConfig.server && mysqlConfig.username && mysqlConfig.database);
      case 'rest':
        return !!(apiConfig.baseUrl);
      case 'filesystem':
        return !!(fileConfig.basePath);
      default:
        return false;
    }
  }

  async function handleTest() {
    testing = true;
    testResult = null;

    try {
      const response = await fetch('/designer/data/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          config: getCurrentConfig()
        })
      });

      const result = await response.json();
      testResult = result;
    } catch (error) {
      testResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    } finally {
      testing = false;
    }
  }

  async function handleSave() {
    if (!isValid) return;

    saving = true;
    errors = {};

    try {
      const newDataSource: DataSource = {
        type,
        name: name.trim(),
        config: getCurrentConfig()
      };

      const requestBody = {
        dataSource: newDataSource,
        isEdit: isEditing,
        originalName: isEditing ? originalName : undefined
      };

      console.log('DataSourceEditor save request:', requestBody);

      const response = await fetch('/designer/data/save-datasource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        onSave?.(newDataSource);
      } else {
        const errorData = await response.json();
        errors = errorData.errors || { general: 'Save failed' };
      }
    } catch (error) {
      errors = { general: 'Network error occurred' };
    } finally {
      saving = false;
    }
  }

  function getCurrentConfig() {
    switch (type) {
      case 'mysql': return { ...mysqlConfig };
      case 'rest': return { ...apiConfig };
      case 'filesystem': return { ...fileConfig };
      default: return {};
    }
  }

  // Export API for parent component access
  export const api = {
    get isValid() { return isValid; },
    get testing() { return testing; },
    get saving() { return saving; },
    get type() { return type; },
    get isEditing() { return isEditing; },
    hasValidConfig,
    handleTest,
    handleSave
  };
</script>

<!-- Content wrapper -->
<div class="p-6 space-y-6">
    {#if errors.general}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {errors.general}
      </div>
    {/if}

    <!-- Basic Info -->
    <div class="space-y-4">
      <Text
        id="name"
        name="name"
        label="Data Source Name"
        value={name}
        required
        error={errors.name}
        placeholder="e.g., main_database, users_api"
        input={(e) => name = e.target.value} />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Data Source Type</label>
        <div class="grid grid-cols-3 gap-4">
          <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {type === 'mysql' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}">
            <input
              type="radio"
              bind:group={type}
              value="mysql"
              disabled={isEditing}
              class="mr-3" />
            <div>
              <div class="font-medium">🗄️ MySQL</div>
              <div class="text-sm text-gray-600">Database connection</div>
            </div>
          </label>
          <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {type === 'rest' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}">
            <input
              type="radio"
              bind:group={type}
              value="rest"
              disabled={isEditing}
              class="mr-3" />
            <div>
              <div class="font-medium">🌐 REST API</div>
              <div class="text-sm text-gray-600">HTTP API endpoint</div>
            </div>
          </label>
          <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {type === 'filesystem' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}">
            <input
              type="radio"
              bind:group={type}
              value="filesystem"
              disabled={isEditing}
              class="mr-3" />
            <div>
              <div class="font-medium">📁 File System</div>
              <div class="text-sm text-gray-600">Local files</div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Configuration Section -->
    <div class="border-t pt-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Configuration</h3>

      {#if type === 'mysql'}
        <div class="grid grid-cols-2 gap-4">
          <Text
            id="server"
            name="server"
            label="Server Host"
            value={mysqlConfig.server}
            placeholder="localhost"
            required
            input={(e) => mysqlConfig.server = e.target.value} />
          <Text
            id="port"
            name="port"
            label="Port"
            value={mysqlConfig.port}
            placeholder="3306"
            required
            input={(e) => mysqlConfig.port = e.target.value} />
          <Text
            id="database"
            name="database"
            label="Database Name"
            value={mysqlConfig.database}
            placeholder="my_database"
            required
            input={(e) => mysqlConfig.database = e.target.value} />
          <div></div>
          <Text
            id="username"
            name="username"
            label="Username"
            value={mysqlConfig.username}
            placeholder="root"
            required
            input={(e) => mysqlConfig.username = e.target.value} />
          <Text
            id="password"
            name="password"
            label="Password"
            value={mysqlConfig.password}
            type="password"
            placeholder="••••••••"
            input={(e) => mysqlConfig.password = e.target.value} />
        </div>

      {:else if type === 'rest'}
        <div class="space-y-4">
          <Text
            id="baseUrl"
            name="baseUrl"
            label="Base URL"
            value={apiConfig.baseUrl}
            placeholder="https://api.example.com"
            required
            input={(e) => apiConfig.baseUrl = e.target.value} />
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Authentication</label>
            <select
              bind:value={apiConfig.authentication}
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="none">No Authentication</option>
              <option value="apikey">API Key</option>
              <option value="basic">Basic Authentication</option>
            </select>
          </div>

          {#if apiConfig.authentication === 'apikey'}
            <Text
              id="apiKey"
              name="apiKey"
              label="API Key"
              value={apiConfig.apiKey || ''}
              type="password"
              placeholder="your-api-key"
              input={(e) => apiConfig.apiKey = e.target.value} />
          {/if}

          {#if apiConfig.authentication === 'basic'}
            <div class="grid grid-cols-2 gap-4">
              <Text
                id="apiUsername"
                name="apiUsername"
                label="Username"
                value={apiConfig.username || ''}
                input={(e) => apiConfig.username = e.target.value} />
              <Text
                id="apiPassword"
                name="apiPassword"
                label="Password"
                value={apiConfig.password || ''}
                type="password"
                input={(e) => apiConfig.password = e.target.value} />
            </div>
          {/if}
        </div>

      {:else if type === 'filesystem'}
        <div class="space-y-4">
          <Text
            id="basePath"
            name="basePath"
            label="Base Path"
            value={fileConfig.basePath}
            placeholder="./data"
            required
            input={(e) => fileConfig.basePath = e.target.value} />
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">File Format</label>
            <select
              bind:value={fileConfig.format}
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
          </div>
        </div>
      {/if}
    </div>

  <!-- Test Connection Result -->
  {#if testResult}
    <div class="p-4 rounded-md {testResult.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}">
      <div class="flex items-center">
        <span class="text-lg mr-2">{testResult.success ? '✅' : '❌'}</span>
        <span class="font-medium">{testResult.success ? 'Connection successful!' : 'Connection failed'}</span>
      </div>
      <p class="mt-1 text-sm">{testResult.message}</p>
    </div>
  {/if}

</div>