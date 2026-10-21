<script lang="ts">
import { asset  } from '$app/paths';
  import '../app.css';
  import { SvelteToast } from '@zerodevx/svelte-toast'
  import PwaUpdate from '#lib/components/PwaUpdate.svelte';
	
	let { children } = $props();

</script>

<div class="relative h-screen flex flex-col">
  <div class="absolute top-4 right-4">
    <PwaUpdate />
  </div>
  {@render children()}
</div>

<SvelteToast options={{ duration: 800, reversed: true, intro: { y: 20 } }} />

<div class="fixed bottom-4 right-12">
  <div class="flex gap-4 items-center">
    v{__APP_VERSION__}
    <a href="https://github.com/ianengelbrecht/geo-recorder" target="_blank">
      <img src={asset('github-dark.png')} alt="View on GitHub" class="h-8 w-8" />
    </a>
  </div>
</div>

