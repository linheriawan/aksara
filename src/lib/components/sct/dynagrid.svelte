<script lang="ts">
import {makeResizable} from '$lib/utils/dyna_resize';

// TypeScript interfaces
interface ApiConfig {
  apiurl: string;
  token?: string;
}

interface ShowConfig {
  page: number;
  filter: boolean;
  conf: boolean;
}

// Polymorphic data prop - either array of data or API config
const { 
  data = [] as any[] | ApiConfig,
  title = 'Dynagrid', 
  rowclick = () => {}, 
  show = { page: 20, filter: true, conf: true } as ShowConfig  
} = $props();

// Type guards and derived values
const isApiMode = $derived(typeof data === 'object' && !Array.isArray(data) && 'apiurl' in data);
const apiConfig = $derived(isApiMode ? data as ApiConfig : null);

let currentPage = $state(1);
let PerPage = $state(show.page);
let cstBtns: any[] = [];

// API-related state
let loading = $state(false);
let error = $state('');
let apiData = $state([]);
let apiTotalRows = $state(0);

// Filter, sort and column state
let columnFilters: Record<string, { operand: string; value: any }> = $state({});
let dataSort: Record<string, 'asc' | 'desc'> = $state({});
let visibleColumns: string[] = $state([]);
let allColumns: string[] = $state([]);

// Computed data based on mode
let currentData = $derived(isApiMode ? apiData : (Array.isArray(data) ? data as any[] : []));
let currentTotalRows = $derived(isApiMode ? apiTotalRows : (Array.isArray(data) ? (data as any[]).length : 0));

// For local mode, we still need client-side filtering and sorting
let filteredData: any[] = $state([]);
let pagedData: any[] = $state([]);

