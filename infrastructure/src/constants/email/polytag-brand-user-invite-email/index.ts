/* ---------- Interfaces ---------- */
interface PolytagBrandUserInviteEmailInput {
  email: string;
  base_url: string;
}

/* ---------- Function ---------- */
const polytag_brand_user_invite_email = ({
  email,
  base_url,
}: PolytagBrandUserInviteEmailInput) => {
  return `
  <!DOCTYPE html>
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <link rel="stylesheet" href="https://use.typekit.net/org5hyb.css" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      body {
        box-sizing: border-box;
        display: block;
        background-color: #E5E7EB;
        padding: 24px;
        margin: 0;
      }

      .content {
        width: 375px;
        box-sizing: border-box;
        display: block;
      }

      .logo {
        box-sizing: border-box;
        margin: 22px 0;
        padding: 0;
        font-family: 'futura-pt', 'Inter', Helvetica, Arial, sans-serif;
        font-style: normal;
        font-weight: 600;
        font-size: 35.2px;
        line-height: 35px;
        letter-spacing: -0.035em;
        color: #000;
      }

      .logo span {
        margin: 0;
        padding: 0;
        color: #8DC63F;
      }

      .card {
        display: block;
        box-sizing: border-box;
        padding: 40px 24px;
        margin: 0;
        background-color: #fff;
        box-shadow: 0px 10px 10px -5px rgba(0, 0, 0, 0.04), 0px 20px 25px -5px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        margin-bottom: 80px;
      }

      .card h1 {
        display: block;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Inter', Helvetica, Arial, sans-serif;
        font-weight: 500;
        font-size: 24px;
        line-height: 32px;
        color: #374151;
      }

      .card p {
        display: block;
        box-sizing: border-box;
        font-family: 'Inter', Helvetica, Arial, sans-serif;
        font-weight: 400;
        font-size: 12px;
        line-height: 16px;
        color: #191847;
        margin: 24px 0px;
        padding: 0;
      }

      .card span {
        box-sizing: border-box;
        font-family: 'Inter', Helvetica, Arial, sans-serif;
        font-weight: 400;
        font-size: 36px;
        line-height: 44px;
        text-align: center;
        letter-spacing: 0.15em;
        color: #191847;
        padding: 20px 36px;
        margin: 0;
        background: #F3F4F6;
        border: 1px solid #E5E7EB;
        border-radius: 5px;
      }

      .footer {
        display: block;
        margin: 0 24px;
        padding: 0;
      }

      .footer h1 {
        display: block;
        box-sizing: border-box;
        font-family: 'futura-pt', 'Inter', Helvetica, Arial, sans-serif;
        font-weight: 600;
        font-size: 30.4255px;
        line-height: 30px;
        letter-spacing: -0.035em;
        color: #767E9D;
        margin: 0px 0px 4px 0px;
        padding: 0;
      }

      .footer ul {
        display: block;
        box-sizing: border-box;
        width: 100%;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .footer ul li {
        display: block;
        box-sizing: border-box;
        border-bottom: 1px solid #DEE2E9;
        padding: 12px 0;
        margin: 0;
      }

      .footer ul li a {
        text-decoration: none;
        font-family: 'futura-pt';
        font-weight: 700;
        font-size: 12px;
        line-height: 16px;
        color: #767E9D;
        padding: 0;
        margin: 0;
      }

      .footer p {
        font-family: 'Inter';
        font-weight: 400;
        font-size: 12px;
        line-height: 16px;
        margin-top: 16px;
        margin-bottom: 4px;
        padding: 0;
        color: #767E9D;
      }

      .footer p a {
        color: #767E9D;
      }
    </style>
  </head>
  <body>
    <div class="content">
      <img src="https://polytag-${
        process.env.ENVIRONMENT
      }-main-bucket.s3.eu-west-1.amazonaws.com/common/polytag.png" alt="Polytag-logo" />

      <div class="card">
        <h1>Welcome!</h1>

        <p>You were invited to join Polytag by your colleague.</p>

        <div style="height: 24px;"></div>

        <a href="${base_url}/sign-up?email=${encodeURIComponent(
    email,
  )}">Click here to sign up</a>
      </div>

      <div class="footer">
        <h1 class="logo">Polytag</h1>

        <ul>
          <li><a href="https://www.polytag.co.uk/about-us/">About us</a></li>
          <li><a href="https://twitter.com/PolytagUk">Twitter</a></li>
          <li><a href="https://www.polytag.co.uk">Instagram</a></li>
          <li><a href="https://www.linkedin.com/company/polytag-limited/">LinkedIn</a></li>
        </ul>

        <p>If you have questions or need help, don't hesitate to contact our <a href="https://www.polytag.co.uk">support team!</a></p>

        <ul>
          <li><a href="https://polyt.ag/terms-of-service">Terms & conditions</a></li>
          <li><a href="https://www.polytag.co.uk/privacy-policy/">Privacy policy</a></li>
          <li><a href="https://www.polytag.co.uk/contact-us/">Contact us</a></li>
        </ul>

        <p>This message was sent to ${email}. If you did not request this code, please let our <a href="https://www.polytag.co.uk">support
            team</a> know.</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/* ---------- Export ---------- */
export { polytag_brand_user_invite_email };
