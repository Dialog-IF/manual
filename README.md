## Setup

The site is built using [Antora](https://antora.org/).

* You must have a recent version of [NodeJS](https://nodejs.org/)
* You need [Babashka](https://book.babashka.org/); on OS X `brew install borkdude/brew/babashka`
* You need the [watchexec command](https://github.com/watchexec/watchexec); on OS X: `brew install watchexec`
* Finally, a local install of Antora: `npm install` will download Antora and its dependencies

## Building the Site

## Full Site Build

To build the full site locally (i.e., the way the GitHub action does):

    npx antora --fetch antora-playbook.yml

This will build all versions of Dialog documentation (currently just the main branch).

Console output will identify the local file URL to load to see the generated site.

This runs once, to completion.

## Publishing

The `.github/workflows/pages.yml` workflow builds the site with Antora and deploys it to GitHub Pages.
It runs automatically on every push to `main`, and can also be started manually from the Actions tab
(`workflow_dispatch`).

Because Antora pulls content from several *other* repositories (see `antora-playbook.yml`), a push to
this repository is not the only reason the published site may be stale. The workflow therefore also
listens for a `repository_dispatch` event of type `rebuild-manual`, so a content repository can force a
fresh build/redeploy after it changes.

### Triggering a rebuild from another repository

The source repositories consumed by `antora-playbook.yml` (currently `Dialog-IF/dialog`,
`Dialog-IF/aamachine`, and `Dialog-IF/dialog-ide`) can trigger a rebuild by sending a
`repository_dispatch` event to this repository.

**1. Create a token**

Create a token that has permission to send dispatch events to this repository and store it as a secret
(for example `MANUAL_REBUILD_TOKEN`) in the *triggering* repository:

* Fine-grained personal access token (or GitHub App installation token): grant the **Contents:
  read and write** permission on `dialog-if/manual`.
* Classic personal access token: the `repo` scope.

**2. Add a job to the other repository's workflow**

Add a step that fires after the content has been updated (typically on push to `main`):

```yaml
  rebuild-manual:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger manual rebuild
        run: |
          curl --fail --silent --show-error -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer ${{ secrets.MANUAL_REBUILD_TOKEN }}" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            https://api.github.com/repos/dialog-if/manual/dispatches \
            -d '{"event_type":"rebuild-manual"}'
```

Or, using a published action instead of `curl`:

```yaml
      - name: Trigger manual rebuild
        uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.MANUAL_REBUILD_TOKEN }}
          repository: dialog-if/manual
          event-type: rebuild-manual
```

The `event_type` / `event-type` **must** be `rebuild-manual` to match the `repository_dispatch` filter
in `pages.yml`. An optional `client_payload` object may be included; the current workflow ignores it.

You can test the wiring by hand:

```
curl --fail -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/dialog-if/manual/dispatches \
  -d '{"event_type":"rebuild-manual"}'
```

A successful call returns HTTP 204 and a new "Publish to GitHub Pages" run appears in the Actions tab.

## Local Site Build

For fast, iterative editing you can build a *single* manual against a local checkout of its
source repository, rebuilding automatically whenever you save a change.

Each local build expects the source repository to be checked out as a sibling of this `manual`
directory:

    dialog/          <- github.com/Dialog-IF/dialog
    aamachine/       <- github.com/Dialog-IF/aamachine
    dialog-ide/      <- github.com/Dialog-IF/dialog-ide
    manual/          <- this repository

You only need the sibling(s) for the flavor(s) you actually want to build. For example:

* `git clone https://github.com/Dialog-IF/manual.git` (or your own fork)
* `git clone https://github.com/Dialog-IF/dialog.git` (or your own fork)
* `cd manual && npm install`
* `bb dialog`

### The three flavors

There are three local build flavors, each driven by a `bb` task with its own
`local-antora-playbook-*.yml`:

| Task           | Playbook                                | Sibling repo    | Source path |
|----------------|-----------------------------------------|-----------------|-------------|
| `bb dialog`    | `local-antora-playbook-dialog.yml`      | `../dialog`     | `manual`    |
| `bb ide`       | `local-antora-playbook-dialog-ide.yml`  | `../dialog-ide` | `docs`      |
| `bb aamachine` | `local-antora-playbook-aamachine.yml`   | `../aamachine`  | `antora`    |

Run the task from the `manual` directory. Each task uses `watchexec` to monitor the relevant
source folder (plus `ui-overrides`, `lib`, and the playbook itself) and rebuilds — almost
instantly — on any change.

You'll have to manually refresh your browser. On supported platforms each rebuild also raises a
desktop notification.

Run `bb tasks` to see every task; `bb build` runs the full production build (the same as
`npx antora antora-playbook.yml`).

### Antora Notes
 
On OS X, Antora stores Git repos in `~/Library/Caches/antora/` by default.

Be careful to keep `antora-playbook.yml` and the `local-antora-playbook-*.yml` files in sync.

We are currently using the default Antora UI, with overrides in the `ui-overrides` directory.
