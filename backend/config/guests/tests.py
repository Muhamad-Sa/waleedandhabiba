from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Guest, InvitationQR, QRScanLog


class ScanInvitationViewTests(APITestCase):
    def setUp(self):
        self.guest = Guest.objects.create(
            full_name='Habiba Example',
            allowed_guests=3,
        )
        self.invitation = InvitationQR.objects.create(guest=self.guest)
        self.url = reverse('scan-invitation', kwargs={'id': self.invitation.id})

    def test_first_scan_marks_invitation_as_checked_in(self):
        response = self.client.post(
            self.url,
            HTTP_USER_AGENT='pytest-agent',
        )

        self.invitation.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['message'], 'Invitation scanned successfully.')
        self.assertEqual(response.data['invitation']['guest']['full_name'], self.guest.full_name)
        self.assertEqual(response.data['invitation']['guest']['allowed_guests'], 3)
        self.assertTrue(response.data['invitation']['is_checked_in'])
        self.assertEqual(response.data['invitation']['scanned_count'], 1)
        self.assertTrue(self.invitation.is_checked_in)
        self.assertEqual(self.invitation.scanned_count, 1)
        self.assertIsNotNone(self.invitation.first_scanned_at)
        self.assertIsNotNone(self.invitation.last_scanned_at)

        scan_log = QRScanLog.objects.get(qr=self.invitation)
        self.assertEqual(scan_log.scanned_by, 'anonymous')
        self.assertEqual(scan_log.device_info, 'pytest-agent')

    def test_repeat_scan_returns_duplicate_status_and_increments_count(self):
        first_response = self.client.post(self.url)
        second_response = self.client.post(self.url)

        self.invitation.refresh_from_db()

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.data['status'], 'already_checked_in')
        self.assertEqual(
            second_response.data['message'],
            'This invitation was already scanned before.',
        )
        self.assertTrue(second_response.data['invitation']['is_checked_in'])
        self.assertEqual(second_response.data['invitation']['scanned_count'], 2)
        self.assertTrue(self.invitation.is_checked_in)
        self.assertEqual(self.invitation.scanned_count, 2)
        self.assertEqual(QRScanLog.objects.filter(qr=self.invitation).count(), 2)
