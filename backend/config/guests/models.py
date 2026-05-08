import uuid
from django.db import models
from django.utils.crypto import get_random_string


def generate_short_code():
    return get_random_string(8, allowed_chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789')


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
    short_code = models.CharField(max_length=8, unique=True, db_index=True, editable=False)
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

    def save(self, *args, **kwargs):
        if not self.short_code:
            short_code = generate_short_code()
            while InvitationQR.objects.filter(short_code=short_code).exists():
                short_code = generate_short_code()
            self.short_code = short_code
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.guest.full_name} - {self.short_code}'


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


class QRCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code_number = models.PositiveIntegerField(unique=True, db_index=True)
    image_url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'qr_codes'
        ordering = ['code_number']

    def __str__(self):
        return f'Guest Pass #{self.code_number}'


class QRScan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    qr_code = models.ForeignKey(
        QRCode,
        on_delete=models.CASCADE,
        related_name='scans',
    )
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'qr_scans'
        ordering = ['scanned_at']

    def __str__(self):
        return f'{self.qr_code_id} scanned at {self.scanned_at}'
