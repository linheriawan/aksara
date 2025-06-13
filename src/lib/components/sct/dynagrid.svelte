<script lang="ts">
  const { page = 1, data = [], totalrows = 0, title = 'Dynagrid', rowclick = () => {}, show = 20, filter = true, conf = true } = $props();

  let currentPage = page;
  let visibleColumns: string[] = $state([]);
  let columnFilters: Record<string, { operand: string; value: any }> = $state({});
  let showConfig = $state(false);
  let showFilter = $state(false);
  let PerPage = $state(show);

  let allColumns: string[] = $state([]);
  let filteredData: any[] = $state([]);
  let pagedData: any[] = $state([]);

  $effect(() => {
    allColumns = data.length ? Object.keys(data[0]) : [];
    if (!visibleColumns.length) visibleColumns = [...allColumns];
  });

  $effect(() => {
    filteredData = data.filter((row) => {
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
    
    pagedData = filteredData.slice((currentPage - 1) * PerPage, currentPage * PerPage);
    console.log(filteredData,visibleColumns);
  });
</script>
<style>
  .floating-panel { transition: transform 0.3s ease; will-change: transform; }
</style>
<section class="border rounded p-4">
  <header class="flex justify-between items-center mb-4">
    <h1 class="text-xl font-bold">{title}</h1>
    <div class="flex gap-2">
      {#if conf}
        <button on:click={() => showConfig = !showConfig} class="btn"><i class="fas fa-cog"></i></button>
      {/if}
      {#if filter}
        <button on:click={() => showFilter = !showFilter} class="btn"><i class="fas fa-filter"></i></button>
      {/if}
    </div>
  </header>
  <div class="grid-1aa gap-2 overflow-x-hidden">
    <table class="w-full table-fixed border">
        <thead>
        <tr class="bg-gray-100">
            <th class="text-left px-2 py-1">#</th>
            {#each visibleColumns as col}
            <th class="text-left px-2 py-1">{col.toUpperCase()}</th>
            {/each}
        </tr>
        </thead>
        <tbody>
        {#each pagedData as row, i}
            <tr on:click={() => rowclick(row)} class="hover:bg-sky-100 cursor-pointer">
            <td class="px-2 py-1 text-gray-500">{(currentPage - 1) * PerPage + i + 1}</td>
            {#each visibleColumns as col}
                <td class="px-2 py-1">{row[col]}</td>
            {/each}
            </tr>
        {/each}
        </tbody>
    </table>
    <div class="relative h-full">
        {#if showFilter}
            <div class="bg-gray-200 shadow-xl z-40 h-full absolute floating-panel"
            style="width: 200px; top: 0; right: 0;transform: translateX( `200px` );">
            <form on:submit|preventDefault={(e) => {
                const fd = new FormData(e.target as HTMLFormElement);
                const col = fd.get('col') as string;
                const operand = fd.get('operand') as string;
                const value = fd.get('value');
                columnFilters = { ...columnFilters, [col]: { operand, value } };
            }} class="flex gap-2 flex-wrap">
                <select name="col" class="border px-2 py-1">
                {#each allColumns as col}<option value={col}>{col}</option>{/each}
                </select>
                <select name="operand" class="border px-2 py-1">
                {#each ['<', '>', '<=', '>=', '==', '!=', '*'] as op}<option value={op}>{op}</option>{/each}
                </select>
                <input name="value" type="text" class="border px-2 py-1" />
                <button type="submit" class="btn"><i class="fas fa-plus"></i></button>
            </form>

            <ul class="flex flex-wrap gap-2 mt-2">
                {#each Object.entries(columnFilters) as [col, { operand, value }]}
                <li class="bg-gray-200 px-2 py-1 rounded">
                    {col} {operand} {value}
                    <button on:click={() => { delete columnFilters[col]; }} class="ml-2"><i class="fas fa-times"></i></button>
                </li>
                {/each}
            </ul>
            </div>
        {/if}
        {#if showConfig}
            <div class="mb-4">
            <label class="block mb-2 font-semibold">Columns:</label>
            <div class="grid grid-cols-2 gap-2">
                {#each allColumns as col}
                <label>
                    <input type="checkbox" bind:group={visibleColumns} value={col} /> {col}
                </label>
                {/each}
            </div>

            <label class="block mt-4">Rows per page:
                <select bind:value={PerPage} class="ml-2 border px-2 py-1">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                </select>
            </label>
            </div>
        {/if}
    </div>
  </div>
  <footer class="mt-4 flex justify-between items-center">
    <div>
      Showing {Math.min((currentPage - 1) * PerPage + 1, filteredData.length)} -
      {Math.min(currentPage * PerPage, filteredData.length)} of {filteredData.length}
    </div>
    <div class="flex gap-2">
      <button on:click={() => currentPage = 1}><i class="fas fa-step-backward"></i></button>
      <button on:click={() => currentPage = Math.max(currentPage - 1, 1)}><i class="fas fa-chevron-left"></i></button>
      <span>Page {currentPage}</span>
      <button on:click={() => currentPage = currentPage + 1}><i class="fas fa-chevron-right"></i></button>
      <button on:click={() => currentPage = Math.ceil(filteredData.length / PerPage)}><i class="fas fa-step-forward"></i></button>
    </div>
  </footer>
</section>
