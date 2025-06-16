<script lang="ts">
const { page = 1, data = [], totalrows = 0, title = 'Dynagrid', rowclick = () => {}, show = 20, filter = true, conf = true } = $props();
let currentPage = $state(page);
let visibleColumns: string[] = $state([]);
let columnFilters: Record<string, { operand: string; value: any }> = $state({});
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
});
$effect(() => {
  pagedData = filteredData.slice((currentPage - 1) * PerPage, currentPage * PerPage);
  // console.log(snapshot(filteredData),snapshot(visibleColumns));
});

let showConfig = $state(false);
let showFilter = $state(false);
function cf_show(){
  showConfig = !showConfig;
  if(showFilter)showFilter=!showConfig?true:false;
}
function ft_show(){
  showFilter = !showFilter;
  if(showConfig)showConfig=!showFilter?true:false;
}
function filt_submit(e:Event){
  e.preventDefault();
  const fd = new FormData(e.target as HTMLFormElement);
  const col = fd.get('col') as string;
  const operand = fd.get('operand') as string;
  const value = fd.get('value');
  columnFilters = { ...columnFilters, [col]: { operand, value } };
}
function makeResizable(node: HTMLElement) {
  const resizer = node.querySelector('.resizer') as HTMLElement;
  if (!resizer) return;
  let startX: number, startWidth: number;
  const mouseDownHandler = (e: MouseEvent) => {
    startX = e.clientX;
    startWidth = node.offsetWidth;
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };

  const mouseMoveHandler = (e: MouseEvent) => {
    const dx = e.clientX - startX;
    node.style.width = `${startWidth + dx}px`;
  };

  const mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };
  resizer.addEventListener('mousedown', mouseDownHandler);
  return {
    destroy() {
      resizer.removeEventListener('mousedown', mouseDownHandler);
    }
  };
}
</script>
<style>
.floating-panel { transition: transform 0.3s ease; will-change: transform; }
.resizer { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; user-select: none; }
</style>
<section class="border rounded p-4" style="display:grid;grid-template-rows:auto 1fr auto;">
  <header class="flex justify-between items-center px-1">
    <h1 class="text-xl font-bold">{title}</h1>
    <div class="flex gap-2">
      {#if conf} <button onclick={cf_show} class="btn"><i class="fas fa-cog"></i></button> {/if}
      {#if filter} <button onclick={ft_show} class="btn"><i class="fas fa-filter"></i></button> {/if}
    </div>
  </header>
  <div class="grid grid-rows-1 overflow-x-hidden relative h-full">
    <div class="overflow-x-auto w-full h-full">
      <table class="w-full min-w-max border">
        <thead>
        <tr class="bg-gray-100">
            {#each visibleColumns as col}
            <th class="text-left px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis relative group" use:makeResizable>
              {col.toUpperCase()}
              <div class="resizer"></div>
            </th>
            {/each}
        </tr>
        </thead>
        <tbody>
        {#each pagedData as row, i}
            <tr onclick={rowclick(row)} class="hover:bg-sky-100 cursor-pointer">
            {#each visibleColumns as col}
                <td class="px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis">{row[col]}</td>
            {/each}
            </tr>
        {/each}
        </tbody>
      </table>
    </div>

    {#if showFilter}<aside class="bg-gray-200 shadow-xl z-40 h-full absolute floating-panel p-1"
    style="width: 200px; top: 0; right: 0;transform: translateX( `200px` );">
      <ul class="flex flex-wrap gap-2 mt-2">
        {#each Object.entries(columnFilters) as [col, { operand, value }]}
        <li class="bg-gray-200 px-2 py-1 border rounded-sm">
            {col} {operand} {value}
            <button onclick={() => { delete columnFilters[col]; }} class="ml-2"><i class="fas fa-times"></i></button>
        </li>
        {/each}
      </ul>

      <form onsubmit={filt_submit} class="flex gap-2 flex-wrap">
        <select name="col" class="border px-2 py-1">
        {#each allColumns as col}<option value={col}>{col}</option>{/each}
        </select>
        <select name="operand" class="border px-2 py-1">
        {#each ['<', '>', '<=', '>=', '==', '!=', '*'] as op}<option value={op}>{op}</option>{/each}
        </select>
        <input name="value" type="text" class="border px-2 py-1" />
        <button type="submit" class="btn"><i class="fas fa-plus"></i></button>
      </form>
    </aside>{/if}

    {#if showConfig}<aside class="bg-gray-200 shadow-xl z-40 h-full absolute floating-panel p-1"
    style="width: 200px; top: 0; right: 0;transform: translateX( `200px` );">
    <label class="block mb-2 font-semibold">Columns:</label>
    <div class="grid grid-cols-2 gap-2">
        {#each allColumns as col}
        <span class="whitespace-nowrap">
            <input type="checkbox" bind:group={visibleColumns} value={col} /> {col}
        </span>
        {/each}
    </div>

      <span class="block mt-4">Rows per page:
        <select bind:value={PerPage} class="ml-2 border px-2 py-1">
          {#each [10, 20, 50, 100] as disp}<option value={disp}>{disp}</option>{/each}
        </select>
      </span>
    </aside>{/if}
  </div>
  <footer class="mt-4 flex justify-between items-center px-1">
    <div>
      Showing {Math.min((currentPage - 1) * PerPage + 1, filteredData.length)} -
      {Math.min(currentPage * PerPage, filteredData.length)} of {filteredData.length}
    </div>
    <div class="flex gap-2">
      <button onclick={() => currentPage = 1}><i class="fas fa-step-backward"></i></button>
      <button onclick={() => currentPage = Math.max(currentPage - 1, 1)}><i class="fas fa-chevron-left"></i></button>
      <span>Page {currentPage}</span>
      <button onclick={() => currentPage = currentPage + 1}><i class="fas fa-chevron-right"></i></button>
      <button onclick={() => currentPage = Math.ceil(filteredData.length / PerPage)}><i class="fas fa-step-forward"></i></button>
    </div>
  </footer>
</section>
