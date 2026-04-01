


import textwrap

def format_sms_message(message:str, width=35):
    """
    Automatically inserts \n into message for readability.
    suitable for both mobile screens and feature phones
    """
    return "\n".join(textwrap.wrap(text=message, width=width,
                                   break_long_words=False))
