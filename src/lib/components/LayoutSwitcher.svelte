<script lang="ts">
  export let layout: string = 'classic'; // default fallback
  let selectedLayout = layout;
  function setLayout(newLayout: string) {
    document.cookie = `layout=${newLayout}; Path=/; Max-Age=31536000`;
    location.reload(); // to re-trigger +layout.server.ts
  }
</script>

<select bind:value={selectedLayout} on:change={() => setLayout(selectedLayout)}>
  <option value="editor" >Editor</option>
  <option value="floating" >Float</option>
  <option value="classic" >Classic</option>
</select>
