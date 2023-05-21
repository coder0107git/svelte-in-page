// Modified from https://cdn.jsdelivr.net/npm/@sveltejs/repl@0.4.0/dist/Bundler.js

// import Worker from '@sveltejs/repl@0.4.0/dist/workers/bundler/index.js';
/*const Worker = (
    await import(
        "https://esm.sh/@sveltejs/repl@0.4.0/dist/workers/bundler/index.js?worker"
    )
).default;*/

/*const workerRes = await fetch(
    "https://esm.sh/@sveltejs/repl@0.4.0/dist/workers/bundler/index.js"
);
const workerUrl = URL.createObjectURL(await workerRes.blob());*/

/*const workerBuilder = (
    await import(
        "https://esm.sh/@sveltejs/repl@0.4.0/dist/workers/bundler/index.js?worker"
    )
).default;*/

const workerCodeBlob = new Blob(
    [
        `await import("https://esm.sh/@sveltejs/repl@0.4.0/dist/workers/bundler/index.js")`,
    ],
    { type: "text/javascript" }
);

const workerBuilder = () =>
    new Worker(URL.createObjectURL(workerCodeBlob), {
        type: "module",
    });

function BuildWorker() {
    return workerBuilder(); //new Worker(workerUrl, { type: "module" });
}

let debugNum = 0;

function debug() {
    console.log(debugNum++);
}

const workers = new Map();

let uid = 1;

class Bundler {
    constructor({ packagesUrl, svelteUrl, onstatus }) {
        const hash = `${packagesUrl}:${svelteUrl}`;

        if (!workers.has(hash)) {
            const worker = new BuildWorker();

            const workerErrorHandler = (e, ...params) => {
                const message = JSON.stringify(
                    `${e.message} (${e.filename}:${e.lineno})`
                );

                console.error("Worker Error:", message, e, ...params);
            };

            [
                "error",
                "messageerror",
                "rejectionhandled",
                "unhandledrejection",
            ].forEach(eventName => {
                worker.addEventListener(eventName, workerErrorHandler);
            });

            worker.postMessage({ type: "init", packagesUrl, svelteUrl });
            workers.set(hash, worker);
        }
        debug();

        this.worker = workers.get(hash);

        this.handlers = new Map();

        this.worker.addEventListener("message", event => {
            const handler = this.handlers.get(event.data.uid);

            debug();

            console.log(handler, event);

            if (handler) {
                // if no handler, was meant for a different REPL
                if (event.data.type === "status") {
                    onstatus(event.data.message);
                    return;
                }

                onstatus(null);
                handler(event.data);
                this.handlers.delete(event.data.uid);
            }
        });

        debug();
    }

    bundle(components) {
        return new Promise(fulfil => {
            this.handlers.set(uid, fulfil);

            debug();

            this.worker.postMessage({
                uid,
                type: "bundle",
                components,
            });

            debug();

            uid += 1;
        });
    }

    destroy() {
        this.worker.terminate();
    }
}

export default Bundler;
export { Bundler };
