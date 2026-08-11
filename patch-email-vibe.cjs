const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetRegex = /const htmlContent = `[\s\S]*?`;/;

const replacement = `const htmlContent = \`
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 40px 30px; text-align: center;">
              <table align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #3b82f6; width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle; color: #ffffff; font-size: 24px; font-weight: bold; font-style: italic;">
                    N
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; font-size: 28px; margin: 20px 0 10px 0; font-weight: 800; letter-spacing: -0.5px;">Demo Requested</h1>
              <p style="color: #94a3b8; font-size: 16px; margin: 0; font-weight: 400;">A new prospect is interested in Nexus ERP.</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 20px 0; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">Prospect Details</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9; width: 120px;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Full Name</span>
                  </td>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #0f172a; font-size: 16px; font-weight: 600;">\${name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Email Address</span>
                  </td>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <a href="mailto:\${email}" style="color: #3b82f6; font-size: 16px; font-weight: 500; text-decoration: none;">\${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Phone Number</span>
                  </td>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <a href="tel:\${phone}" style="color: #0f172a; font-size: 16px; font-weight: 500; text-decoration: none;">\${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; vertical-align: top;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Organization</span>
                  </td>
                  <td style="padding: 15px 0;">
                    <span style="color: #0f172a; font-size: 15px; font-weight: 400; line-height: 1.5;">\${address}</span>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 35px;">
                <tr>
                  <td align="center">
                    <a href="mailto:\${email}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);">Reply to Prospect</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Nexus ERP System &bull; Automated Notification</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`;`;

code = code.replace(targetRegex, replacement);
fs.writeFileSync('server.ts', code);
console.log("Patched email to use premium HTML template");
