from django.urls import path

from . import views

app_name = 'parent'

urlpatterns = [
    path('signup/', views.Parent_Signup_View.as_view(), name='parent-signup'),
    path('', views.Parent_Profile_List_View.as_view(), name='parent-list'),
    path('<uuid:id>/', views.Parent_Profile_Detail_View.as_view(), name='parent-detail'),
    path('<uuid:id>/update/', views.Parent_Profile_Update_View.as_view(), name='parent-update'),
    path('<uuid:id>/delete/', views.Parent_Profile_Delete_View.as_view(), name='parent-delete'),
]