// API fetch function
async function fetchData() {
  if (!isApiMode || !apiConfig) return;
  
  loading = true;
  error = '';
  
  try {
    const payload = {
      filters: Object.entries(columnFilters).map(([field, o]) => ({
        field: field,
        operator: o.operand,
        value: o.value
      })),
      sorts: Object.entries(dataSort).map(([field, direction]) => ({
        field: field,
        direction: direction,
      })),
      page: currentPage,
      rows_to_get: PerPage
    };
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (apiConfig.token) {
      headers['Authorization'] = `Bearer ${apiConfig.token}`;
    }
    
    const response = await fetch(apiConfig.apiurl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Assuming API returns { data: [], totalrows: number }
    apiData = result.rows || [];
    apiTotalRows = result.totalrows || 0;
    
    // Update columns from API data
    if (apiData.length > 0) {
      allColumns = Object.keys(apiData[0]);
      if (!visibleColumns.length) {
        visibleColumns = [...allColumns];
      }
    }
    
  } catch (err) {
    error = err instanceof Error ? err.message : 'An error occurred';
    apiData = [];
    apiTotalRows = 0;
  } finally {
    loading = false;
  }
}

// Local sorting function
function sortData(data: any[], sorts: Record<string, 'asc' | 'desc'>) {
  if (Object.keys(sorts).length === 0) return data;
  
  return [...data].sort((a, b) => {
    for (const [col, direction] of Object.entries(sorts)) {
      let aVal = a[col];
      let bVal = b[col];
      
      // Handle different data types
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

// Initialize columns and data
$effect(() => {
  if (!isApiMode) {
    // Local mode - set up columns from data
    const localData = Array.isArray(data) ? data : [];
    allColumns = localData.length ? Object.keys(localData[0]) : [];
    if (!visibleColumns.length) visibleColumns = [...allColumns];
  } else {
    // API mode - fetch initial data
    fetchData();
  }
});

// Handle filtering and sorting for local mode
$effect(() => {
  if (!isApiMode) {
    const localData = Array.isArray(data) ? data as any[] : [];
    
    // Apply filters
    let filtered = localData.filter((row: any) => {
      return Object.entries(columnFilters).every(([col, { operand, value }]) => {
        const cell = row[col];
        switch (operand) {
          case '<': return cell < value;
          case '>': return cell > value;
          case '<=': return cell <= value;
          case '>=': return cell >= value;
          case '==': return cell == value;
          case '!=': return cell != value;
          case '*': return String(cell).includes(value);
          default: return true;
        }
      });
    });
    
    // Apply sorting
    filteredData = sortData(filtered, dataSort);
  }
});

// Handle pagination for local mode
$effect(() => {
  if (!isApiMode) {
    pagedData = filteredData.slice((currentPage - 1) * PerPage, currentPage * PerPage);
  } else {
    pagedData = currentData; // API data is already paginated
  }
});

// Single effect to handle all API fetching triggers
$effect(() => {
  if (isApiMode) {
    // Dependencies: currentPage, columnFilters, dataSort, PerPage
    const deps = [currentPage, JSON.stringify(columnFilters), JSON.stringify(dataSort), PerPage];
    console.log('API fetch triggered:', { page: currentPage, filters: columnFilters, sorts: dataSort, perPage: PerPage });
    fetchData();
  }
});

let showConfig = $state(false);
let showFilter = $state(false);

function cf_show() {
  showConfig = !showConfig;
  if (showFilter) showFilter = !showConfig ? true : false;
}

function ft_show() {
  showFilter = !showFilter;
  if (showConfig) showConfig = !showFilter ? true : false;
}

function filt_submit(e: Event) {
  e.preventDefault();
  const fd = new FormData(e.target as HTMLFormElement);
  const col = fd.get('col') as string;
  const operand = fd.get('operand') as string;
  const value = fd.get('value');
  
  // Reset to page 1 when adding filter
  if (isApiMode) currentPage = 1;
  columnFilters = { ...columnFilters, [col]: { operand, value } };
  
  // Reset form
  (e.target as HTMLFormElement).reset();
}

function sort_submit(e: Event) {
  e.preventDefault();
  const fd = new FormData(e.target as HTMLFormElement);
  const col = fd.get('sort_col') as string;
  const direction = fd.get('sort_dir') as 'asc' | 'desc';
  
  // Reset to page 1 when adding sort
  if (isApiMode) currentPage = 1;
  dataSort = { ...dataSort, [col]: direction };
  
  // Reset form
  (e.target as HTMLFormElement).reset();
}

function removeFilter(col: string) {
  const { [col]: removed, ...rest } = columnFilters;
  columnFilters = rest;
}

function removeSort(col: string) {
  const { [col]: removed, ...rest } = dataSort;
  dataSort = rest;
}

function handlePerPageChange() {
  // Reset to page 1 when changing items per page
  if (isApiMode) currentPage = 1;
}

let draggingCol = '';

function handleDragStart(col: string) {
  console.log(`dragging ${col}`);
  draggingCol = col;
}

function handleDrop(targetCol: string) {
  console.log(`drop to ${targetCol}`);
  if (!draggingCol || draggingCol === targetCol) return;
  const fromIdx = visibleColumns.indexOf(draggingCol);
  const toIdx = visibleColumns.indexOf(targetCol);

  visibleColumns.splice(toIdx, 0, visibleColumns.splice(fromIdx, 1)[0]);
  visibleColumns = [...visibleColumns];
  draggingCol = '';
}

// Calculate total pages and displayed data count
const totalPages = $derived(Math.ceil((isApiMode ? currentTotalRows : filteredData.length) / PerPage));
const displayedTotal = $derived(isApiMode ? currentTotalRows : filteredData.length);
const startRecord = $derived(Math.min((currentPage - 1) * PerPage + 1, displayedTotal));
const endRecord = $derived(Math.min(currentPage * PerPage, displayedTotal));
</script>

<style>
.floating-panel { transition: transform 0.3s ease; will-change: transform; }
.resizer { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; user-select: none; }
.loading-overlay { 
  position: absolute; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  background: rgba(255, 255, 255, 0.8); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 50; 
}
</style>

<section class="border rounded p-4" style="display:grid;grid-template-rows:auto 1fr auto;">
  <header class="flex justify-between items-center px-1">
    <h1 class="text-xl font-bold">
      {title}
      {#if isApiMode}<span class="text-sm text-gray-500 ml-2">(API Mode)</span>{/if}
    </h1>
    <div class="flex gap-2">
      {#if show.conf} <button onclick={cf_show} class="btn"><i class="fas fa-cog"></i></button> {/if}
      {#if show.filter} <button onclick={ft_show} class="btn"><i class="fas fa-filter"></i></button> {/if}
      {#each cstBtns as btn (btn.label)}
        <button class="btn" onclick={btn.click}> {@html btn.label} </button>
      {/each}
    </div>
  </header>

  <div class="grid grid-rows-1 overflow-x-hidden relative h-full">
    {#if loading}
      <div class="loading-overlay">
        <div class="flex items-center gap-2">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          Loading...
        </div>
      </div>
    {/if}

    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button onclick={() => fetchData()} class="ml-4 underline">Retry</button>
      </div>
    {/if}

    <div class="overflow-x-auto w-full h-full">
      <table class="w-full min-w-max border">
        <thead>
          <tr class="bg-gray-100">
            {#each visibleColumns as col}
              <th class="text-left px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis relative group" 
                use:makeResizable>
                <span draggable="true" role="none"
                  ondragstart={() => handleDragStart(col)}
                  ondragover={(e) => e.preventDefault()}
                  ondrop={() => handleDrop(col)}
                  class="drag-handle move-cursor block w-full">
                  {col.toUpperCase()}
                  {#if dataSort[col]}
                    <i class="fas fa-sort-{dataSort[col] === 'asc' ? 'up' : 'down'} ml-1 text-xs"></i>
                  {/if}
                </span>
                <span class="resizer border-r"></span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each pagedData as row, i}
            <tr onclick={() => rowclick(row)} class="hover:bg-sky-100 cursor-pointer">
              {#each visibleColumns as col}
                <td class="px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis">{row[col]}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if showFilter}
      <aside class="bg-gray-200 shadow-xl z-40 h-full absolute floating-panel p-1 overflow-y-auto"
        style="width: 250px; top: 0; right: 0; transform: translateX(0);">
        
        <h3 class="font-semibold mb-2">Active Filters:</h3>
        <ul class="flex flex-wrap gap-2 mb-4">
          {#each Object.entries(columnFilters) as [col, { operand, value }]}
            <li class="bg-blue-200 px-2 py-1 border rounded-sm text-sm">
              {col} {operand} {value}
              <button onclick={() => removeFilter(col)} class="ml-2">
                <i class="fas fa-times"></i>
              </button>
            </li>
          {/each}
        </ul>

        <form onsubmit={filt_submit} class="mb-4 p-2 border rounded bg-white">
          <h4 class="font-medium mb-2">Add Filter:</h4>
          <div class="flex flex-col gap-2">
            <select name="col" class="border px-2 py-1 text-sm" required>
              <option value="">Select Column</option>
              {#each allColumns as col}<option value={col}>{col}</option>{/each}
            </select>
            <select name="operand" class="border px-2 py-1 text-sm" required>
              <option value="">Select Operator</option>
              {#each [
                {val: '<', label: 'Less than (<)'}, 
                {val: '>', label: 'Greater than (>)'}, 
                {val: '<=', label: 'Less or equal (≤)'}, 
                {val: '>=', label: 'Greater or equal (≥)'}, 
                {val: '==', label: 'Equal (=)'}, 
                {val: '!=', label: 'Not equal (≠)'}, 
                {val: '*', label: 'Contains (*)'}
              ] as op}
                <option value={op.val}>{op.label}</option>
              {/each}
            </select>
            <input name="value" type="text" class="border px-2 py-1 text-sm" placeholder="Value" required />
            <button type="submit" class="btn bg-blue-500 text-white px-3 py-1 text-sm">
              <i class="fas fa-plus mr-1"></i>Add Filter
            </button>
          </div>
        </form>

        <h3 class="font-semibold mb-2">Active Sorts:</h3>
        <ul class="flex flex-wrap gap-2 mb-4">
          {#each Object.entries(dataSort) as [col, direction]}
            <li class="bg-green-200 px-2 py-1 border rounded-sm text-sm">
              {col} 
              <i class="fas fa-sort-{direction === 'asc' ? 'up' : 'down'} mx-1"></i>
              {direction.toUpperCase()}
              <button onclick={() => removeSort(col)} class="ml-2">
                <i class="fas fa-times"></i>
              </button>
            </li>
          {/each}
        </ul>

        <form onsubmit={sort_submit} class="p-2 border rounded bg-white">
          <h4 class="font-medium mb-2">Add Sort:</h4>
          <div class="flex flex-col gap-2">
            <select name="sort_col" class="border px-2 py-1 text-sm" required>
              <option value="">Select Column</option>
              {#each allColumns as col}<option value={col}>{col}</option>{/each}
            </select>
            <select name="sort_dir" class="border px-2 py-1 text-sm" required>
              <option value="">Select Direction</option>
              <option value="asc">Ascending (A→Z)</option>
              <option value="desc">Descending (Z→A)</option>
            </select>
            <button type="submit" class="btn bg-green-500 text-white px-3 py-1 text-sm">
              <i class="fas fa-sort mr-1"></i>Add Sort
            </button>
          </div>
        </form>
      </aside>
    {/if}

    {#if showConfig}
      <aside class="bg-gray-200 shadow-xl z-40 h-full absolute floating-panel p-1 overflow-y-auto"
        style="width: 250px; top: 0; right: 0; transform: translateX(0);">
        
        <label class="block mb-2 font-semibold">Visible Columns:</label>
        <div class="grid grid-cols-1 gap-2 mb-4">
          {#each allColumns as col}
            <label class="flex items-center text-sm">
              <input type="checkbox" bind:group={visibleColumns} value={col} class="mr-2" />
              {col}
            </label>
          {/each}
        </div>

        <label class="block mb-2 font-semibold">Rows per page:</label>
        <select bind:value={PerPage} onchange={handlePerPageChange} class="w-full border px-2 py-1 mb-4">
          {#each [10, 20, 50, 100] as disp}<option value={disp}>{disp}</option>{/each}
        </select>

        {#if isApiMode}
          <div class="text-sm text-gray-600">
            <strong>API Config:</strong><br/>
            URL: {apiConfig?.apiurl}<br/>
            Token: {apiConfig?.token ? '***' : 'None'}
          </div>
        {/if}
      </aside>
    {/if}
  </div>

  <footer class="mt-4 flex justify-between items-center px-1">
    <div class="text-sm">
      Showing {startRecord} - {endRecord} of {displayedTotal}
      {#if isApiMode}<span class="text-gray-500">(Server-side)</span>{/if}
    </div>
    <div class="flex gap-2">
      <button onclick={() => currentPage = 1} disabled={currentPage === 1 || loading} class="px-2 py-1 border rounded disabled:opacity-50">
        <i class="fas fa-step-backward"></i>
      </button>
      <button onclick={() => currentPage = Math.max(currentPage - 1, 1)} disabled={currentPage === 1 || loading} class="px-2 py-1 border rounded disabled:opacity-50">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="px-2 py-1">Page {currentPage} of {totalPages || 1}</span>
      <button onclick={() => currentPage = currentPage + 1} disabled={currentPage >= totalPages || loading} class="px-2 py-1 border rounded disabled:opacity-50">
        <i class="fas fa-chevron-right"></i>
      </button>
      <button onclick={() => currentPage = totalPages || 1} disabled={currentPage >= totalPages || loading} class="px-2 py-1 border rounded disabled:opacity-50">
        <i class="fas fa-step-forward"></i>
      </button>
    </div>
  </footer>
</section>