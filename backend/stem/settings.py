import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ================== CORE ==================
ENC_KEY = "ppmhzFo98KW9jPYbwrlNGG0Ot3urccd8t91P0Y-fb9o="
SECRET_KEY = "dev-secret-key"
SECRET_PEPPER = "dev-secret-pepper"   # ← ADD THIS LINE
DEBUG = True

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
]

# ================== APPS ==================

INSTALLED_APPS = [
    "corsheaders",
    "netfields",
    "django.contrib.admin",
    "django.contrib.auth",
    "user_auth",
    "axes",
    "tutors",
    "parent",
    "geolocation",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

# ================== MIDDLEWARE ==================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "axes.middleware.AxesMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "stem.urls"

# ================== TEMPLATES ==================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "stem.wsgi.application"

# ================== DATABASE (SQLITE FOR TESTING) ==================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ================== AUTH ==================

AUTH_USER_MODEL = "user_auth.Custom_User"

AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# ================== PASSWORD VALIDATION ==================

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ================== INTERNATIONAL ==================

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ================== STATIC ==================

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ================== JWT ==================

JWT_SECRET_KEY = "dev-jwt-secret"

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": JWT_SECRET_KEY,
    "AUTH_COOKIE": "access_token",
    "AUTH_COOKIE_REFRESH": "refresh_token",
    "AUTH_COOKIE_SECURE": False,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SAMESITE": "Lax",
}


# ================== AXES ==================

AXES_ENABLED = True
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_LOCKOUT_CALLABLE = "user_auth.utils.rate_limit.simple_lockout_response"
AXES_HTTP_RESPONSE_CODE = 429
AXES_USE_USER_AGENT = True
AXES_ONLY_USER_FAILURES = True
AXES_LOCK_OUT_BY_COMBINATION_USER_AND_IP = True
AXES_LOCKOUT_PARAMETERS = ["username", "ip_address"]
AXES_RESET_ON_SUCCESS = True
AXES_BEHIND_REVERSE_PROXY = False

# ================== CORS / CSRF ==================

CORS_ALLOWED_ORIGINS = [
    "https://stem-tutor-a0qu.onrender.com",
    "http://localhost:5174",
]

CSRF_TRUSTED_ORIGINS = [
    "https://stem-tutor-a0qu.onrender.com",
    "http://localhost:5174",
]

CORS_ALLOW_CREDENTIALS = True

CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"

SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_HTTPONLY = True

# ================== REST FRAMEWORK ==================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

# ================== EMAIL (CONSOLE FOR TESTING) ==================

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ================== SECURITY ==================

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ================== LOGGING ==================

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}