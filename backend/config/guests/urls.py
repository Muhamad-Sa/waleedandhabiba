from django.urls import path
from .views import (
    GuestListCreateView,
    GuestDetailView,
    InvitationDetailView,
    ScanInvitationView,
)

urlpatterns = [
    path('guests/', GuestListCreateView.as_view(), name='guest-list-create'),
    path('guests/<int:pk>/', GuestDetailView.as_view(), name='guest-detail'),
    path('invitations/<uuid:id>/', InvitationDetailView.as_view(), name='invitation-detail'),
    path('invitations/<uuid:id>/scan/', ScanInvitationView.as_view(), name='scan-invitation'),
]