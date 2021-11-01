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

  // Get CFP configuration
  async configuration(ctx) {
    const config = await strapi.plugins['cfp'].services.cfp.getConfig()
    
    ctx.send(config);
  },

  // Import existing CFP configuration from file
  async importconfig(ctx) {
    const configData = ctx.request.body;
    if (typeof configData != 'object') return ctx.throw(403);

    await strapi.plugins['cfp'].services.cfp.setConfig(configData);
    ctx.send(200);
  },

  async import(ctx) {
    const importData = ctx.request.body;
    if (typeof importData != 'object') return ctx.throw(403);

    await strapi.plugins['cfp'].services.cfp.import(importData);
    ctx.send(200);
  },

  async list(ctx) {
    const cfps = await strapi.query('submission', 'cfp').find();
    ctx.send(cfps);
  },
}

// Extract the current locale from the request headers
function requestLanguage(ctx) {
  const acceptLang = require('accept-language-parser').parse(ctx.request.headers['accept-language']);
  return acceptLang[0]?.code;
}
