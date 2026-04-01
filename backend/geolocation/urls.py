from django.urls import path
from . import views

urlpatterns = [
    path('locate/', views.GetLocationView.as_view(), name='locate_user')
]