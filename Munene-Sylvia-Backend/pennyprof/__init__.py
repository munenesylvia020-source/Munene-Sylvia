try:
    from rest_framework import urlpatterns as _drf_urlpatterns
    from django.urls import register_converter as _django_register_converter

    def _safe_register_converter(converter, type_name):
        try:
            _django_register_converter(converter, type_name)
        except ValueError:
            pass

    _drf_urlpatterns.register_converter = _safe_register_converter
except Exception:
    pass

