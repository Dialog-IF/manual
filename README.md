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

## Local Site Build

When building locally, you will need two sibling workspaces: one for this repository, and one for the main
Dialog source.

Retrieve the content:

* `git clone https://github.com/dialog-if/manual.git` (or your own fork)
* `git clone https://github.com/dialog-if/dialog.git` (or your own fork)
* `cd manual`
* `bb local`

This script uses `watchexec` to monitor the `pedestal/docs` folders (and others) for changes and (almost instantly!)
rebuild the output documentation.

You'll have to manually refresh your browser.

It will also generate desktop notifications when it runs (when on supported platforms).

### Antora Notes
 
On OS X, Antora stores Git repos in `~/Library/Caches/antora/` by default.

Be careful to keep `antora-playbook.yml` and `local-antora-playbook.yml` in sync.

We are currently using the default Antora UI, with overrides in the `ui-overrides` directory.
