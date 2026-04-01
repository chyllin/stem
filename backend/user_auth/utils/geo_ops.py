

from django.contrib.gis import geoip2
from typing import Any


def get_user_location(ip:str) -> Any:

    g = geoip2.GeoIP2()

    try:

        location = g.city(ip)

        return location
    
    except Exception as e:
        print(e)
        return False