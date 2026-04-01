

import re
from django.core.exceptions import ValidationError

FORBIDDEN_PATTERNS = [

    # === SQL Injection ===
    r"(?i)(DROP\s+TABLE)",
    r"(?i)(ALTER\s+TABLE)",
    r"(?i)(DELETE\s+FROM)",
    r"(?i)(INSERT\s+INTO)",
    r"(?i)(UPDATE\s+\w+)",
    r"(?i)(SELECT\s+\*)",
    r"(?i)(UNION\s+SELECT)",
    r"(?i)(INFORMATION_SCHEMA)",
    r"(?i)(LOAD_FILE\s*\()",
    r"(?i)(INTO\s+OUTFILE)",
    r"(?i)(SLEEP\s*\()",
    r"(?i)(BENCHMARK\s*\()",
    r"(?i)(@@version)",
    r"(?i)(xp_cmdshell)",

    # === NoSQL Injection ===
    r"(?i)(\$where)",
    r"(?i)(\$ne)",
    r"(?i)(\$gt)",
    r"(?i)(\$lt)",
    r"(?i)(\$regex)",
    r"(?i)(\$eval)",
    r"(?i)(\{\s*\$)",      # NoSQL operators in JSON

    # === Script / XSS ===
    r"(?i)(<script>)",
    r"(?i)(</script>)",
    r"(?i)(javascript:)",
    r"(?i)(onload\s*=)",
    r"(?i)(onerror\s*=)",
    r"(?i)(onclick\s*=)",
    r"(?i)(onmouseover\s*=)",
    r"(?i)(<iframe)",
    r"(?i)(<\/iframe>)",
    r"(?i)(<img\s+src)",
    r"(?i)(<svg)",
    r"(?i)(alert\s*\()",

    # === HTML Injection ===
    r"(?i)(<html>)",
    r"(?i)(<body>)",
    r"(?i)(</body>)",
    r"(?i)(</html>)",
    r"(?i)(<meta)",
    r"(?i)(<style>)",

    # === Command Injection ===
    r"(?i)(;|&&|\|\|)",               # command chaining
    r"(?i)(\bcat\b)",
    r"(?i)(\bwget\b)",
    r"(?i)(\bcurl\b)",
    r"(?i)(\bchmod\b)",
    r"(?i)(\bchown\b)",
    r"(?i)(rm\s+-rf)",
    r"(?i)(sudo\s+)",
    r"(?i)(\bpython\b\s+-c)",
    r"(?i)(powershell\s+-)",
    r"(?i)(Invoke-WebRequest)",

    # === Path Traversal ===
    r"(?i)(\.\./)",
    r"(?i)(/etc/passwd)",
    r"(?i)(/etc/shadow)",
    r"(?i)(C:\\Windows)",
    r"(?i)(proc/self/environ)",

    # === File Upload Attacks ===
    r"(?i)(\.php$)",
    r"(?i)(\.phtml$)",
    r"(?i)(\.jsp$)",
    r"(?i)(\.asp$)",
    r"(?i)(\.aspx$)",
    r"(?i)(\.exe$)",
    r"(?i)(\.sh$)",
    r"(?i)(\.bat$)",

    # === XML / XXE ===
    r"(?i)(<!DOCTYPE)",
    r"(?i)(<!ENTITY)",
    r"(?i)(SYSTEM\s+['\"]file)",
    r"(?i)(file://)",

    # === Header Injection ===
    r"(?i)(\r\n)",
    r"(?i)(\n)",
    r"(?i)(%0d)",
    r"(?i)(%0a)",

    # === LDAP Injection ===
    r"(?i)(\(\s*\|\|)",
    r"(?i)(\(\s*&&)",

    # === Template Injection ===
    r"(?i)(\{\{.*\}\})",               # Jinja/Nunjucks style {{  }}
    r"(?i)(\{%.*%\})",                 # Django/Jinja blocks

    # === SSRF attempts ===
    r"(?i)(http://127\.0\.0\.1)",
    r"(?i)(http://localhost)",
    r"(?i)(http://169\.254\.169\.254)",  # AWS metadata
    r"(?i)(internal)",

    # === Prototype Pollution ===
    r"(?i)(__proto__)",
    r"(?i)(constructor)",
    r"(?i)(prototype)",

    # === Encoded payloads ===
    r"(?i)(%3Cscript%3E)",            # encoded <script>
    r"(?i)(%3C)", r"(?i)(%3E)",        # encoded < >
    r"(?i)(base64,)",                  # data:base64 injection

    # === Suspicious characters ===
    r"[\x00-\x08\x0B\x0C\x0E-\x1F]",  # control chars
]


def sanitize_value(key, value, content_length):
    """Validate a single parameter."""

    # 1. Only allow primitive JSON-compatible types
    if isinstance(value, (list, dict, tuple, set, bytes, bytearray)):
        raise ValidationError(f"Invalid data type for `{key}`.")

    # 2. Always convert to string safely
    value_str = str(value)

    # 3. Reject overly long inputs (attackers use huge payloads)
    if len(value_str) > content_length:
        raise ValidationError(f"Input for `{key}` is too long.")

    # 4. Reject control characters
    if re.search(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", value_str):
        raise ValidationError(f"Illegal characters in `{key}`.")

    # 5. Check forbidden patterns
    for pattern in FORBIDDEN_PATTERNS:
        match = re.search(pattern, value_str, re.IGNORECASE)
        if match:
            flagged = match.group(0)
            raise ValidationError(f"Suspicious content detected in `{key}: {flagged}`.")

    return value_str


def validate_request_data(data: dict, content_length):
    """Validate & sanitize all incoming request.data"""
    sanitized = {}

    for key, value in data.items():
        sanitized[key] = sanitize_value(key, value, content_length=content_length)

    return sanitized