from django.urls import path
from .views import health_check, geocode_view, plan_route

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('geocode/', geocode_view, name='geocode'),
    path('plan-route/', plan_route, name='plan-route'),
]
