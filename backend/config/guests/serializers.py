from rest_framework import serializers
from .models import Guest, InvitationQR, QRScanLog


class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ['id', 'full_name', 'phone', 'email', 'allowed_guests', 'created_at']
        read_only_fields = ['id', 'created_at']


class InvitationQRSerializer(serializers.ModelSerializer):
    guest = GuestSerializer(read_only=True)

    class Meta:
        model = InvitationQR
        fields = [
            'id',
            'guest',
            'is_checked_in',
            'scanned_count',
            'first_scanned_at',
            'last_scanned_at',
            'created_at',
        ]
        read_only_fields = fields


class GuestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ['id', 'full_name', 'phone', 'email', 'allowed_guests', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        guest = Guest.objects.create(**validated_data)
        InvitationQR.objects.create(guest=guest)
        return guest


class QRScanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRScanLog
        fields = ['id', 'qr', 'scanned_at', 'scanned_by', 'device_info']
        read_only_fields = ['id', 'scanned_at']