const { localize } = require('../locales/locales.js')

const SPEAKER_EMAIL = 'speakers@rustfest.global'
const TESTING = process.env.TEST_MAILING

// Model names from the Strapi content API
// TODO: renaming of 'people' to 'contributors'
const M_CONTRIBUTORS = 'people';
const M_SESSION = 'session';


module.exports = {

  async selectProposal(data) {
    //'interested/shortlisted/accepted'
    const { selectAction, submission: submissionId, user, team } = data

    // Get Submission details
    const submission = await strapi.query('submission','cfp').findOne({ id: submissionId })

    // TODO: make sure submission is not already "accepted"
    // submission.metadata.filter...

    // TODO: dupes and translations also affect the status (can't accept a talk that's
    // a translated version of another already-accepted talk)

    // TODO: move to own service?
    //async metaAccept() {
      // todo: superadmin could spoof user/event

      const roleCheck = await strapi.query('cfp_role', 'cfp').findOne({
        email: user.email,
        role: 'admin',
        team,
      })
      if (!roleCheck) throw(new Error('boo'))

      // Note down the CFP metadata about which team selected the proposal
      const acceptMeta = await strapi.query('metadata','cfp').create({
        type: 'selection',
        data: selectAction,
        submission,
        user: user.id,
        details: {
          team,
          accepting_name: roleCheck.name,
        }
      });
    //}

    // Event details
    const event = await strapi.query('event').findOne({label: team})

    // Creates a news Strapi admin account with "author" privileges
    const newUser = await this.strapiCreateAdminUser(submission, await this.getSpeakerRole())

    // Creates contributor/session entries in the database, then sets
    // the correct owner on these records in a manual query
    await this.strapiCreateContribSession(submission, newUser.id)


    // TODO: create access pass valid for all events by creating a ticket
    // for the root event (toplevel event with no parents)
    // const { user: tktuser, ticket, attendee } = createTicket({
    //   event: rootEvent(event),
    //   name,
    //   password,
    //   email
    // })


    // Send confirmation
    let { name, email, title } = submission

    this.sendEmailNotification({
      selectAction,
      email,
      name,
      title,
      event_title: event.title,
      event_date: new Date(event.start),
      username: email,
      password: newUser.plaintextPassword,
      accepting_name: acceptMeta.details.accepting_name,
    }, submission.language)
  },

  // Certain sessions (and esp. artists) are not invited through the CFP,
  // so they don't have a pre-existing proposal record but their invite
  // is very similar in all other regards to CFP ones
  async confirmSession(data) {
    // Submission details are provided by the creator of the invitation,
    // no CFP data exist for these confirmations
    const { selectAction, session: submission, user, team } = data

    // TODO: make sure submission is not already "accepted"
    // submission.metadata.filter...

    // TODO: dupes and translations also affect the status (can't accept a talk that's
    // a translated version of another already-accepted talk)

    // TODO: move to own service?
    //async metaAccept() {
      // todo: superadmin could spoof user/event

      const roleCheck = await strapi.query('cfp_role', 'cfp').findOne({
        email: user.email,
        role: 'admin',
        team,
      })
      if (!roleCheck) throw(new Error('boo'))

      // Note down the CFP metadata about which team selected the proposal
      const acceptMeta = await strapi.query('metadata','cfp').create({
        type: 'selection',
        data: selectAction,
        user: user.id,
        details: {
          team,
          accepting_name: roleCheck.name,

          // we include the provided session information
          session: data.session,
        }
      });
    //}

    // Creates a news Strapi admin account with "author" privileges
    const newUser = await this.strapiCreateAdminUser(submission, await this.getSpeakerRole())

    // Creates contributor/session entries in the database, then sets
    // the correct owner on these records in a manual query
    await this.strapiCreateContribSession(submission, newUser.id)


    // TODO: create access pass valid for all events

    // Event details
    const event = await strapi.query('event').findOne({label: team})

    // Send confirmation
    let { name, email, title } = submission

    this.sendEmailNotification({
      selectAction,
      email,
      name,
      title,
      event_title: event.title,
      event_date: new Date(event.start),
      username: email,
      password: newUser.plaintextPassword,
      accepting_name: acceptMeta.details.accepting_name,
    }, submission.language)
  },

  async sendEmailNotification(data, language) {
    // Choose the correct notification template
    let type
    if (data.selectAction === 'invite') {
      // Invited guests and artists with no CFP submission
      // (the invitation is extended in a previous email, this one just
      // confirms a positive answer and creates the sessions)
      type = 'session-confirmed'
    } else {
      type = 'session-accepted'
    }

    await strapi.plugins['md-email'].services.email.send(
      // Subject
      localize(language, `email-${type}-subject`),

      // Body template
      // Lowercase data props can be used in the Fluent level
      localize(language, `email-${type}-body`, data),

      // Recipient and other options
      {
        to: TESTING ? TESTING : data.email,
        bcc: TESTING ? undefined : SPEAKER_EMAIL,
        from: SPEAKER_EMAIL,
        replyTo: SPEAKER_EMAIL,
      },

      // Variables for the template
      data
    );
  },

  // We use the "Author" role for speakers and artists as it lets
  // them edit their own information without giving access to the rest of the
  // conference data
  async getSpeakerRole() {
    return await strapi.admin.services.role.findOne({
      code: strapi.admin.services.constants.AUTHOR_CODE
    })
  },

  // Creates a new strapi Admin user with access to the CMS, with
  // privileges defined by the specified "role"
  async strapiCreateAdminUser(data, role) {
    const { name, email } = data

    // Password is generated
    // Skips l/O (easy to confuse with 1/0)
    const passwordAlpha = '0123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    const { customAlphabet } = require('nanoid')
    const nanoid = customAlphabet(passwordAlpha, 16)

    const password = nanoid()

    // For some reason Strapi really wants a firstname/lastname here
    let firstname = ''
    let lastname = ''
    if (name) {
      const [ first, ...last ] = name.split(' ');
      firstname = first ?? '';
      lastname = last.join(' ');
    }

    // Create a new activated Strapi admin account with a random password
    // With AUTHOR permissions, which allows the account to see and edit
    // only its own items in the DB

    // TODO: duplicates (existing email errors)

    let newUser
    try {
      newUser = await strapi.admin.services.user.create({
        firstname, lastname, password, email,
        isActive: true, blocked: false,
        roles: [ role.id ]
      });
    // no new user, use old one
    } catch(e) {
      newUser = await strapi.admin.services.user.findOne({email})
      // TODO: now we have the wrong password though
    }

    // Store the generated plaintext password so the caller can use it
    newUser.plaintextPassword = password

    return newUser
  },

  async strapiCreateContribSession(data, userId) {
    // Creates contributor/session entries in the database
    // We will set the correct owner on these entries in a follow-up query
    let { name, email, tagline, bio, title } = data
    let short = data.short ?? data.summary ?? data.Pitch
    let long = data.long ?? data.description ?? data.Abstract

    const { id: contributorId } = await strapi.query(M_CONTRIBUTORS).create({
      name,
      email,
      tagline,
      bio
    })

    const { id: sessionId } = await strapi.query(M_SESSION).create({
      Title: title,
      Pitch: short,
      Abstract: long,
    })

    // Db connection
    const knex = strapi.connections.default

    // Subquery that queries the id from a user in the Strapi admin table based on their email
    // Note: this is unused because it will just return userId anyway!
    // subq = knex(strapi.admin.models.user.collectionName).where('email', newUser.email)

    // Change the owner of the contributor/session record we just added to be the new admin user
    await knex(strapi.models[M_CONTRIBUTORS].collectionName).update({
      created_by: userId,
      updated_by: userId,
    }).where('id', contributorId)

    await knex(strapi.models[M_SESSION].collectionName).update({
      created_by: userId,
      updated_by: userId,
    }).where('id', sessionId)

  }
}