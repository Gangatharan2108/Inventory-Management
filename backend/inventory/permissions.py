from rest_framework.permissions import BasePermission
from functools import wraps
from rest_framework.response import Response
from .models import Permission
from functools import wraps
    

class IsOwner(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if hasattr(request.user, "userprofile"):
            return request.user.userprofile.role == "Owner"
        return False


# MODULE LIST
MODULES = [
    "dashboard",
    "parties",
    "products",
    "damaged_stock",
    "stock_adjustment",
    "categories",
    "units",
    "sales",
    "purchases",
    "payments",
    "activity",
    "current_stock",
    "low_stock",
    "sales_summary",
    "profit_loss",
    "customer_outstanding",
    "users",
    "create_user",
    "permission"
]

def has_permission(user, module, action):
    try:
        perm = Permission.objects.get(user=user, module=module)
        return getattr(perm, f"can_{action}", False)
    except Permission.DoesNotExist:
        return False

def permission_required(module, action):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):

            if not request.user.is_authenticated:
                return Response({"error": "Login required"}, status=401)

            if hasattr(request.user, "userprofile") and request.user.userprofile.role == "Owner":
                return view_func(request, *args, **kwargs)

            if not has_permission(request.user, module, action):
                return Response({"error": "Permission denied"}, status=403)

            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator

def permission_required_any(permissions_list):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
 
            if not request.user.is_authenticated:
                return Response({"error": "Login required"}, status=401)
 
            if hasattr(request.user, "userprofile") and request.user.userprofile.role == "Owner":
                return view_func(request, *args, **kwargs)
 
            for module, action in permissions_list:
                if has_permission(request.user, module, action):
                    return view_func(request, *args, **kwargs)
 
            return Response({"error": "Permission denied"}, status=403)
        return wrapper
    return decorator


def role_required(*allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response({"error": "Login required"}, status=401)

            user_role = getattr(
                getattr(request.user, "userprofile", None), "role", None
            )

            if user_role == "Owner":
                return view_func(request, *args, **kwargs)

            if user_role not in allowed_roles:
                return Response(
                    {"error": f"Access restricted to: {', '.join(allowed_roles)}"},
                    status=403
                )

            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator


def role_and_permission_required(allowed_roles, module, action):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response({"error": "Login required"}, status=401)

            user_role = getattr(
                getattr(request.user, "userprofile", None), "role", None
            )

            if user_role == "Owner":
                return view_func(request, *args, **kwargs)

            if user_role not in allowed_roles:
                return Response(
                    {"error": f"Role not permitted. Required: {', '.join(allowed_roles)}"},
                    status=403
                )

            if not has_permission(request.user, module, action):
                return Response({"error": "Permission denied"}, status=403)

            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator