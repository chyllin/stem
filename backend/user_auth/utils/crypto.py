import base64
import hashlib
import json
import os
import random
import string
import logging

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag, AlreadyFinalized, AlreadyUpdated

from django.conf import settings
from typing import Any

logger = logging.getLogger(__name__)

class Crypto:

    def __init__(self) -> None:

        # Load key from settings (which loads from .env)
        try:
            self.key = base64.urlsafe_b64decode(settings.ENC_KEY)
            if len(self.key) != 32:
                raise ValueError("Invalid key. key must be exactly 32 bytes (256 bits)")

        except Exception as e:
            raise ValueError("Invalid key", str(e))

        self.aesgcm = AESGCM(self.key)

    def encrypt(self, data, associated_data:str) -> Any:

        if data is None:
            return None

        # 1. Serialize Data (Handle JSON or Strings)
        payload = data if isinstance(data, str) else json.dumps(data)
        payload_bytes = payload.encode(errors='strict')
        aad_bytes = associated_data.encode(errors='strict') if associated_data else b''

        # 2. Generate a Unique 96-bit (12-byte) Nonce
        nonce = os.urandom(12)
        try:
            assert len(nonce) == 12
            # 3. Encrypt
            cyphertext = self.aesgcm.encrypt(nonce, payload_bytes, aad_bytes) #type:ignore

            combined = nonce + cyphertext
            final = base64.urlsafe_b64encode(combined).decode(errors='strict')
        except InvalidTag as i:
            logger.exception("Encryption failed: Invalid authentication tag.", i)
            return None
        except AssertionError as a: 
            logger.exception("Encryption failed: Nonce length assertion failed.", a)
            return None
        except AlreadyUpdated as a:
            logger.exception("Encryption failed: Cipher already updated.", a)
            return None
        except Exception as e:
            logger.exception("Encryption failed:", str(e))
            return None

        return final

    def decrypt(self, encrypted_string, associated_data):

        # Decrypts Base64 string back to original data

        if not encrypted_string:
            return None

        try:

            # 1. Decode from DB format
            decoded = base64.urlsafe_b64decode(encrypted_string)

            # 2. Extract Nonce (First 12 bytes)
            nonce = decoded[:12]

            # 3. Extract actual Ciphertext + Tag (The rest)
            cypher_text = decoded[12:]

            # 4. Decrypt
            associated_data = str(associated_data).encode(errors='strict') if associated_data else b''
            cypher_text = (cypher_text).encode(errors='strict') if isinstance(cypher_text, str) else cypher_text

            decrypted_data = self.aesgcm.decrypt(nonce, cypher_text, associated_data)

            # 5. Deserialize
            decoded_str = decrypted_data.decode('utf-8')

            try:
                return json.loads(decoded_str)
            except json.JSONDecodeError:
                return decoded_str

        except InvalidTag as i:
            print("Decryption failed: Invalid authentication tag.", i)
            return None
        except AlreadyFinalized as a:
            print("Decryption failed: Cipher already finalized.", a)
            return None
        except Exception as e:
            # implies either data corruption or a tampering attempt.
            print("Decryption failed:", str(e))
            return None

    def hash_data(self, data:str) -> str:

        if data is None:
            return None

        peppered_data = f'{data}{settings.SECRET_PEPPER}'

        # Normalize and Hash
        normalized_data = peppered_data.lower().strip()

        encoded_data = normalized_data.encode()

        hashed_data = hashlib.sha256(encoded_data).hexdigest()

        return hashed_data

    def generate_otp(self, length=6):
        return ''.join(random.choices(string.digits, k=length))

    def generate_salt(self):
        return os.urandom(16).hex()
