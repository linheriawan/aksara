<script lang="ts">
  import EditorLayout from '$lib/layouts/editorLayout.svelte'; 
  let {data,children}=$props();
</script>

<EditorLayout {...data.app}>
  {@render children()}
</EditorLayout>
