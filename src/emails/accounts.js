const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'corbin.potts@gmail.com',
        subject: 'Welcome to Task-App',
        text: `Welcome to the App, ${name}. Enjoy setting and reading your tasks.`
    })
}

const sendFarewellEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'corbin.potts@gmail.com',
        subject: `Take Care, ${name}`,
        text: 'We are sorry you did not want to continue using Task-app. If you have any feedback for us, please simply reply to this email.'
    })
}


module.exports = {
    sendWelcomeEmail,
    sendFarewellEmail
}

//test email
// sgMail.send({
//     to: 'corbin.potts@gmail.com',
//     from: 'corbin.potts@gmail.com',
//     subject: 'First API created email',
//     text: 'Hello Corbin, i cannot open the pod bay Doors'
//     html: '<strong>and easy to do anywhere, even with Node.js</strong>'
// })