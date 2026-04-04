import uuid
from django.db import models


class Guest(models.Model):
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    allowed_guests = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class InvitationQR(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guest = models.OneToOneField(
        Guest,
        on_delete=models.CASCADE,
        related_name='invitation_qr'
    )
    is_checked_in = models.BooleanField(default=False)
    scanned_count = models.PositiveIntegerField(default=0)
    first_scanned_at = models.DateTimeField(blank=True, null=True)
    last_scanned_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.guest.full_name} - {self.id}'


class QRScanLog(models.Model):
    qr = models.ForeignKey(
        InvitationQR,
        on_delete=models.CASCADE,
        related_name='scan_logs'
    )
    scanned_at = models.DateTimeField(auto_now_add=True)
    scanned_by = models.CharField(max_length=255, blank=True, null=True)
    device_info = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'{self.qr.id} scanned at {self.scanned_at}'