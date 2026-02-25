from rest_framework import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request):
        return request.user.IsAuthenticated and request.user.role == 'admin'
    
class isRadiologist(BasePermission):
    def has_permission(self, request):
        return request.user.IsAuthenticated and request.user.role == 'radiologist'

class IsDoctor(BasePermission):
    def has_permission(self, request):
        return request.user.is_authenticated and request.user.role in ['doctor', 'radiologist']