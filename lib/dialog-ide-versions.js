'use strict'

// The Dialog-IDE repo ships an antora.yml with `version: ~`, so Antora can only
// ever represent it as a single, unversioned component. Because we pull the
// manual from more than one git ref (the `main` branch plus the release tags),
// every ref lands in that same unversioned bucket and Antora aborts with a
// "Duplicate nav in @dialog-ide" error.
//
// This extension runs right after content aggregation and splits the merged
// dialog-ide bucket back apart, one component version per git ref, deriving a
// real version string from each ref name (`main` stays `main`; tag `v0.6.0`
// becomes `0.6.0`). The `main` build is flagged as a prerelease so the release
// tag remains the "latest" version of the component.

const COMPONENT = 'dialog-ide'

function versionForOrigin (origin) {
  if (origin.reftype === 'tag') {
    return { version: origin.refname.replace(/^v/, ''), prerelease: false }
  }
  return { version: origin.refname, prerelease: true }
}

module.exports.register = function () {
  this.once('contentAggregated', ({ contentAggregate }) => {
    for (let i = 0; i < contentAggregate.length; i++) {
      const entry = contentAggregate[i]
      if (entry.name !== COMPONENT || !Array.isArray(entry.origins) || entry.origins.length < 2) continue

      const buckets = new Map()
      for (const file of entry.files) {
        const origin = file.src.origin
        const { version, prerelease } = versionForOrigin(origin)
        let bucket = buckets.get(version)
        if (!bucket) {
          const { files, origins, nav, ...descriptor } = entry
          bucket = Object.assign(descriptor, {
            version,
            prerelease,
            files: [],
            origins: [],
            nav: Array.isArray(nav) ? Object.assign([...nav], { origin }) : nav,
          })
          buckets.set(version, bucket)
        }
        bucket.files.push(file)
        if (!bucket.origins.includes(origin)) bucket.origins.push(origin)
      }

      const replacements = [...buckets.values()].sort((a, b) => a.version.localeCompare(b.version))
      contentAggregate.splice(i, 1, ...replacements)
      i += replacements.length - 1
    }
  })
}
