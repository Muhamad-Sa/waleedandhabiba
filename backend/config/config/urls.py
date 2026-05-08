from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import path, include

def home(request):
    return JsonResponse({"message": "Backend is running"})

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/", include("guests.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
