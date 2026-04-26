# Privacy

Soundlings is a static website. It performs **no network requests** other
than fetching its own static files (`index.html`, the bundled JS / CSS
chunks, the favicon, `assets/manifest.json`, and the mp3 of whichever
sound you tap) from whatever server hosts the page.

## Data we collect

None. There is no backend, no analytics, no tracking, no third-party SDKs.

## Data stored on your device

Only two values, in `localStorage` under the key `soundlings.v1`:

- `lang`: your chosen interface language (`zh` or `en`)
- `theme`: your chosen theme (`light`, `dark`, or `auto`)

That's it. No usage data, no identifiers, no audio recording.

## Permissions

None requested.

## Open source

The complete source code is available — every line that runs on your
device is in this repository.

## Audio attribution

Every audio asset is either CC0 1.0 (public domain) or CC BY 4.0 with
attribution. See [`CREDITS.md`](CREDITS.md) for the full per-file list,
or open Settings → Audio credits inside the app.
