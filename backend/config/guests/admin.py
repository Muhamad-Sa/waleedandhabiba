from django.contrib import admin
from .models import Guest, InvitationQR, QRScanLog


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'phone', 'email', 'allowed_guests', 'created_at')
    search_fields = ('full_name', 'phone', 'email')
    list_filter = ('created_at',)


@admin.register(InvitationQR)
class InvitationQRAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'guest',
        'is_checked_in',
        'scanned_count',
        'first_scanned_at',
        'last_scanned_at',
        'created_at',
    )
    search_fields = ('id', 'guest__full_name', 'guest__phone', 'guest__email')
    list_filter = ('is_checked_in', 'created_at')


@admin.register(QRScanLog)
class QRScanLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'qr', 'scanned_at', 'scanned_by')
    search_fields = ('qr__id', 'qr__guest__full_name', 'scanned_by')
    list_filter = ('scanned_at',)