"""Optional email sender. Gracefully no-ops if SMTP is not configured."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..config import settings

logger = logging.getLogger("truckshield.email")


def _is_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an HTML email. Returns True on success, False if not configured or on error."""
    if not _is_configured():
        logger.info("Email not configured — skipping send to %s: %s", to, subject)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.warning("Email send failed to %s: %s", to, e)
        return False


def send_welcome_email(to: str, name: str) -> bool:
    subject = "Welcome to TruckShield 🚛"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">Welcome to TruckShield, {name or 'Fleet Operator'}!</h2>
      <p>Your account has been created successfully.</p>
      <p>TruckShield helps you run pre-dispatch compliance checks and risk analysis for every trip — 
      so your fleet stays compliant and your drivers stay protected.</p>
      <p>
        <a href="https://truckshield.vercel.app/dashboard" 
           style="display:inline-block;background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          Open Dashboard →
        </a>
      </p>
      <p style="color:#64748b;font-size:12px">TruckShield provides informational pre-checks only — not legal advice.</p>
    </div>
    """
    return send_email(to, subject, html)


def send_payment_confirmation_email(to: str, plan_name: str, period_end: str) -> bool:
    subject = f"TruckShield — {plan_name} plan activated ✅"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">Payment Confirmed</h2>
      <p>Your <strong>{plan_name}</strong> plan is now active.</p>
      <p>Plan renews: <strong>{period_end}</strong></p>
      <p>
        <a href="https://truckshield.vercel.app/dashboard" 
           style="display:inline-block;background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          Go to Dashboard →
        </a>
      </p>
      <p style="color:#64748b;font-size:12px">
        To cancel your plan, visit Settings in your TruckShield dashboard.
      </p>
    </div>
    """
    return send_email(to, subject, html)


def send_password_reset_email(to: str, reset_token: str) -> bool:
    subject = "TruckShield — Reset your password"
    reset_link = f"https://truckshield.vercel.app/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">Reset your password</h2>
      <p>Click the link below to reset your TruckShield password. This link expires in 1 hour.</p>
      <p>
        <a href="{reset_link}" 
           style="display:inline-block;background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          Reset Password →
        </a>
      </p>
      <p style="color:#64748b;font-size:12px">If you didn't request this, ignore this email — your account is safe.</p>
      <p style="color:#94a3b8;font-size:11px;word-break:break-all">Or copy this link: {reset_link}</p>
    </div>
    """
    return send_email(to, subject, html)
