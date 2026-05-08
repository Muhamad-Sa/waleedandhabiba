from django.urls import reverse
from django.test import override_settings
from io import BytesIO
from rest_framework import status
from rest_framework.test import APITestCase
from zipfile import ZipFile

from .models import Guest, InvitationQR, QRCode, QRScanLog
from .qr_tokens import build_qr_token


class ScanInvitationViewTests(APITestCase):
    def setUp(self):
        self.guest = Guest.objects.create(
            full_name='Habiba Example',
            allowed_guests=3,
        )
        self.invitation = InvitationQR.objects.create(guest=self.guest)
        self.url = reverse('scan-invitation', kwargs={'short_code': self.invitation.short_code})

    def test_first_scan_marks_invitation_as_checked_in(self):
        response = self.client.post(
            self.url,
            HTTP_USER_AGENT='pytest-agent',
        )

        self.invitation.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(
            response.data['message'],
            'This QR code is valid and has now been marked as scanned.',
        )
        self.assertEqual(response.data['scan']['short_code'], self.invitation.short_code)
        self.assertTrue(response.data['scan']['is_checked_in'])
        self.assertEqual(response.data['scan']['scanned_count'], 1)
        self.assertNotIn('guest', response.data['scan'])
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
            'This QR code was already scanned before.',
        )
        self.assertTrue(second_response.data['scan']['is_checked_in'])
        self.assertEqual(second_response.data['scan']['scanned_count'], 2)
        self.assertTrue(self.invitation.is_checked_in)
        self.assertEqual(self.invitation.scanned_count, 2)
        self.assertEqual(QRScanLog.objects.filter(qr=self.invitation).count(), 2)


@override_settings(QR_SECRET_KEY='test-secret', QR_ADMIN_KEY='admin-test-key')
class WeddingQRCodeViewTests(APITestCase):
    def setUp(self):
        self.qr_code = QRCode.objects.create(
            code_number=142,
            image_url='https://example.com/qr-142.png',
        )
        self.scan_url = reverse('qr-scan')
        self.all_url = reverse('qr-all')
        self.download_url = reverse('qr-download')

    def test_signed_token_first_scan_logs_without_guest_data(self):
        response = self.client.post(
            self.scan_url,
            {'token': build_qr_token(self.qr_code.id)},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'first_time')
        self.assertEqual(response.data['qr_code']['code_number'], 142)
        self.assertEqual(response.data['qr_code']['label'], 'Guest Pass #142')
        self.assertTrue(response.data['scan']['first_time'])
        self.assertEqual(response.data['scan']['previous_scan_count'], 0)
        self.assertEqual(response.data['scan']['total_scans'], 1)
        self.assertNotIn('guest', response.data)
        self.assertEqual(self.qr_code.scans.count(), 1)

    def test_repeat_signed_token_scan_returns_history(self):
        token = build_qr_token(self.qr_code.id)
        first_response = self.client.post(self.scan_url, {'token': token}, format='json')
        second_response = self.client.post(self.scan_url, {'token': token}, format='json')

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.data['status'], 'already_scanned')
        self.assertFalse(second_response.data['scan']['first_time'])
        self.assertEqual(second_response.data['scan']['previous_scan_count'], 1)
        self.assertEqual(second_response.data['scan']['total_scans'], 2)
        self.assertIsNotNone(second_response.data['scan']['first_scanned_at'])
        self.assertIsNotNone(second_response.data['scan']['last_scanned_at'])

    def test_invalid_token_is_rejected(self):
        response = self.client.post(
            self.scan_url,
            {'token': f'wh-{self.qr_code.id}-bad-signature'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.qr_code.scans.count(), 0)

    def test_qr_all_requires_admin_key_and_returns_scan_counts(self):
        self.client.post(
            self.scan_url,
            {'token': build_qr_token(self.qr_code.id)},
            format='json',
        )

        blocked_response = self.client.get(self.all_url)
        allowed_response = self.client.get(self.all_url, HTTP_X_ADMIN_KEY='admin-test-key')

        self.assertEqual(blocked_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(allowed_response.status_code, status.HTTP_200_OK)
        self.assertEqual(allowed_response.data[0]['code_number'], 142)
        self.assertEqual(allowed_response.data[0]['scan_count'], 1)

    def test_qr_download_requires_all_400_codes(self):
        response = self.client.get(self.download_url, HTTP_X_ADMIN_KEY='admin-test-key')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Generate all 400 QR codes', response.data['detail'])

    def test_qr_download_returns_zip_with_400_pngs(self):
        QRCode.objects.exclude(id=self.qr_code.id).delete()
        for code_number in range(1, 401):
            QRCode.objects.get_or_create(
                code_number=code_number,
                defaults={'image_url': f'https://example.com/qr-{code_number}.png'},
            )

        response = self.client.get(self.download_url, HTTP_X_ADMIN_KEY='admin-test-key')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/zip')

        with ZipFile(BytesIO(response.content)) as archive:
            names = archive.namelist()
            self.assertEqual(len(names), 400)
            self.assertIn('waleed-habiba-guest-pass-001.png', names)
            self.assertIn('waleed-habiba-guest-pass-400.png', names)
