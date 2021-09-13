'use strict';

const accepts = require('accept-language-parser');

/**
 * Public CFP endpoints
 *
 * @description: Endpoints for CFP submission and similar.
 */

module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */

   async submit(ctx) {
    const { email, code } = ctx.request.body;

    // Check email verification code
    const verification = await strapi.plugins['email-verification'].services.verification.verify(email, code);
    if (verification !== 'valid') {
      return ctx.throw(403);
    }

    // Verify required fields
    const submission = ctx.request.body;
    if (typeof submission !== 'object') return ctx.throw(403);

    const { required } = await strapi.plugins['cfp'].services.cfp.fields();
    for (const f of required) {
      if (!f in submission) return ctx.throw(403);
    }

    await strapi.query('submission', 'cfp').create(submission);
    
    await strapi.plugins['cfp'].services.cfp.sendConfirmation(submission, requestLanguage(ctx));
    ctx.send(200);
  },

  async configuration(ctx) {
    const props = [
      'events', 'links', 'presentation_formats', 'audience_targets'
    ];

    const results = await Promise.all([
      // events
      await strapi.query('cfp_event','cfp').find(),
      // links
      await strapi.query('cfp_link','cfp').find(),
      // presentation_formats
      await strapi.query('cfp_format','cfp').find(),
      // audience_targets
      await strapi.query('cfp_audience','cfp').find(),
    ]);

    const config = Object.fromEntries(
      props.map((k,i) => [k, sanitize(results[i])])
    );

    config.approot = ".";
    config.mountroot = "#app";
    config.locales = "en, es".split(/\W+/);
    config.default_locale = "en";

    const { fieldConfig } = await strapi.plugins['cfp'].services.cfp.fields();
    config.fields = fieldConfig;
    
    ctx.send(config);
  }
}

function sanitize(record) {
  if (Array.isArray(record)) return record.map(r => sanitize(r));
  delete record.created_by; delete record.updated_by;
  return record;
}

// Extract the current locale from the request headers
function requestLanguage(ctx) {
  const acceptLang = require('accept-language-parser').parse(ctx.request.headers['accept-language']);
  return acceptLang[0]?.code;
}
