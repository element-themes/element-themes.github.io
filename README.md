# Element Theme Gallery

Static GitHub Pages gallery for browsing Element Web and Desktop themes.

- Gallery repository: [element-themes/element-themes.github.io](https://github.com/element-themes/element-themes.github.io)
- Theme collection: [element-themes/themes](https://github.com/element-themes/themes)
- Published site: [element-themes.github.io](https://element-themes.github.io/)

The gallery repository contains only the site code. Theme JSON files, screenshots, and the manifest live in the separate public themes repository.

## Local development

Requires Node.js 24 and pnpm.

```sh
pnpm install
pnpm dev
```

`pnpm dev` syncs the themes into the ignored `public/themes/` directory before starting Vite. It uses the ignored `.themes-repository/` checkout when present. Fresh clones use the public themes repository.

Build the production site:

```sh
pnpm build
```

The build runs `pnpm sync-themes`, validates the downloaded manifest and preview files, then copies the collection to `dist/themes/`.

For offline development against a local checkout of the themes repository:

```sh
THEMES_SOURCE_DIR=../themes pnpm sync-themes
pnpm build:site
```

## Updating the collection

Theme contributions belong in [element-themes/themes](https://github.com/element-themes/themes), not this repository. Each theme needs a JSON file, a manifest entry, and at least one screenshot.

The themes repository also contains `pnpm import-themes`. That maintainer command refreshes themes imported from `aaronraimist/element-themes` while preserving direct contributions. Normal theme contributors do not need to run it.

## Deployment

The GitHub Actions workflow uses Node.js 24, installs dependencies, syncs the themes repository, builds the site, and deploys it to GitHub Pages. In repository settings, set the Pages source to GitHub Actions.

## Popularity sorting

The gallery can record `copy-theme-url` events with Umami and sort themes using aggregated counts in `src/data/popularity.json`. Analytics is optional. The gallery works normally when it is not configured.

Configure these GitHub Actions repository variables:

- `UMAMI_SCRIPT_URL`: tracker URL, such as `https://cloud.umami.is/script.js` or a self-hosted tracker URL
- `UMAMI_WEBSITE_ID`: the Umami website ID
- `UMAMI_API_URL`: optional API base; defaults to `https://api.umami.is/v1` for Umami Cloud

Configure one repository secret:

- `UMAMI_API_KEY`: Umami Cloud API key
- `UMAMI_BEARER_TOKEN`: alternative for a self-hosted Umami instance

Only one API credential is required. The daily `update-popularity.yml` workflow reads aggregated event values from Umami, updates the tracked JSON file, and commits changed counts. Its commit triggers the normal Pages deployment.

For local analytics testing, set `VITE_UMAMI_SCRIPT_URL` and `VITE_UMAMI_WEBSITE_ID` before running `pnpm dev`.

## Attribution and license

Some themes and screenshots were imported from [aaronraimist/element-themes](https://github.com/aaronraimist/element-themes), which uses the Unlicense. Other themes may be contributed directly to the collection. Author attribution is retained in the relevant repository history.

Element and Matrix are trademarks of their respective owners. This community project is not affiliated with Element or The Matrix.org Foundation.
