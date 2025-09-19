from django.utils.deprecation import MiddlewareMixin

class CsrfExemptMiddleware(MiddlewareMixin):
    """
    Disable CSRF for specific Razorpay endpoints
    """
    EXEMPT_PATHS = [
        '/payments/create-order/',
        '/payments/verify-payment/',
    ]

    def process_request(self, request):
        if request.path in self.EXEMPT_PATHS:
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
