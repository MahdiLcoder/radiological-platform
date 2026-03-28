import logging
import os

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_welcome_email(user, temp_password):
    """
    Sends a welcome email to the user with their temporary password using Django's
    email backend (configured for Resend via Anymail).
    """
    from_email = os.getenv("RESEND_FROM_EMAIL") or settings.DEFAULT_FROM_EMAIL
    to_list = [user.email] if isinstance(user.email, str) else list(user.email)

    html_body = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #007bff;">Welcome, {user.username}!</h2>
            <p>Your account has been created by an admin for the Radiological Platform.</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Temporary Password:</strong> <code style="background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px;">{temp_password}</code></p>
            <p>Please log in and change your password as soon as possible for security reasons.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8em; color: #777;">This is an automated message. Please do not reply to this email.</p>
        </div>
    """

    try:
        logger.info("Sending welcome email to %s", user.email)
        send_mail(
            subject="Welcome! Your account has been created",
            message="Your account has been created. Please check the HTML version of this email.",
            from_email=from_email,
            recipient_list=to_list,
            html_message=html_body,
            fail_silently=False,
        )
        logger.info("Welcome email queued for %s", user.email)
        return True
    except Exception:
        logger.exception("Failed to send welcome email to %s", user.email)
        return False


def send_password_reset_email(user, new_password):
    """
    Sends a password-reset email containing the newly generated password.
    Uses the same Resend/Anymail backend as send_welcome_email.
    """
    from_email = os.getenv("RESEND_FROM_EMAIL") or settings.DEFAULT_FROM_EMAIL
    to_list = [user.email] if isinstance(user.email, str) else list(user.email)

    html_body = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 520px; margin: auto;">
            <div style="background: linear-gradient(135deg, #1a56db, #0ea5e9); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: -0.5px;">&#128274; Password Reset</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0;">Visiomed Radiological Platform</p>
            </div>
            <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                <p style="margin-top: 0;">Hello <strong>{user.username}</strong>,</p>
                <p>We received a request to reset your password. A new temporary password has been generated for your account:</p>
                <div style="background: #fff; border: 2px dashed #1a56db; border-radius: 8px; padding: 16px 24px; text-align: center; margin: 24px 0;">
                    <code style="font-size: 20px; letter-spacing: 2px; color: #1a56db; font-weight: bold;">{new_password}</code>
                </div>
                <p style="color: #ef4444;"><strong>&#9888; Important:</strong> Please log in immediately and change this password from your profile settings.</p>
                <p>If you did not request a password reset, please contact your system administrator right away.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="font-size: 0.75em; color: #94a3b8; margin: 0;">This is an automated message from Visiomed Medical Systems. Do not reply to this email.</p>
            </div>
        </div>
    """

    try:
        logger.info("Sending password reset email to %s", user.email)
        send_mail(
            subject="Your new temporary password — Visiomed Platform",
            message=f"Your new temporary password is: {new_password}. Please log in and change it immediately.",
            from_email=from_email,
            recipient_list=to_list,
            html_message=html_body,
            fail_silently=False,
        )
        logger.info("Password reset email queued for %s", user.email)
        return True
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)
        return False
