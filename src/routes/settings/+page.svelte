<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getCurrentDateTime } from "../../lib/utils/getCurrentDate";
  import { defaultSettings } from "../defaultSettings.ts";

  const formatOptions = ["DD", "DM", "DMS"];
  const gridOptions = ["QDS"];

  let geoSettings = JSON.parse(
    localStorage.getItem("geoSettings") || JSON.stringify(defaultSettings),
  );

  const saveSettings = () => {
    localStorage.setItem("geoSettings", JSON.stringify(geoSettings));
    goto(resolve("/"));
  };

  let edits = false;
</script>

<main class="flex-1 p-4 h-full">
  <h1 class="text-xl mb-4">Settings</h1>
  <form class="flex flex-col gap-4">
    <label class="flex items-center gap-2">
      Format:
      <select
        bind:value={geoSettings.format}
        class="bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-transparent rounded p-2"
        onchange={() => (edits = true)}
      >
        {#each formatOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>
    {#if geoSettings.format === "DD"}
      <label class="flex items-center gap-2">
        DD with symbols:
        <input
          type="checkbox"
          bind:checked={geoSettings.ddAsString}
          class="h-6 w-6 rounded"
          onchange={() => (edits = true)}
        />
      </label>
    {/if}
    <label class="flex items-center gap-2">
      Remove Spaces:
      <input
        type="checkbox"
        bind:checked={geoSettings.removeSpaces}
        class="h-6 w-6 rounded"
        onchange={() => (edits = true)}
      />
    </label>
    <label class="flex items-center gap-2">
      Use Accuracy Placeholder:
      <input
        type="checkbox"
        bind:checked={geoSettings.useAccuracyPlaceholder}
        class="h-6 w-6 rounded"
        onchange={() => (edits = true)}
      />
    </label>
    <label class="flex items-center gap-2">
      Include Grid (currently QDGS only):
      <select
        bind:value={geoSettings.includeGrid}
        class="bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-transparent rounded p-2"
        onchange={() => (edits = true)}
      >
        <option value="">None</option>
        {#each gridOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>
    <label class="flex items-center gap-2">
      Include Datum:
      <input
        type="checkbox"
        bind:checked={geoSettings.includeDatum}
        class="h-6 w-6 rounded"
        onchange={() => (edits = true)}
      />
    </label>
    <label class="flex items-center gap-2">
      Include Date:
      <input
        type="checkbox"
        bind:checked={geoSettings.includeDate}
        class="h-6 w-6 rounded"
        onchange={() => (edits = true)}
      />
    </label>
    {#if geoSettings.includeDate}
      <label class="flex items-center gap-2">
        Use Slashes Not Dashes ({getCurrentDateTime(
          geoSettings.useSlashesNotDashes,
          false,
        )}):
        <input
          type="checkbox"
          bind:checked={geoSettings.useSlashesNotDashes}
          class="h-6 w-6 rounded"
          onchange={() => (edits = true)}
        />
      </label>
      <label class="flex items-center gap-2">
        Include Time:
        <input
          type="checkbox"
          bind:checked={geoSettings.includeTime}
          class="h-6 w-6 rounded"
          onchange={() => (edits = true)}
        />
      </label>
    {/if}
    <button
      type="button"
      onclick={saveSettings}
      class="w-32 mt-4 p-2 bg-blue-600 rounded active:bg-blue-400 text-white"
    >
      {edits ? "Save Settings" : "Back"}
    </button>
  </form>
</main>
