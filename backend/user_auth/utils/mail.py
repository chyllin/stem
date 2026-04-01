
"""
Email utilities for sending transactional emails.
Uses Django's email backend (see settings EMAIL_*).
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import get_template
from django.conf import settings


def send_mail(
    subject,
    body_plain,
    to_emails,
    from_email=None,
    body_html=None,
    fail_silently=False,
):
    """
    Send an email with optional HTML alternative.

    Args:
        subject: Email subject (string).
        body_plain: Plain text body (string).
        to_emails: List of recipient addresses or single address.
        from_email: Sender address; defaults to settings.DEFAULT_FROM_EMAIL.
        body_html: Optional HTML body (string). If provided, email is sent as multipart.
        fail_silently: If True, exceptions are not raised.

    Returns:
        Number of successfully delivered messages (0 or 1).
    """
    if isinstance(to_emails, str):
        to_emails = [to_emails]
    from_email = from_email or settings.DEFAULT_FROM_EMAIL
    subject = f"{getattr(settings, 'EMAIL_SUBJECT_PREFIX', '')}{subject}".strip()

    msg = EmailMultiAlternatives(
        subject=subject,
        body=body_plain,
        from_email=from_email,
        to=to_emails,
    )
    if body_html:
        msg.attach_alternative(body_html, "text/html")
    return msg.send(fail_silently=fail_silently)


def send_templated_mail(
    subject,
    template_name,
    context,
    to_emails,
    from_email=None,
    fail_silently=False,
):
    """
    Render a Django template to HTML (and plain text fallback) and send the email.

    Args:
        subject: Email subject (string).
        template_name: Name of the template (e.g. 'signup_email.html' or 'tutors/signup_email.html').
        context: Dict of template context variables.
        to_emails: List of recipient addresses or single address.
        from_email: Sender address; defaults to settings.DEFAULT_FROM_EMAIL.
        fail_silently: If True, exceptions are not raised.

    Returns:
        Number of successfully delivered messages (0 or 1).
    """
    template = get_template(template_name)
    body_html = template.render(context)
    body_plain = "Please view this email in an HTML-capable mail client."
    return send_mail(
        subject=subject,
        body_plain=body_plain,
        to_emails=to_emails,
        from_email=from_email,
        body_html=body_html,
        fail_silently=fail_silently,
    )


def send_tutor_signup_email(to_email, full_name=None, fail_silently=True):

    """
    Send the tutor signup welcome email to a single recipient.

    Call this after a new tutor profile is created (e.g. in Tutor_Signup_View).

    Args:
        to_email: Recipient email address (string).
        full_name: Tutor's full name for personalization in the template.
        fail_silently: If True, log but do not raise on send errors.

    Returns:
        Number of successfully delivered messages (0 or 1).
    """

    context = {
        "full_name": full_name or "",
    }
    subject = "Welcome – Your tutor account is ready"
    # Template lives in tutors app: tutors/templates/signup_email.html
    template_name = "signup_email.html"
    return send_templated_mail(
        subject=subject,
        template_name=template_name,
        context=context,
        to_emails=[to_email],
        fail_silently=fail_silently,
    )
