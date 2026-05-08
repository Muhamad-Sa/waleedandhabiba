from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

from django.db import transaction
from django.db.models import Count, Min, Max
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
import uuid

from .models import Guest, InvitationQR, QRCode, QRScan, QRScanLog
from .qr_tokens import build_qr_token, parse_and_validate_qr_token
from .serializers import (
    GuestSerializer,
    GuestCreateSerializer,
    InvitationQRSerializer,
    InvitationQRScanSerializer,
    QRCodeSerializer,
)


class GuestListCreateView(generics.ListCreateAPIView):
    queryset = Guest.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GuestCreateSerializer
        return GuestSerializer


class GuestDetailView(generics.RetrieveAPIView):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer


class InvitationDetailView(generics.RetrieveAPIView):
    queryset = InvitationQR.objects.select_related('guest').all()
    serializer_class = InvitationQRSerializer
    lookup_field = 'id'


class ScanInvitationView(APIView):
    @transaction.atomic
    def post(self, request, short_code):
        qr = get_object_or_404(
            InvitationQR.objects.select_related('guest'),
            short_code=short_code.upper(),
        )
        now = timezone.now()

        qr.scanned_count += 1
        qr.last_scanned_at = now

        if not qr.first_scanned_at:
            qr.first_scanned_at = now

        duplicate = qr.is_checked_in
        if not qr.is_checked_in:
            qr.is_checked_in = True

        qr.save()

        QRScanLog.objects.create(
            qr=qr,
            scanned_by=request.user.username if request.user.is_authenticated else 'anonymous',
            device_info=request.headers.get('User-Agent', ''),
        )

        serializer = InvitationQRScanSerializer(qr)

        return Response(
            {
                'status': 'already_checked_in' if duplicate else 'success',
                'message': (
                    'This QR code was already scanned before.'
                    if duplicate
                    else 'This QR code is valid and has now been marked as scanned.'
                ),
                'scan': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminQRPermissionMixin:
    def _admin_error_response(self, request):
        from django.conf import settings

        admin_key = getattr(settings, 'QR_ADMIN_KEY', '')
        if not admin_key:
            return Response(
                {'detail': 'QR_ADMIN_KEY is not configured.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        provided_key = request.headers.get('X-Admin-Key', '')
        if provided_key != admin_key:
            return Response(
                {'detail': 'Admin key is required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return None


class GenerateQRCodesView(AdminQRPermissionMixin, APIView):
    @transaction.atomic
    def post(self, request):
        from .qr_artwork import make_wedding_qr_png
        from .qr_storage import store_qr_png

        permission_error = self._admin_error_response(request)
        if permission_error:
            return permission_error

        generated = 0
        updated = 0

        for code_number in range(1, 401):
            qr_code, created = QRCode.objects.get_or_create(
                code_number=code_number,
                defaults={'image_url': ''},
            )

            if created or not qr_code.image_url:
                token = build_qr_token(qr_code.id)
                png_bytes = make_wedding_qr_png(token, code_number)
                qr_code.image_url = store_qr_png(code_number, qr_code.id, png_bytes)
                qr_code.save(update_fields=['image_url'])

                if created:
                    generated += 1
                else:
                    updated += 1

        return Response(
            {
                'status': 'success',
                'generated': generated,
                'updated': updated,
                'total': QRCode.objects.count(),
            },
            status=status.HTTP_200_OK,
        )


class ScanQRCodeView(APIView):
    @transaction.atomic
    def post(self, request):
        token = request.data.get('token', '')

        try:
            qr_code_id = parse_and_validate_qr_token(token)
        except ValueError:
            return Response(
                {'detail': 'QR_SECRET_KEY is not configured.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not qr_code_id:
            return Response(
                {'detail': 'Invalid QR token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uuid.UUID(qr_code_id)
        except ValueError:
            return Response(
                {'detail': 'Invalid QR token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qr_code = get_object_or_404(QRCode.objects.select_for_update(), id=qr_code_id)
        previous_scan_count = qr_code.scans.count()
        scan = QRScan.objects.create(qr_code=qr_code)

        history = qr_code.scans.aggregate(
            total_scans=Count('id'),
            first_scanned_at=Min('scanned_at'),
            last_scanned_at=Max('scanned_at'),
        )

        first_time = previous_scan_count == 0

        return Response(
            {
                'status': 'first_time' if first_time else 'already_scanned',
                'qr_code': {
                    'id': str(qr_code.id),
                    'code_number': qr_code.code_number,
                    'label': f'Guest Pass #{qr_code.code_number}',
                },
                'scan': {
                    'id': str(scan.id),
                    'scanned_at': scan.scanned_at,
                    'first_time': first_time,
                    'previous_scan_count': previous_scan_count,
                    'total_scans': history['total_scans'],
                    'first_scanned_at': history['first_scanned_at'],
                    'last_scanned_at': history['last_scanned_at'],
                },
            },
            status=status.HTTP_200_OK,
        )


class QRCodeListView(AdminQRPermissionMixin, APIView):
    def get(self, request):
        permission_error = self._admin_error_response(request)
        if permission_error:
            return permission_error

        qr_codes = QRCode.objects.annotate(scan_count=Count('scans')).order_by('code_number')
        return Response(QRCodeSerializer(qr_codes, many=True).data)


class DownloadQRCodesView(AdminQRPermissionMixin, APIView):
    def get(self, request):
        from .qr_artwork import make_wedding_qr_png

        permission_error = self._admin_error_response(request)
        if permission_error:
            return permission_error

        qr_codes = list(QRCode.objects.order_by('code_number'))
        if len(qr_codes) != 400:
            return Response(
                {
                    'detail': (
                        'Generate all 400 QR codes before downloading. '
                        f'Current total is {len(qr_codes)}.'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        zip_buffer = BytesIO()
        try:
            with ZipFile(zip_buffer, 'w', ZIP_DEFLATED) as archive:
                for qr_code in qr_codes:
                    token = build_qr_token(qr_code.id)
                    png_bytes = make_wedding_qr_png(token, qr_code.code_number)
                    archive.writestr(
                        f'waleed-habiba-guest-pass-{qr_code.code_number:03d}.png',
                        png_bytes,
                    )
        except ValueError:
            return Response(
                {'detail': 'QR_SECRET_KEY is not configured.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="waleed-habiba-qr-codes.zip"'
        return response
