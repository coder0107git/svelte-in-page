// Based on https://github.com/sveltejs/sites/blob/cdcdb400101eaa2c8b54af69e5f22a2caac3b28b/packages/repl/src/lib/Repl.svelte

import { Bundler } from "./svelte-bundler.js";

export let packagesUrl = "https://unpkg.com/";
export let svelteUrl = `${packagesUrl}/svelte`;

const bundler = () =>
    new Bundler({
        packages_url: packagesUrl,
        svelte_url: svelteUrl,
        onstatus: (...params) => {
            /* no-op */ console.info(...params);
        },
    });

export default bundler;
export { bundler as Bundler };
