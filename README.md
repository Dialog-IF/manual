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

When building locally, you will need two sibling workspaces: one for this repository, and one for the main
Dialog source.

Retrieve the content:

* `git clone https://github.com/dialog-if/manual.git` (or your own fork)
* `git clone https://github.com/dialog-if/dialog.git` (or your own fork)
* `cd manual`
* `bb local`

This script uses `watchexec` to monitor the `dialog/docs` folders (and others) for changes and (almost instantly!)
rebuild the output documentation.

You'll have to manually refresh your browser.

It will also generate desktop notifications when it runs (when on supported platforms).

### Antora Notes
 
On OS X, Antora stores Git repos in `~/Library/Caches/antora/` by default.

Be careful to keep `antora-playbook.yml` and `local-antora-playbook.yml` in sync.

We are currently using the default Antora UI, with overrides in the `ui-overrides` directory.
