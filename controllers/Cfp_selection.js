const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  async next(ctx) {
    const metadata = strapi.query('metadata','cfp');
    const submission = strapi.query('submission', 'cfp');

    const { user } = ctx.state;
    // TODO: authenticated (provider:local) and admin user IDs overlap!
    if (user.provider != 'local') return ctx.send(406);

    // Get all rated submissions for the user
    const rated = await metadata.find({ type: 'rating', user: user.id });
    const ratedIds = rated.map(meta => meta.submission.id);

    // Get all not-yet-rated-by-me submissions
    const unra = await submission.find({ id_nin: ratedIds });

    // Select one randomly as "next"
    const selected = Math.floor(Math.random()*unra.length);
    const selectedSubmission = sanitizeEntity(unra[selected], { model: strapi.plugins.cfp.models.submission });

    //strapi.query('submission','cfp').find({ _or: [ { metadata_null: true }, { 'metadata.type_ne': 'rating', 'metadata.user_ne': 1} ] }).then(r => console.log(r.length))
    ctx.send({
      rated: ratedIds.length,
      unrated: unra.length,
      submission: selectedSubmission
    });
  },

  async available(ctx) {
    // Get all submissions
    const submission = strapi.query('submission', 'cfp');
    const all = await submission.find({})
    
    // Keep only the submission id/title and
    // use the metadata to filter out already-accepted proposals
    const filtered = all.map(
      ({ id, title, metadata }) => ({ id, title, metadata})
    ).filter(
      e => e.metadata.length === 0
        || !e.metadata.find(m => m.type === 'selection' && m.data === 'accept')
    )

    // Remove metadata before returning the results
    ctx.send(filtered.map(({ id,title }) => ({ id, title })))
  },
  async rate(ctx) {
    const metadata = strapi.query('metadata','cfp');

    const { user } = ctx.state;
    const { body } = ctx.request;

    // TODO: authenticated (provider:local) and admin user IDs overlap!
    if (user.provider != 'local') return ctx.send(406);

    // TODO: check the submission id if it's valid and wasn't tampered with
    const subid = parseInt(body.submission, 10);
    const details = {};

    // TODO: make rating levels customizable
    details.rating = Math.max(1, Math.min(4, parseInt(body.rating, 10)));
    if (body.comment) details.comment = body.comment;

    await metadata.create({
      type: 'rating',
      user: user.id,
      submission: subid,
      data: details.rating,
      details
    });

    ctx.send(200);
  },

  async accept(ctx) {
    const { user } = ctx.state;
    const { body } = ctx.request;

    await strapi.plugins.cfp.services.cfp_admin.selectProposal({
      selectAction: 'accept',
      submission: body.submission,
      team: body.team,
      user,
    })

    ctx.send(200);
  },

  async invite(ctx) {
    const { user } = ctx.state;
    const { body } = ctx.request;

    await strapi.plugins.cfp.services.cfp_admin.confirmSession({
      selectAction: 'invite',
      session: body.session,
      team: body.team,
      user,
    })

    ctx.send(200);
  },

}
