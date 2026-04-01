from django.db import models
from netfields import CidrAddressField, NetManager


class IPLocation(models.Model):
    # This maps to the 'network' column in the IPinfo CSV
    network = CidrAddressField(primary_key=True)
    city = models.CharField(max_length=100, null=True)
    region = models.CharField(max_length=100, null=True)
    country = models.CharField(max_length=2, null=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True)

    objects = NetManager()  # Required for CIDR lookups

    class Meta:
        # Crucial for performance: Use a GIST index for range lookups
        indexes = [
            models.Index(
                fields=["network"], name="idx_ip_network_gist", opclasses=["inet_ops"]
            ),
        ]
