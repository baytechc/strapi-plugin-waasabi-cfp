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
