<script lang="ts">
  import { onMount, setContext } from "svelte";
  import { asset } from "$app/paths";
  import "../app.css";
  import { SvelteToast } from "@zerodevx/svelte-toast";
  import PwaUpdate from "#lib/components/PwaUpdate.svelte";
  import { InfoIcon } from "#lib/icons/index.ts";

  let showSplash = $state(import.meta.env.PROD); // only show the splash screen in production
  let ui = $state({ showInfo: false });
  setContext("ui", ui);

  let { children } = $props();

  onMount(() => {
    const timer = setTimeout(() => {
      showSplash = false;
    }, 1500);

    return () => clearTimeout(timer);
  });
</script>

{#if showSplash}
  <div
    class="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900"
  >
    <img
      src={asset("favicon-dark.png")}
      alt="Geo Recorder"
      class="h-17.5 w-17.5 object-contain"
    />
  </div>
{/if}

<div class="relative h-screen flex flex-col">
  <div class="absolute top-4 right-4 z-100">
    <PwaUpdate />
  </div>
  {@render children()}
</div>

<SvelteToast options={{ duration: 800, reversed: true, intro: { y: 20 } }} />

<div class="fixed w-screen bottom-8 px-4 flex justify-between items-center">
  {#if ui.showInfo}
    <div
      class="absolute bottom-12 m-3 mr-6 p-3 border-2 rounded dark:border-white flex items-center"
    >
      <p>
        Capture geographic coordinates with supporting metadata for use in other
        apps. Simple!
      </p>
      <button onclick={() => (ui.showInfo = false)}>
        <InfoIcon />
      </button>
    </div>
  {/if}
  <button
    class="bottom-4 left-4"
    onclick={() => (ui.showInfo = !ui.showInfo)}
  >
    <InfoIcon />
  </button>
  <a
    class="flex gap-4 items-center"
    href="https://github.com/ianengelbrecht/geo-recorder"
    target="_blank"
  >
    v{__APP_VERSION__}
    <div>
      <img
        src={asset("github-light.png")}
        alt="View on GitHub"
        class="h-8 w-8 dark:hidden"
      />
      <img
        src={asset("github-dark.png")}
        alt="View on GitHub"
        class="hidden h-8 w-8 dark:block"
      />
    </div>
  </a>
</div>
