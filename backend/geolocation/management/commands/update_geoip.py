import gzip
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from django.core.management.base import BaseCommand
from django.db import connection
from decouple import config


IPINFO_TOKEN = config("IPINFO_TOKEN")

class Command(BaseCommand):
    def handle(self, *args, **options):
        url = f"https://ipinfo.io/data/free/country_asn.csv.gz?token={IPINFO_TOKEN}"

        # 1. Setup a resilient Session
        session = requests.Session()
        retries = Retry(
            total=5,
            backoff_factor=2,  # Wait longer between failures
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False,
        )
        session.mount("https://", HTTPAdapter(max_retries=retries))

        # Adding a real User-Agent helps bypass some ISP firewalls
        session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )

        try:
            with session.get(url, stream=True, timeout=30) as r:
                r.raise_for_status()
                with connection.cursor() as cursor:
                    cursor.execute("TRUNCATE TABLE geolocation_iplocation")
                    with gzip.GzipFile(fileobj=r.raw) as f:
                        cursor.copy_expert(
                            "COPY geolocation_iplocation FROM STDIN WITH (FORMAT csv, HEADER)",
                            f,  # type:ignore
                        )
            self.stdout.write(self.style.SUCCESS("Successfully updated GeoIP via DB!"))

        except requests.exceptions.SSLError as e:
            self.stderr.write(self.style.ERROR(f"SSL Failed: {e}"))
            self.stderr.write("Try running: pip install --upgrade certifi urllib3")
