from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework import status

from .utils.get_client_location import get_client_geolocation


class GetLocationView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        geo = get_client_geolocation(request)
        print(geo)
        return Response(geo, status=status.HTTP_200_OK)