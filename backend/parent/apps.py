from django.apps import AppConfig


class ParentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField' #type:ignore
    name = 'parent'
