from rest_framework import serializers
from .models import Guest, InvitationQR, QRCode, QRScan, QRScanLog


class InvitationQRSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = InvitationQR
        fields = ['id', 'short_code', 'is_checked_in', 'scanned_count', 'created_at']
        read_only_fields = fields


class GuestSerializer(serializers.ModelSerializer):
    invitation_qr = InvitationQRSummarySerializer(read_only=True)

    class Meta:
        model = Guest
        fields = ['id', 'full_name', 'phone', 'email', 'allowed_guests', 'created_at', 'invitation_qr']
        read_only_fields = ['id', 'created_at']


class InvitationQRSerializer(serializers.ModelSerializer):
    guest = GuestSerializer(read_only=True)

    class Meta:
        model = InvitationQR
        fields = [
            'id',
            'short_code',
            'guest',
            'is_checked_in',
            'scanned_count',
            'first_scanned_at',
            'last_scanned_at',
            'created_at',
        ]
        read_only_fields = fields


class InvitationQRScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvitationQR
        fields = [
            'short_code',
            'is_checked_in',
            'scanned_count',
            'first_scanned_at',
            'last_scanned_at',
        ]
        read_only_fields = fields


class GuestCreateSerializer(serializers.ModelSerializer):
    invitation_qr = InvitationQRSummarySerializer(read_only=True)

    class Meta:
        model = Guest
        fields = ['id', 'full_name', 'phone', 'email', 'allowed_guests', 'created_at', 'invitation_qr']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'full_name': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
            'allowed_guests': {'required': False},
        }

    def create(self, validated_data):
        guest = Guest.objects.create(
            full_name='Anonymous Invitation',
            phone=validated_data.get('phone'),
            email=validated_data.get('email'),
            allowed_guests=validated_data.get('allowed_guests', 1),
        )
        invitation = InvitationQR.objects.create(guest=guest)
        guest.full_name = f'Invitation {invitation.short_code}'
        guest.save(update_fields=['full_name'])
        return guest


class QRScanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRScanLog
        fields = ['id', 'qr', 'scanned_at', 'scanned_by', 'device_info']
        read_only_fields = ['id', 'scanned_at']


class QRCodeSerializer(serializers.ModelSerializer):
    scan_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = QRCode
        fields = ['id', 'code_number', 'image_url', 'created_at', 'scan_count']
        read_only_fields = fields


class QRScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRScan
        fields = ['id', 'qr_code', 'scanned_at']
        read_only_fields = fields
