
<script lang="ts">
  import { onMount } from 'svelte';

  let updateAvailable = $state(false);
  let updating = $state(false);

  let registration: ServiceWorkerRegistration | undefined;

  onMount(() => {
    if (!('serviceWorker' in navigator)) return;

    let disposed = false;
    let reloading = false;
    let updateInterval: ReturnType<typeof setInterval>;
    let installingWorker: ServiceWorker | null = null;

    function checkWaiting() {
      if (disposed || !registration) return;

      // Only offer updates when an existing worker
      // is already controlling the application.
      updateAvailable = Boolean(
        registration.waiting &&
        navigator.serviceWorker.controller
      );
    }

    function onStateChange() {
      if (installingWorker?.state === 'installed') {
        checkWaiting();
      }
    }

    function onUpdateFound() {
      installingWorker?.removeEventListener(
        'statechange',
        onStateChange
      );

      installingWorker = registration?.installing ?? null;

      installingWorker?.addEventListener(
        'statechange',
        onStateChange
      );
    }

    function onControllerChange() {
      // Reload only after the user requested an update.
      if (updating && !reloading) {
        reloading = true;
        window.location.reload();
      }
    }

    async function checkForUpdates() {
      if (
        disposed ||
        !registration ||
        !navigator.onLine
      ) return;

      try {
        await registration.update();
        checkWaiting();
      } catch (error) {
        console.warn('PWA update check failed:', error);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void checkForUpdates();
      }
    }

    function onOnline() {
      void checkForUpdates();
    }

    async function initialise() {
      try {
        // SvelteKit automatically registers the worker.
        // Wait for its registration to become ready.
        registration = await navigator.serviceWorker.ready;

        if (disposed) return;

        registration.addEventListener(
          'updatefound',
          onUpdateFound
        );

        navigator.serviceWorker.addEventListener(
          'controllerchange',
          onControllerChange
        );

        document.addEventListener(
          'visibilitychange',
          onVisibilityChange
        );

        window.addEventListener('online', onOnline);

        // Handle an update already waiting.
        checkWaiting();

        // Handle an update currently installing.
        if (registration.installing) {
          onUpdateFound();
        }

        // Check immediately.
        await checkForUpdates();

      } catch (error) {
        console.warn('PWA update monitoring failed:', error);
      }
    }

    void initialise();

    return () => {
      disposed = true;

      registration?.removeEventListener(
        'updatefound',
        onUpdateFound
      );

      installingWorker?.removeEventListener(
        'statechange',
        onStateChange
      );

      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      );

      document.removeEventListener(
        'visibilitychange',
        onVisibilityChange
      );

      window.removeEventListener('online', onOnline);
    };
  });

  function applyUpdate() {
    if (!registration?.waiting || updating) return;

    updating = true;

    // Tell the new worker to activate.
    registration.waiting.postMessage({
      type: 'SKIP_WAITING'
    });
  }
</script>

{#if updateAvailable}
  <button
    type="button"
    onclick={applyUpdate}
    disabled={updating}
    class="shrink-0 rounded-md border  border-blue-300 dark:border-blue-700
            px-3 py-2 text-sm font-medium text-slate-700 dark:text-white
            hover:bg-blue-700 disabled:opacity-50"
  >
    {updating ? 'Updating...' : 'Update'}
  </button>
 
{/if}
