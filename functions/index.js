const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const nodemailer = require('nodemailer');

// Define secrets
const emailUser = defineSecret('EMAIL_USER');
const emailPass = defineSecret('EMAIL_PASS');
const recipientEmail = defineSecret('RECIPIENT_EMAIL');

exports.sendEmail = onRequest({ secrets: [emailUser, emailPass, recipientEmail], cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).send({ error: 'All fields are required.' });
  }

  const gmailEmail = emailUser.value();
  const gmailPassword = emailPass.value();
  const targetEmail = recipientEmail.value();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: gmailPassword,
    },
  });

  const mailOptions = {
    from: `${name} <${email}>`,
    to: targetEmail,
    subject: `[Website Inquiry] New Message from ${name}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    return res.status(200).send({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('CRITICAL: Error sending email:', error.message);
    console.error('Full Error Stack:', error.stack);
    return res.status(500).send({ error: `Failed to send message: ${error.message}` });
  }
});

exports.fetchBlogPostsProxy = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const blogFeedUrl = 'https://blog.panthertechnologysolutions.com/feeds/posts/default?alt=json';

  try {
    const response = await fetch(blogFeedUrl);
    if (!response.ok) {
        throw new Error(`Blogger API responded with ${response.status}`);
    }
    const data = await response.json();
    
    // The cors: true in onRequest handles the Access-Control-Allow-Origin header automatically
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching blog posts via proxy:', error);
    return res.status(500).send({ error: `Failed to fetch blog posts: ${error.message}` });
  }
});
