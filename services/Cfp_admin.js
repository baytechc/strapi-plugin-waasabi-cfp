const { localize } = require('../locales/locales.js')

const SPEAKER_EMAIL = 'speakers@rustfest.global'
const TESTING = process.env.TEST_MAILING


module.exports = {

  async selectProposal(data) {
    //'interested/shortlisted/accepted'
    const { selectAction, submission: submission_id, user, team } = data

    // Get Submission details
    const submission = await strapi.query('submission','cfp').findOne({ id: submission_id })

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

    // Create Strapi account for the submitter
    const speakerRole = await strapi.admin.services.role.findOne({
      code: strapi.admin.services.constants.AUTHOR_CODE
    })

    // Password is generated
    // Skips l/O (easy to confuse with 1/0)
    const passwordAlpha = '0123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    const { customAlphabet } = require('nanoid')
    const nanoid = customAlphabet(passwordAlpha, 16)

    const password = nanoid()

    let { name, email, tagline, bio, title, summary:short, description:long } = submission;
  
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
        roles: [ speakerRole.id ]
      });
    // no new user, use old one
    } catch(e) {
      newUser = await strapi.admin.services.user.findOne({email})
      // TODO: now we have the wrong password though
    }

    // Creates contributor/session entries in the database
    // We will set the correct owner on these entries in a follow-up query

    // TODO: renaming of 'people' to 'contributors'
    const M_CONTRIBUTORS = 'people';
    const M_SESSION = 'session';

    const { id: contributor_id } = await strapi.query(M_CONTRIBUTORS).create({ 
      name,
      email,
      tagline,
      bio
    })
    const { id: session_id } = await strapi.query(M_SESSION).create({
      Title: title,
      Pitch: short,
      Abstract: long,
    })

    // Db connection
    const knex = strapi.connections.default

    // Subquery that queries the id from a user in the Strapi admin table based on their email
    // Note: this is unused because it will just return newUser.id anyway!
    // subq = knex(strapi.admin.models.user.collectionName).where('email', newUser.email)

    // Change the owner of the contributor/session record we just added to be the new admin user
    const r = await knex(strapi.models[M_CONTRIBUTORS].collectionName).update({
      created_by: newUser.id,
      updated_by: newUser.id,
    }).where('id', contributor_id)

    const rr = await knex(strapi.models[M_SESSION].collectionName).update({
      created_by: newUser.id,
      updated_by: newUser.id,
    }).where('id', session_id)

    // TODO: create access pass valid for all events by creating a ticket
    // for the root event (toplevel event with no parents)
    // const { user: tktuser, ticket, attendee } = createTicket({
    //   event: rootEvent(event),
    //   name,
    //   password,
    //   email
    // })


    // Send confirmation
    this.sendAcceptanceNotification({
      email,
      name,
      title,
      event_title: event.title,
      event_date: new Date(event.start),
      username: email,
      password,
      accepting_name: acceptMeta.details.accepting_name,
    }, submission.language)
  },

  async sendAcceptanceNotification(data, language) {
    await strapi.plugins['md-email'].services.email.send(
      // Subject
      localize(language, 'email-session-accepted-subject'),

      // Body template
      localize(language, 'email-session-accepted-body', data),

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

}