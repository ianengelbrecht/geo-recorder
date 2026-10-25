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

  import type { settings } from "../types";
  import { formatCoordsString } from "../lib/utils/formatCoordsString";

  const ui = getContext<{ showInfo: boolean }>("ui");

  let locationError = $state<"denied" | "unavailable" | "timeout" | null>(null);
  let showLocationHelp = $state(false);
  let locationErrorMessage = $state<string | null>(null);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  let coordsPresenter: HTMLParagraphElement | null = $state(null);
  let coordsString: string | null;
  let accuracy: number | null = $state(null);
  const accuracyThreshold = 250;

  // fetch the settings from localStorage
  const defaultSettings: settings = {
    format: "DD",
    ddAsString: false,
    removeSpaces: false,
    includeDatum: true,
    includeGrid: "",
  };
  let geoSettings: settings = JSON.parse(
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

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          locationError = null;
          locationErrorMessage = null;

          coordsString = formatCoordsString(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy,
            geoSettings,
          );

          if (coordsPresenter) {
            coordsPresenter.innerHTML = coordsString;
            accuracy = position.coords.accuracy;
          }
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
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  });

  const copyCoords = () => {
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
              : "Location unavailable - please wait..."}
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
      <p
        id="coords"
        bind:this={coordsPresenter}
        class="p-2 border rounded"
      >
        Waiting for location...
      </p>
      <button
        onclick={copyCoords}
        class="w-fit mt-4 p-2 bg-blue-600 rounded active:bg-blue-400 text-white"
      >
        <CopyIcon />
        <span>Copy coordinates</span>
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
