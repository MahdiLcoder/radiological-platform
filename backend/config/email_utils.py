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
