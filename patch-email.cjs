const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@schoolerpsystem.com',
        to: adminEmail,
        subject: \`New Demo Request from \${name}\`,
        text: \`New Demo Request Details:\\n\\nName: \${name}\\nEmail: \${email}\\nPhone: \${phone}\\nAddress: \${address}\`
      };`;

const replacement = `      const htmlContent = \`
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="background-color: #2563eb; color: white; width: 48px; height: 48px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; font-style: italic; margin-bottom: 10px;">N</div>
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">New Demo Request</h1>
            <p style="color: #64748b; margin-top: 5px;">A new prospect has requested a demo of Nexus ERP.</p>
          </div>
          
          <div style="background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Prospect Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 120px; font-weight: 600;">Name</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">\${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Email</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #2563eb;"><a href="mailto:\${email}" style="color: #2563eb; text-decoration: none;">\${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Phone</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;"><a href="tel:\${phone}" style="color: #0f172a; text-decoration: none;">\${phone}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #64748b; font-weight: 600; vertical-align: top;">Address</td>
                <td style="padding: 12px 0; color: #0f172a;">\${address}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>This is an automated message from your Nexus ERP System.</p>
          </div>
        </div>
      \`;

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@schoolerpsystem.com',
        to: adminEmail,
        subject: \`New Demo Request: \${name}\`,
        text: \`New Demo Request Details:\\n\\nName: \${name}\\nEmail: \${email}\\nPhone: \${phone}\\nAddress: \${address}\`,
        html: htmlContent
      };`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
console.log("Patched email to use HTML template");
