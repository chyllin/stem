from django.urls import path

from . import views

app_name = 'user_auth'

urlpatterns = [
    # Auth: login, refresh, logout, change password, me
    path("login/", views.Login_View.as_view(), name="login"),
    path("refresh/", views.Refresh_Token_View.as_view(), name="refresh-token"),
    path("logout/", views.Logout_View.as_view(), name="logout"),
    path(
        "change-password/", views.Change_Password_View.as_view(), name="change-password"
    ),
    path(
        "me/", views.MeView.as_view(), name="me-view"
    ),
    # User CRUD
    path("register/", views.User_Register_View.as_view(), name="user-register"),
    path("", views.User_List_View.as_view(), name="user-list"),
    path("<uuid:id>/", views.User_Detail_View.as_view(), name="user-detail"),
    path("<uuid:id>/update/", views.User_Update_View.as_view(), name="user-update"),
    path("<uuid:id>/delete/", views.User_Delete_View.as_view(), name="user-delete"),
]
