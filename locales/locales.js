
// Prepare localization
const fs = require('fs')
const { join, basename } = require('path')
const { FluentBundle, FluentResource } = require('@fluent/bundle')

const LOCALE_DIR = __dirname
const FALLBACK_LOCALE = 'en'

// Load the fallback locale resource to add to all resource bundles
const fallbackLocale = fs.readFileSync(join(LOCALE_DIR, FALLBACK_LOCALE+'.ftl')).toString()
const fallbackResource = new FluentResource(fallbackLocale)


const localization = {}

for (const f of fs.readdirSync(LOCALE_DIR)) {

  // Only process Fluent files
  if (!f.endsWith('.ftl')) continue

  // Read the Fluent resource and create a bundle for the language
  const lang = basename(f,'.ftl')
  const locale = fs.readFileSync(join(LOCALE_DIR, f)).toString()

  const res = new FluentResource(locale)
  const bundle = new FluentBundle(lang)

  // Add current language resource as a priority source
  bundle.addResource(res)

  // Add fallback bundle to handle e.g. missing translations from the
  // primary resource
  if (lang !== FALLBACK_LOCALE) bundle.addResource(fallbackResource)

  // All possible locales for the plugin
  localization[lang] = bundle
}

function localize(lang, message, params) {
  const bundle = localization[lang];

  // TODO: handle fuzzy-matching languages
  // (aka "what's the accept-language coming from a Chinese browser?")

  // Use the target bundle, or the fallback bundle if lang is unknown
  if (bundle) {
    const { value } = bundle.getMessage(message) ?? {}

    if (value) {
      return bundle.formatPattern(value, params)
    }
  }

  return localize(FALLBACK_LOCALE, message, params)
}



module.exports = {
  FALLBACK_LOCALE,
  localization,
  localize,
}