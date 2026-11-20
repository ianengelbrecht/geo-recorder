<script lang="ts">
  import { onMount, getContext } from "svelte";
  import { resolve } from "$app/paths";
  import { toast } from "@zerodevx/svelte-toast";
  import {
    CopyIcon,
    InfoIcon,
    SunIcon,
    MoonIcon,
    SettingsIcon,
    WarningIcon,
  } from "#lib/icons/index.ts";

  import { defaultSettings } from "./defaultSettings.ts";
  import { formatCoordsString } from "../lib/utils/formatCoordsString";
  import { coordsToQDS } from "../lib/utils/coordsToQDS";
  import { getCurrentDateTime } from "../lib/utils/getCurrentDate";

  const ui = getContext<{ showInfo: boolean }>("ui");

  let locationError = $state<"denied" | "unavailable" | "timeout" | null>(null);
  let showLocationHelp = $state(false);
  let locationErrorMessage = $state<string | null>(null);
  let locationCountdown = $state(30);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  let coordsPresenter: HTMLDivElement | null = $state(null);
  let coordsString: string | null = $state(null);
  let latitude: number | null = $state(null);
  let longitude: number | null = $state(null);
  let accuracy: number | null = $state(null);
  const accuracyThreshold = 250;

  let geoSettings = JSON.parse(
    localStorage.getItem("geoSettings") || JSON.stringify(defaultSettings),
  );

  let theme = $state<"dark" | "light">("dark");

  const toggleTheme = () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        "content",
        theme === "dark" ? "#0f172a" : "#ffffff",
      );
    }
  };

  onMount(() => {
    let watchId: number | undefined;

    const countdownInterval = setInterval(() => {
      if (accuracy === null) {
        locationCountdown = locationCountdown > 1 ? locationCountdown - 1 : 30;
      }
    }, 1000);

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          locationError = null;
          locationErrorMessage = null;

          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          accuracy = position.coords.accuracy;

          coordsString = formatCoordsString(
            latitude,
            longitude,
            accuracy,
            geoSettings,
            true,
          );

          if (coordsPresenter) {
            let coordsPresenterHTMLString = `<p class="w-full text-xl font-semibold text-center">${coordsString} ± ${Math.round(accuracy)}m</p>`;

            let coordsPresenterMetaDataValues: string[] = [];
            if (geoSettings.includeDatum) {
              coordsPresenterMetaDataValues.push("WGS84");
            }

            if (geoSettings.includeGrid) {
              coordsPresenterMetaDataValues.push(
                coordsToQDS(`${latitude}, ${longitude}`)!,
              );
            }

            if (coordsPresenterMetaDataValues.length > 0) {
              coordsPresenterHTMLString += `<p class="w-full text-center">${coordsPresenterMetaDataValues.join(" | ")}</p>`;
            }

            if (geoSettings.includeDate) {
              const dateNow = getCurrentDateTime(
                geoSettings.useSlashesNotDashes,
                geoSettings.includeTime,
              );
              coordsPresenterHTMLString += `<p class="w-full text-center">${dateNow}</p>`;
            }

            coordsPresenter.innerHTML = coordsPresenterHTMLString;
          }

          locationCountdown = 30;
        },
        (error) => {
          accuracy = null;
          locationErrorMessage = `Code ${error.code}: ${error.message}`;
          switch (error.code) {
            case 1:
              locationError = "denied";
              break;
            case 2:
              locationError = "unavailable";
              break;
            case 3:
              locationError = "timeout";
              break;
          }

          if (coordsPresenter) {
            accuracy = null;
            coordsPresenter.textContent = "Location unavailable";
          }

          console.error("Geolocation error:", error.code, error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 60000,
          maximumAge: 0,
        },
      );
    } else {
      accuracy = null;
      locationError = "unavailable";
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      theme = savedTheme;
    } else {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    return () => {
      clearInterval(countdownInterval);
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  });

  const copyCoords = () => {
    if (!coordsString) return alert("No position available");

    const fullString = formatCoordsString(
      latitude || 0,
      longitude || 0,
      accuracy || 0,
      geoSettings,
      false,
    );

    navigator.clipboard
      .writeText(fullString)
      .then(() => toast.push("Coordinates copied!"))
      .catch((err) => alert("Failed to copy coordinates: " + err));
  };

  const copyCoordsOnly = () => {
    if (!coordsString) return alert("No position available");

    navigator.clipboard
      .writeText(coordsString)
      .then(() => toast.push("Coordinates copied!"))
      .catch((err) => alert("Failed to copy coordinates: " + err));
  };
