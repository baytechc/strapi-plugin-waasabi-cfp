email-cfp-confirmation-subject = [RustFest Global] Submission received
email-cfp-confirmation-body = Dear $NAME,
  
  This is an automated confirmation that your RustFest Global submission titled *"$TITLE"* has been successfully received!
  
  You will also find your full proposal attached to this email.
  
  Keep an eye on your mailbox, as the organizers of the upcoming RustFest Global editions will reach out via email if your proposal is selected. If you would like to review or change your submitted proposal you can [log in on the CFP page](https://rustfest.global/cfp/) using this email address to do so.
  
  Should you have any questions regarding the RustFest CFP, don't hesitate to reach out to the team on the email address dedicated to the participants of the CFP: [coaching@rustfest.global](mailto:coaching@rustfest.global).
  
  Wishing the very best for the selection,
  
  _The RustFest Global Organizers_
  
  www.rustfest.global

email-session-accepted-subject = [RustFest Global] Proposal accepted: $TITLE
email-session-accepted-body = Dear $NAME,
  
  We are excited to let you know that your RustFest Global submission titled *"$TITLE"* has been accepted and would be included in the lineup of *$EVENT_TITLE*! The event will take place on
  {DATETIME($event_date, month: "long", year: "numeric", day: "numeric")},
  starting at {DATETIME($event_date, hour: "numeric", minute: "numeric", timeZoneName: "short")}.
  In case for any reason you are not going to be able to present please let us know ASAP. We have already transferred the session details submitted by you to the conference management interface at:
  
  > [cms.rustfest.global](https://cms.rustfest.global)
  >
  > - CMS username: `$USERNAME`
  > - CMS password: `$PASSWORD`

  You can use these account details to access the CMS. After logging in you can double-check & change the details of your session, upload a speaker photo, contact details and more. Please don't forget to change the password after your first login.
    
  As our guest you will also be receiving a full-access pass, valid for all events of the current season, in a separate message. If you have already purchased a ticket we can refund you, just let the team know in email (please include the ticket number of your purchase in your message).
  
  If your session will be presented in a language other than English, please make sure your pre-recorded presentation arrives to the team in-time to [produce subtitles](https://rustfest.global/cfp/#supported-languages) for the live airing of the talk. This typically means you should send your final recording at least 10 days ahead of the event. We have a [Speaker Guide on the website](https://rustfest.global/information/speaker-guide/) that can help you with any technical questions. If you would like to purchase gear (michrophone, web camera, headphones etc.) to improve the quality of your session you can have your purchase reimbursed, [as part of our presenter perks](https://rustfest.global/cfp/#the-perks) (Note: certain limitations apply, when in doubt talk to a team member before making a purchase).
  
  With any questions or inquiries you can contact the team at the email address [speakers@rustfest.global](mailto:speakers@rustfest.global) or by replying to this message.
  
  Thank you again for your submission and looking forward to welcoming you at $EVENT_TITLE!
  
  _$ACCEPTING_NAME & the RustFest Global Organizers_
  
  www.rustfest.global

email-session-confirmed-subject = [RustFest Global] Session confirmation: $TITLE
email-session-confirmed-body = Dear $NAME,
  
  We are excited and looking forward to having you perform at RustFest Global! Your session will be presented in the *$EVENT_TITLE* lineup. The event will take place on {
    DATETIME($event_date, month: "long", year: "numeric", day: "numeric")
  }, starting at {
    DATETIME($event_date, hour: "numeric", minute: "numeric", timeZoneName: "short")
  }.

  If for any reason you are not going to be able to participate please let us know ASAP! We have already created the session details for you in our conference management system:
  
  > [cms.rustfest.global](https://cms.rustfest.global)
  >
  > - CMS username: `$USERNAME`
  > - CMS password: `$PASSWORD`

  You can use these account details to access the CMS. After logging in you can double-check & change the details of your session, upload a profile photo, add contact details and more. Please don't forget to change the password after your first login.
  
  As our guest you will also be receiving a full-access pass, valid for all events of the current season, in a separate message. If you have already purchased a ticket we can refund you, just let the team know in email (please include the ticket number of your purchase in your message).
  
  If your session will [require translation/subtitles](https://rustfest.global/cfp/#supported-languages) please ensure you get in touch with the team and submit a recording with sufficient lead time. This typically means you should send us the final recording at least 10 days ahead of the event. We have a [Speaker Guide on the website](https://rustfest.global/information/speaker-guide/) that can help you with any technical questions. If you would like to purchase gear (michrophone, web camera, headphones etc.) to improve the quality of your session you can have your purchase reimbursed, [as part of our presenter perks](https://rustfest.global/cfp/#the-perks) (Note: certain limitations apply, when in doubt talk to a team member before making a purchase).
  
  Speaker stipends, reimbursements and performance fees will need to be submitted on our [Open Collective page](https://opencollective.com/rustfest-global-2021/expenses/new) in the form of expenses after the event and will be paid within 1-3 weeks of submission.
  
  With any questions or inquiries you can contact the team at the email address [speakers@rustfest.global](mailto:speakers@rustfest.global) or by replying to this message.
  
  Thank you again for helping us making RustFest amazing, we are looking forward to welcoming you at $EVENT_TITLE!
  
  _$ACCEPTING_NAME & the RustFest Global Organizers_
  
  www.rustfest.global
