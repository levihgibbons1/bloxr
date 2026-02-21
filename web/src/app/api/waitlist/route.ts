import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { email } = await req.json() as { email?: string };

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleaned = email.toLowerCase().trim();

    // Add to Resend Audience
    await resend.contacts.create({
      email: cleaned,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      unsubscribed: false,
    });

    // Send confirmation email to the user
    await resend.emails.send({
      from: "Bloxr <onboarding@resend.dev>",
      to: cleaned,
      subject: "You're on the Bloxr waitlist 🎮",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body style="background:#000;margin:0;padding:0;font-family:'Inter',ui-sans-serif,system-ui,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:48px 24px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                    <!-- Logo -->
                    <tr>
                      <td style="padding-bottom:40px;">
                        <span style="color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Bloxr</span><span style="color:#4F8EF7;font-size:24px;font-weight:700;">.dev</span>
                      </td>
                    </tr>

                    <!-- Main card -->
                    <tr>
                      <td style="background:#0a0a0f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">

                        <!-- Check icon -->
                        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                          <tr>
                            <td style="background:rgba(16,185,129,0.1);border-radius:50%;width:52px;height:52px;text-align:center;vertical-align:middle;">
                              <span style="color:#10B981;font-size:24px;line-height:52px;">✓</span>
                            </td>
                          </tr>
                        </table>

                        <h1 style="color:#fff;font-size:26px;font-weight:600;margin:0 0 12px;letter-spacing:-0.5px;">You're on the list.</h1>
                        <p style="color:rgba(255,255,255,0.45);font-size:16px;line-height:1.6;margin:0 0 32px;">
                          Thanks for joining the Bloxr waitlist. We're building something that will completely change how Roblox games get made — and you'll be one of the first to use it.
                        </p>

                        <p style="color:rgba(255,255,255,0.45);font-size:15px;line-height:1.6;margin:0 0 32px;">
                          We'll reach out as soon as your spot is ready. No spam, just the one email that matters.
                        </p>

                        <!-- Divider -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                          <tr>
                            <td style="border-top:1px solid rgba(255,255,255,0.06);height:1px;"></td>
                          </tr>
                        </table>

                        <!-- What to expect -->
                        <p style="color:rgba(255,255,255,0.25);font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">What to expect</p>
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding-bottom:10px;">
                              <span style="color:#4F8EF7;font-size:14px;margin-right:10px;">→</span>
                              <span style="color:rgba(255,255,255,0.4);font-size:14px;">Describe what you want to build in plain English</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:10px;">
                              <span style="color:#4F8EF7;font-size:14px;margin-right:10px;">→</span>
                              <span style="color:rgba(255,255,255,0.4);font-size:14px;">Watch Bloxr write the code and place it in Studio</span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span style="color:#4F8EF7;font-size:14px;margin-right:10px;">→</span>
                              <span style="color:rgba(255,255,255,0.4);font-size:14px;">No Lua, no coding knowledge required</span>
                            </td>
                          </tr>
                        </table>

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding-top:32px;text-align:center;">
                        <p style="color:rgba(255,255,255,0.15);font-size:12px;margin:0;">
                          You're receiving this because you signed up at bloxr.dev.<br/>
                          <a href="https://bloxr.dev" style="color:rgba(255,255,255,0.25);text-decoration:none;">bloxr.dev</a>
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