</script>

<main
  id="captureScreen"
  class="relative h-full flex flex-col p-4"
>
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl">Current Coordinates</h1>
    <div
      id="controls"
      class="flex items-center gap-4"
    >
      <button
        type="button"
        onclick={toggleTheme}
        aria-label={theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"}
        title={theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"}
        class="cursor-pointer"
      >
        {#if theme === "dark"}
          <SunIcon />
        {:else}
          <MoonIcon />
        {/if}
      </button>
      <a
        href={resolve("/settings")}
        aria-label="Settings"
      >
        <SettingsIcon />
      </a>
    </div>
  </div>
  <div class="flex-1 min-h-0 flex flex-col justify-center items-center">
    {#if locationError}
      <div class="my-3 rounded-lg border-2 border-amber-400 p-3">
        <div class="flex items-center justify-between gap-2">
          <span>
            {locationError === "denied"
              ? "Location access denied"
              : "Location unavailable"}
          </span>

          <button
            type="button"
            onclick={() => (showLocationHelp = !showLocationHelp)}
            aria-label="Location help"
            aria-expanded={showLocationHelp}
            class="rounded-full p-1 opacity-70 hover:opacity-100"
          >
            <InfoIcon />
          </button>
        </div>

        {#if showLocationHelp}
          <div class="mt-2 leading-relaxed opacity-80">
            {#if locationError === "denied"}
              <p>This app needs location access to capture coordinates.</p>

              {#if isIOS}
                <p class="mt-2">
                  Open Settings → Privacy & Security → Location Services, find
                  this app, and allow location access. If necessary, check
                  Safari's location settings.
                </p>
              {:else if isAndroid}
                <p class="mt-2">
                  Open Settings → Apps → this app → Permissions → Location, and
                  allow location access. If using Chrome, check the site's
                  permissions.
                </p>
              {:else}
                <p class="mt-2">
                  Enable location access for this website in your browser or
                  device settings.
                </p>
              {/if}
            {:else}
              <p>
                Check that your device's location services are enabled and try
                again.
              </p>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <div
        id="coords"
        bind:this={coordsPresenter}
        class="p-2 m-2 w-full md:w-1/3 lg:w-1/5 border rounded"
      >
        Waiting for location...
      </div>

      <button
        onclick={copyCoords}
        class="w-56 mt-4 p-2 bg-blue-600 rounded active:bg-blue-400 text-white disabled:opacity-50 cursor-pointer select-none"
        hidden={!coordsString}
      >
        <CopyIcon />
        <span>Copy full string</span>
      </button>
      <button
        onclick={copyCoordsOnly}
        class="w-56 mt-4 p-2 text-slate-800 border border-slate-800 dark:border-white dark:text-white rounded active:bg-blue-400 disabled:opacity-50 cursor-pointer select-none"
        hidden={!coordsString}
      >
        <CopyIcon />
        <span>Copy coords only</span>
      </button>
    {/if}
    {#if locationErrorMessage}
      <div class="mt-2 flex items-center">
        <p class="opacity-70">
          {locationErrorMessage}
        </p>
        <div class="h-6 w-6 text-red-400">
          <WarningIcon />
        </div>
      </div>
    {/if}
    {#if locationError === "unavailable" || locationError === "timeout"}
      <p class="mt-2 text-sm opacity-70">
        Please wait: {locationCountdown}s
      </p>
    {/if}
  </div>
  {#if isAndroid && accuracy && accuracy > accuracyThreshold && !ui.showInfo}
    <div class="mb-8 my-3 rounded-lg border-2 border-amber-400 p-3">
      <div class="flex items-center gap-2">
        <span>
          Your device is reporting an accuracy worse than {accuracyThreshold} metres.
          Check that Precise Location is enabled for this app in Android settings,
          as well as location settings for your browser.
        </span>
        <div class="h-6 w-6 text-amber-400">
          <WarningIcon />
        </div>
      </div>
    </div>
  {/if}
</main>
