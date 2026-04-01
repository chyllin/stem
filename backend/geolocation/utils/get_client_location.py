from axes.utils import get_client_ip_address
from django.http import HttpRequest
from typing import Any
from ..models import IPLocation


def get_client_geolocation(request:HttpRequest) -> tuple[bool, Any]:
    ip = get_client_ip_address(request)
    print(ip)
    # The __net_contains lookup handles CIDR logic automatically
    geo = IPLocation.objects.filter(network__net_contains=ip).first()

    if geo:
        return True, geo
    return False, None
