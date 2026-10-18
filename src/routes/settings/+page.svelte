<script lang="ts">
  import type { settings } from '../../types'
  import {goto} from '$app/navigation'

  const formatOptions = [ 'DD', 'DM', 'DMS' ]
  const gridOptions =['QDS']

  // fetch the settings from localStorage
  // fetch the settings from localStorage
  const defaultSettings = {
    format: 'DD',
    removeSpaces: false,
    includeDatum: true,
    includeGrid: true
  }
  let geoSettings: settings = JSON.parse(localStorage.getItem('geoSettings') || JSON.stringify(defaultSettings))
  
  const saveSettings = () => {
    localStorage.setItem('geoSettings', JSON.stringify(geoSettings))
    goto('/')
  }

  let edits = false

</script>

<main class="flex-1 p-4">
  <h1 class="text-xl mb-4">Settings</h1>
  <form class="flex flex-col gap-4">
    <label class="flex items-center gap-2">
      Format:
      <select bind:value={geoSettings.format} class="bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-transparent rounded p-2" onchange={() => edits = true}>
        {#each formatOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>
    <label class="flex items-center gap-2">
      Remove Spaces:
      <input type="checkbox" bind:checked={geoSettings.removeSpaces} class="h-6 w-6 rounded" onchange={() => edits = true} />
    </label>
    <label class="flex items-center gap-2">
      Include Grid (currently QDGS only):
      <select bind:value={geoSettings.includeGrid} class="bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-transparent rounded p-2" onchange={() => edits = true}>
        <option value="">None</option>
        {#each gridOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>
    <label class="flex items-center gap-2">
      Include Datum:
      <input type="checkbox" bind:checked={geoSettings.includeDatum} class="h-6 w-6 rounded" onchange={() => edits = true} />
    </label>
    <button type="button" onclick={saveSettings} class="w-32 mt-4 p-2 bg-blue-600 rounded active:bg-blue-400 text-white">{edits ? 'Save Settings' : 'Back'}</button>
  </form>
</main>

