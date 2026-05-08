from django.urls import path
from .views import (
    GuestListCreateView,
    GuestDetailView,
    DownloadQRCodesView,
    GenerateQRCodesView,
    InvitationDetailView,
    QRCodeListView,
    ScanQRCodeView,
    ScanInvitationView,
)

urlpatterns = [
    path('guests/', GuestListCreateView.as_view(), name='guest-list-create'),
    path('guests/<int:pk>/', GuestDetailView.as_view(), name='guest-detail'),
    path('invitations/<uuid:id>/', InvitationDetailView.as_view(), name='invitation-detail'),
    path('invitations/scan/<str:short_code>/', ScanInvitationView.as_view(), name='scan-invitation'),
    path('qr/generate', GenerateQRCodesView.as_view(), name='qr-generate'),
    path('qr/download', DownloadQRCodesView.as_view(), name='qr-download'),
    path('qr/scan', ScanQRCodeView.as_view(), name='qr-scan'),
    path('qr/all', QRCodeListView.as_view(), name='qr-all'),
]
