
import phonenumbers
import re

from django.core.exceptions import ValidationError



def normalise_phone_number(value):
        
        try:
            parsed = phonenumbers.parse(value, None)
            if not phonenumbers.is_valid_number(parsed):
                raise ValidationError("Invalid phone Number")
        except Exception:
            raise ValidationError("Invalid Phone Number")
        
        # Store the phone internally in E.164 format: +1234567890
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def validate_ghana_card(card_id: str) -> bool:
    
    # Pattern: Starts with GHA, hyphen, 9 digits, hyphen, 1 digit
    pattern = r"^GHA-[0-9]{9}-[0-9]$"
    
    if re.match(pattern, card_id):
        return True
    return False