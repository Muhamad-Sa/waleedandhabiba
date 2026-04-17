from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Guest, InvitationQR, QRScanLog
from .serializers import (
    GuestSerializer,
    GuestCreateSerializer,
    InvitationQRSerializer,
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
    def post(self, request, id):
        qr = get_object_or_404(InvitationQR.objects.select_related('guest'), id=id)
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

        serializer = InvitationQRSerializer(qr)

        return Response(
            {
                'status': 'already_checked_in' if duplicate else 'success',
                'message': (
                    'This invitation was already scanned before.'
                    if duplicate
                    else 'Invitation scanned successfully.'
                ),
                'invitation': serializer.data,
            },
            status=status.HTTP_200_OK,
        )
