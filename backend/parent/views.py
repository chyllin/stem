
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated


from .models import Parent_Profile
from .serializers import ParentProfileSerializer


class Parent_Signup_View(generics.CreateAPIView):

    """
    View to create a new parent profile (signup).
    
    Accepts POST with validated parent profile data.
    Returns 201 Created with the created profile on success.
    Requires authentication.
    """
    
    queryset = Parent_Profile.objects.all()  # type: ignore[attr-defined]
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated]


class Parent_Profile_List_View(generics.ListAPIView):
    """
    View to list all parent profiles.
    
    Accepts GET request.
    Returns a list of all parent profiles.
    Requires authentication.
    """
    queryset = Parent_Profile.objects.all()  # type: ignore[attr-defined]
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated]


class Parent_Profile_Detail_View(generics.RetrieveAPIView):
    """
    View to retrieve a specific parent profile.
    
    Accepts GET request with parent profile ID.
    Returns the parent profile details.
    Requires authentication.
    """
    queryset = Parent_Profile.objects.all()  # type: ignore[attr-defined]
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


class Parent_Profile_Update_View(generics.UpdateAPIView):
    """
    View to update a parent profile.
    
    Accepts PUT/PATCH request with parent profile ID and updated data.
    Returns the updated parent profile.
    Requires authentication.
    """
    queryset = Parent_Profile.objects.all()  # type: ignore[attr-defined]
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


class Parent_Profile_Delete_View(generics.DestroyAPIView):
    """
    View to delete a parent profile.
    
    Accepts DELETE request with parent profile ID.
    Returns 204 No Content on success.
    Requires authentication.
    """
    queryset = Parent_Profile.objects.all()  # type: ignore[attr-defined]
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
