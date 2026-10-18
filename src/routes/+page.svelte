<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { toast } from '@zerodevx/svelte-toast'
  import type { record, settings }   from '../types'
  import { convert } from 'geo-coordinates-parser'
  import { coordsToQDS } from '../utils/coordsToQDS'

  let coordsPresenter: HTMLParagraphElement | null
  let coordsString: string | null

  let data: record[] = []

  // fetch the settings from localStorage
  const defaultSettings = {
    format: 'DD',
    removeSpaces: false,
    includeDatum: true,
    includeGrid: true
  }
  let geoSettings: settings = JSON.parse(localStorage.getItem('geoSettings') || JSON.stringify(defaultSettings))

  let theme = $state<'dark' | 'light'>('dark')

  const toggleTheme = () => {
    theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff')
    }
  }

  const formatCoordsString = (latitude: number, longitude: number, accuracy: number) => {
    let coordsString = ''
    if (geoSettings.format === 'DD') {
      coordsString = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    }
    else if (geoSettings.format === 'DM') {
      coordsString = convert(`${latitude}, ${longitude}`).toCoordinateFormat(convert.to.DM)
    }
    else if (geoSettings.format === 'DMS') {
      coordsString = convert(`${latitude}, ${longitude}`).toCoordinateFormat(convert.to.DMS)
    }

    if (geoSettings.removeSpaces) {
      coordsString = coordsString.replace(/\s+/g, '')
    }

    coordsString += ` ± ${Math.round(accuracy)}m`

    if (geoSettings.includeDatum) {
      coordsString += ' WGS84'
    }

    if (geoSettings.includeGrid) {
      coordsString += ` ${coordsToQDS(`${latitude}, ${longitude}`)}`
    }

    return coordsString
  }

  onMount(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(position => {
        coordsString = formatCoordsString(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
        if (coordsPresenter) {
          coordsPresenter.innerHTML = coordsString
        }
      }, error => {
        if (coordsPresenter) {
          coordsPresenter.innerHTML = 'Error getting location'
        }
        console.error(error)  
      })
    } else {
      if (coordsPresenter) {
        coordsPresenter.innerHTML = 'Geolocation is not supported'
      }
    }

    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      theme = savedTheme
    } else {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    data = JSON.parse(localStorage.getItem('geoData') || '[]')
    console.log('there are', data.length, 'items recorded')
  })

  const copyCoords = () => {
    if (!coordsString) return alert('No position available')

    navigator.clipboard.writeText(coordsString)
      .then(() => toast.push('Coordinates copied!'))
      .catch(err => alert('Failed to copy coordinates: ' + err))

  }

</script>

<main id="captureScreen" class="h-full flex flex-col p-4 border">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl ">Current Coordinates</h1>
    <div id="controls" class="flex items-center gap-4">
      <button 
        type="button" 
        onclick={toggleTheme} 
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        class="cursor-pointer"
      >
        {#if theme === 'dark'}
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M565-395q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35Zm-226.5 56.5Q280-397 280-480t58.5-141.5Q397-680 480-680t141.5 58.5Q680-563 680-480t-58.5 141.5Q563-280 480-280t-141.5-58.5ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"/></svg>
        {/if}
      </button>
      <a href={resolve('/settings')} aria-label="Settings">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>
      </a>
    </div>
  </div>
  <div class="flex-1 min-h-0 flex flex-col justify-center items-center">

    <p id="coords" bind:this={coordsPresenter} class="p-2 border rounded">Waiting for location...</p>
    <button onclick={copyCoords} class="w-fit mt-4 p-2 bg-blue-600 rounded active:bg-blue-400 text-white">
    <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-6 w-6" viewBox="0 -960 960 960" fill="currentColor"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>
    <span>
      Copy coordinates
    </span>  
    </button>
  </div>
</main>
