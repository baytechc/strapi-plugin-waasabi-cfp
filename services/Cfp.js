'use strict';

const { env } = require('strapi-utils');

const FROM_ADDRESS = env(
  'CFP_CONFIRMATION_SENDER',
  strapi.config.plugins.email.settings.from
);

// Prepare localization
const fs = require('fs');
const { join, basename } = require('path');
const { FluentBundle, FluentResource } = require('@fluent/bundle');

const LOCALE_DIR = join(__dirname, '../locales');
const FALLBACK_LOCALE = 'en';
const localization = {};

for (const f of fs.readdirSync(LOCALE_DIR)) {
  const lang = basename(f,'.ftl');
  const locale = fs.readFileSync(join(LOCALE_DIR, f)).toString();

  const res = new FluentResource(locale);
  const bundle = new FluentBundle(lang);
  bundle.addResource(res);

  localization[lang] = bundle;
}

/**
 * cfp.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

module.exports = {
  // Plugin collections that store configuration data
  settings() {
    return strapi.query('cfp_settings','cfp')
  },
  collections: {
    events() {
      return strapi.query('cfp_event','cfp')
    },
    links() {
      return strapi.query('cfp_link','cfp')
    },
    presentation_formats() {
      return strapi.query('cfp_format','cfp')
    },
    audience_targets() {
      return strapi.query('cfp_audience','cfp')
    },
  },

  async getConfig() {
    let config = await this.settings().findOne()
    if (!config) throw strapi.errors.badRequest('NotConfigured');

    config = sanitize(config);
    delete config.id;

    // Configure the backend URL
    config.backend = strapi.config.server.url;

    config.locales = config.locales.split(/[\s,]+/);
    config.default_locale = config.default_locale || config.locales[0];

    // Collections
    Object.assign(config, await Promise.all([
      // events
      await this.collections.events().find(),
      // links
      await this.collections.links().find(),
      // presentation_formats
      await this.collections.presentation_formats().find(),
      // audience_targets
      await this.collections.audience_targets().find(),
    ]).then(
      // Create a new object keyed by the collection names, with the sanitized data for value
      data => Object.fromEntries(
        Object.keys(this.collections).map( (coll,i) => [ coll, sanitize(data[i])])
      )
    ));

    // Form field configuration and required fields
    const { fieldConfig } = await this.fields();
    config.fields = fieldConfig;

    return config
  },

  async setConfig(config) {
    // Update collections
    await Promise.all(Object.keys(this.collections).map(async (coll) => {
      // Empty the collection and replace contents with the posted one
      const collection = this.collections[coll]();
      await collection.delete({});
      await collection.createMany(config[coll]);
    }));

    // Update configuration properties (handles future entries as well)
    const configProps = Object.entries(this.settings().model.attributes).filter(([k,v]) => !v.private).map(([k]) => k);
    const configData = Object.fromEntries(configProps.map(
      (prop) => [ prop, config[prop] ]
    ));

    // Locale configuration
    const { locales } = config;
    configData.locales = locales.join(',')
    configData.default_locale = config.default_locale || config.locales[0];

    await this.settings().update({id:1}, configData)

    // TODO: fields are currently hard-coded
  },

  async fields() {
    const raw = `
      *language
      presentation_lang
      *presentation_format
      *title
      *summary
      *description
      *audience_target
      event_target
      notes
      *name
      tagline
      *bio
      *email
    `;
    
    const fieldConfig = raw.replace(/\s+/g,'\n').trim().split('\n');
  
    const fields = fieldConfig.map(f => f.replace('*',''));
    const required = fieldConfig.filter(r => r.includes('*')).map(r => r.slice(1));
  
    return { raw, fieldConfig, fields, required };
  },

  async import(cfpData) {
    await strapi.query('submission','cfp').createMany(cfpData);
  },

  async sendConfirmation(submission, language = FALLBACK_LOCALE) {
    const { email, name, title, ptx } = submission;

    await strapi.plugins['md-email'].services.email.send(
      // Subject
      this.l10n(language, 'email-cfp-confirmation-subject'),

      // Body template
      this.l10n(language, 'email-cfp-confirmation-body'),

      // Recipient and other options
      {
        to: email,
        from: FROM_ADDRESS,
        replyTo: 'coaching@rustfest.global',

        // Attach the portatext (TOML) formatted proposal export to the email
        attachments: [{
          filename: 'submission.toml',
          content: ptx
        }]
      },

      // Variables for the template
      { name, title }
    );
  },

  l10n(lang, message, params) {
    const bundle = localization[lang];
    if (!bundle) return '';

    const { value } = bundle.getMessage(message) ?? {};
    if (!value) return this.l10n(FALLBACK_LOCALE, message, params);

    return bundle.formatPattern(value, params);
  },
};

function sanitize(record) {
  if (Array.isArray(record)) return record.map(r => sanitize(r));
  delete record.created_by; delete record.updated_by;
  return record;
}
