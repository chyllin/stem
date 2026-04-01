from django.urls import path
from . import views

app_name = "tutors"

urlpatterns = [
    # --- Authentication & Onboarding ---
    path("signup/", views.Tutor_Signup_View.as_view(), name="tutor-signup"),

    # --- Discovery & Search ---
    path("", views.Tutor_Profile_List_View.as_view(), name="tutor-list"),
    path("search/", views.Tutor_Search_View.as_view(), name="tutor-search"),
    path(
        "top-performers/", 
        views.Top_Tutors_View.as_view(), 
        name="tutor-top-performers"
    ),

    # --- Platform-Wide Analytics (Global Stats) ---
    path(
        "stats/sessions/",
        views.Total_Tutor_Sessions_View.as_view(),
        name="total-tutor-sessions",
    ),
    path(
        "stats/rating/",
        views.Average_Tutor_Rating_View.as_view(),
        name="average-tutor-rating",
    ),
    path(
        "stats/total-count/",
        views.Total_Tutor_Count_View.as_view(),
        name="total-tutor-count",
    ),

    # --- Individual Profile Engagement (Specific Tutor Stats) ---
    # Note: These currently use ?id=X query params based on views
    path(
        "ratings/",
        views.Single_Tutor_Average_Rating_View.as_view(),
        name="average-single-tutor-rating",
    ),
    path("ratings/add/", views.Add_Tutor_Rating_View.as_view(), name="add-rating"),
    path("likes/", views.Tutor_Likes_View.as_view(), name="add-or-get-likes"),
    path(
        "completion-rate/",
        views.Single_Tutor_Completion_Rate_View.as_view(),
        name="single-tutor-completion-rate",
    ),
    
    # --- Financials & Earnings ---
    path(
        "earnings/summary/",
        views.Tutor_Earnings_Summary_View.as_view(),
        name="tutor-earnings-summary",
    ),
    path(
        "earnings/subjects/",
        views.Tutor_Earnings_By_Subject_View.as_view(),
        name="tutor-earnings-subjects",
    ),

    # --- Profile Management (UUID Based) ---
    path("<uuid:id>/", views.Tutor_Profile_Detail_View.as_view(), name="tutor-detail"),
    path(
        "<uuid:id>/update/",
        views.Tutor_Profile_Update_View.as_view(),
        name="tutor-update",
    ),
    path(
        "<uuid:id>/delete/",
        views.Tutor_Profile_Delete_View.as_view(),
        name="tutor-delete",
    ),
]
