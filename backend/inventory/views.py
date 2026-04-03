from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth import authenticate, login, logout, get_user_model
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from django.middleware.csrf import get_token
from django.db.models import Sum
from django.db import models

from .permissions import IsOwner, permission_required, permission_required_any, role_required, role_and_permission_required
from .serializers import *
from .models import *


User = get_user_model()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_roles(request):
    roles = Role.objects.prefetch_related('default_permissions').all()
    serializer = RoleSerializer(roles, many=True)
    return Response(serializer.data)
 
 
@api_view(["POST"])
@permission_required("users", "create")
def create_role(request):
    if request.user.userprofile.role != "Owner":
        return Response({"error": "Only Owner can create roles"}, status=403)
    name = request.data.get("name", "").strip()

    if not name:
        return Response({"error": "Role name is required"}, status=400)
 
    if Role.objects.filter(name__iexact=name).exists():
        return Response({"error": "A role with this name already exists"}, status=400)
    
    role = Role.objects.create(name=name, is_system=False)
    permissions_data = request.data.get("permissions", {})
    for module, actions in permissions_data.items():
        rp = RolePermission.objects.create(
            role=role,
            module=module,
            can_view=actions.get("view", False),
            can_create=actions.get("create", False),
            can_update=actions.get("update", False),
            can_delete=actions.get("delete", False),
        )
        if module == "dashboard":
            rp.set_dashboard_fields_list(actions.get("fields", []))
            rp.save()
    Activity.objects.create(action=f"Create Role: {role.name}", user=request.user)
    serializer = RoleSerializer(role)
    return Response(serializer.data, status=201)
 
 
@api_view(["PUT"])
@permission_required("users", "update")
def update_role_permissions(request, role_id):
    if request.user.userprofile.role != "Owner":
        return Response({"error": "Only Owner can update role permissions"}, status=403)

    role = get_object_or_404(Role, pk=role_id)
    permissions_data = request.data.get("permissions", {})
    RolePermission.objects.filter(role=role).delete()
    for module, actions in permissions_data.items():
        rp = RolePermission.objects.create(
            role=role,
            module=module,
            can_view=actions.get("view", False),
            can_create=actions.get("create", False),
            can_update=actions.get("update", False),
            can_delete=actions.get("delete", False),
        )
        if module == "dashboard":
            rp.set_dashboard_fields_list(actions.get("fields", []))
            rp.save()

    users_with_role = User.objects.filter(userprofile__role=role.name)
    updated_users = 0
    for user in users_with_role:
        Permission.objects.filter(user=user).delete()
        for module, actions in permissions_data.items():
            perm = Permission.objects.create(
                user=user,
                module=module,
                can_view=actions.get("view", False),
                can_create=actions.get("create", False),
                can_update=actions.get("update", False),
                can_delete=actions.get("delete", False),
            )
            if module == "dashboard":
                perm.set_dashboard_fields_list(actions.get("fields", []))
                perm.save()
        updated_users += 1

    Activity.objects.create(action=f"Update Role Permissions: {role.name} ({updated_users} users updated)", user=request.user)
    serializer = RoleSerializer(role)
    return Response({"role": serializer.data, "updated_users": updated_users, "message": f"Role updated and applied to {updated_users} existing user(s)"})
 
 
@api_view(["DELETE"])
@permission_required("users", "delete")
def delete_role(request, role_id):
    if request.user.userprofile.role != "Owner":
        return Response({"error": "Only Owner can delete roles"}, status=403)
 
    role = get_object_or_404(Role, pk=role_id)
 
    if role.is_system:
        return Response({"error": "System roles cannot be deleted"}, status=400)
 
    user_count = UserProfile.objects.filter(role=role.name).count()
    if user_count > 0:
        return Response(
            {"error": f"Cannot delete: {user_count} user(s) still have this role"},
            status=400
        )
 
    name = role.name
    role.delete()
    Activity.objects.create(action=f"Delete Role: {name}", user=request.user)
    return Response({"message": f"Role '{name}' deleted"})
 
 
@api_view(["POST"])
@permission_required("users", "update")
def apply_role_defaults_to_user(request, user_id):
    if request.user.userprofile.role != "Owner":
        return Response({"error": "Only Owner can reset permissions"}, status=403)

    user = get_object_or_404(User, pk=user_id)
    role_name = user.userprofile.role

    try:
        role_obj = Role.objects.get(name=role_name)
    except Role.DoesNotExist:
        return Response({"error": f"No role defaults found for '{role_name}'"}, status=404)

    Permission.objects.filter(user=user).delete()
    applied = []
    for rp in role_obj.default_permissions.all():
        perm = Permission.objects.create(
            user=user,
            module=rp.module,
            can_view=rp.can_view,
            can_create=rp.can_create,
            can_update=rp.can_update,
            can_delete=rp.can_delete,
        )
        if rp.module == "dashboard":
            perm.set_dashboard_fields_list(rp.get_dashboard_fields_list())
            perm.save()
        applied.append(rp.module)

    Activity.objects.create(
        action=f"Reset Permissions to Default: {user.username} ({role_name})",
        user=request.user
    )
    return Response({"message": f"Permissions reset to '{role_name}' defaults", "modules": applied})


@api_view(['GET'])
@permission_required("activity", "view")
def get_activities(request):
    activities = Activity.objects.select_related("user").all().order_by('-created_at')
    serializer = ActivitySerializer(activities, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_required("create_user", "create")
def create_user(request):
    serializer = CreateUserSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    Activity.objects.create(action="Create User", user=request.user)
    return Response({
        "detail": "User created successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.userprofile.role
        }
    }, status=201)


@api_view(["GET"])
@permission_required_any([("users", "view"), ("sales", "view"), ("sales", "create"), ("purchases", "view"), ("purchases", "create")])
def get_users(request):
    users = User.objects.select_related("userprofile").all().order_by("-date_joined")
    serializer = UserSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_required("users", "view")
def get_single_user(request, pk):
    try:
        user = get_object_or_404(User.objects.select_related("userprofile"), pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    serializer = UserSerializer(user, context={'request': request})
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    password_changed = False
    user.first_name = request.data.get("first_name", user.first_name)
    user.email = request.data.get("email", user.email)
    old_password = request.data.get("old_password")
    password1 = request.data.get("password1")
    password2 = request.data.get("password2")

    if old_password or password1 or password2:

        if not old_password:
            return Response({"old_password": "Old password required"}, status=400)

        if not user.check_password(old_password):
            return Response({"old_password": "Old password incorrect"}, status=400)

        if password1 != password2:
            return Response({"password": "Passwords do not match"}, status=400)

        user.set_password(password1)
        password_changed = True

        PasswordChangeRequest.objects.filter(
            user=user,
            status="Approved"
        ).update(status="Completed")
    user.save()
    profile = user.userprofile
    profile.phone = request.data.get("phone", profile.phone)
    profile.role = request.data.get("role", profile.role)

    if request.FILES.get("profile_image"):
        profile.profile_image = request.FILES.get("profile_image")

    profile.save()
    Activity.objects.create(action="Update User", user=request.user)
    return Response({
        "message": "User updated successfully",
        "password_changed": password_changed
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_old_password(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    old_password = request.data.get("old_password")

    if not old_password:
        return Response({"old_password": "Old password required"}, status=400)

    if not user.check_password(old_password):
        return Response({"old_password": "Old password is incorrect"}, status=400)
    return Response({"message": "Password verified"})


@api_view(["PATCH"])
@permission_required("users", "update")
def toggle_user_status(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    user.is_active = not user.is_active
    user.save()
    Activity.objects.create(action="Toggle User Status", user=request.user)
    return Response({"message": "User status updated", "is_active": user.is_active})


@api_view(["DELETE"])
@permission_required("users", "delete")
def delete_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    user.delete()
    Activity.objects.create(action="Delete User", user=request.user)
    return Response({"message": "User deleted"})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    try:
        user_obj = User.objects.get(username=username)
        if not user_obj.is_active and user_obj.check_password(password):
            return Response(
                {
                    "error": "account_hold",
                    "message": "Your account has been put on hold. Please contact the owner to resume access."
                },
                status=status.HTTP_403_FORBIDDEN
            )
    except User.DoesNotExist:
        pass  # Fall through to authenticate() which will return None

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        serializer = UserSerializer(
            user,
            context={'request': request}   # 🔥 VERY IMPORTANT
        )
        return Response(serializer.data)
    return Response(
        {"error": "Invalid username or password"},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out successfully"})


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_cookie(request):
    return Response({"csrfToken": get_token(request)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_required("dashboard", "view")
def get_dashboard_data(request):
    from django.db.models import F, Sum as DSum

    # PRODUCTS
    products = Product.objects.select_related('category', 'unit').all()
    serializer = DashboardProductSerializer(
        products, many=True, context={'request': request}
    )

    # KPI COUNTS
    total_products  = products.count()
    low_stock_count = products.filter(stock_quantity__lte=models.F("minimum_stock")).count()
    category_count  = Category.objects.count()

    # SALES
    sales_qs = Sale.objects.select_related('customer', 'worker').order_by('-created_at')
    sales_list = list(sales_qs.values(
        'id', 'invoice_no', 'total_amount', 'payment_mode',
        'created_at', 'customer__name', 'worker__first_name'
    ))
    
    for s in sales_list:
        s['customer_name'] = s.pop('customer__name') or 'Walk-in'
        s['worker_name']   = s.pop('worker__first_name') or ''

    # PURCHASES
    purchases_list = list(
        Purchase.objects.select_related('supplier')
        .order_by('-created_at')
        .values('id', 'purchase_no', 'total_amount', 'paid_amount',
                'due_amount', 'payment_type', 'created_at', 'supplier__name')
    )
    for p in purchases_list:
        p['supplier_name'] = p.pop('supplier__name') or ''

    # PROFIT / LOSS
    total_sales_amt    = Sale.objects.aggregate(t=DSum('total_amount'))['t'] or 0
    total_purchase_amt = Purchase.objects.aggregate(t=DSum('total_amount'))['t'] or 0
    profit_loss = {
        "total_sales":    total_sales_amt,
        "total_purchase": total_purchase_amt,
        "profit":         total_sales_amt - total_purchase_amt,
    }

    # CUSTOMER OUTSTANDING
    customers = Party.objects.filter(party_type="Customer")
    outstanding_list = []
    for c in customers:
        total_bill = Sale.objects.filter(customer=c).aggregate(t=DSum('total_amount'))['t'] or 0
        total_paid = Payment.objects.filter(party=c, payment_type="Credit").aggregate(t=DSum('amount'))['t'] or 0
        outstanding_list.append({
            "customer_name": c.name,
            "total_bill":    total_bill,
            "paid":          total_paid,
            "balance":       max(total_bill - total_paid, 0),
        })

    # CURRENT STOCK
    stock_list = []
    for p in products:
        stock_list.append({
            "id":                 p.id,
            "product_name":       p.product_name,
            "category":           p.category.name if p.category else None,
            "available_quantity": p.stock_quantity,
            "unit":               p.unit.short_name if p.unit else None,
            "reorder_level":      p.minimum_stock,
            "stock_value":        p.stock_quantity * p.cost_price,
        })

    # PARTIES
    parties_list = list(
        Party.objects.values('id', 'name', 'party_type')
    )

    return Response({
        "total_products":  total_products,
        "products":        serializer.data,
        "low_stock_count": low_stock_count,
        "category_count":  category_count,
        "sales":                sales_list,
        "purchases":            purchases_list,
        "profit_loss":          profit_loss,
        "customer_outstanding": outstanding_list,
        "current_stock":        stock_list,
        "parties":              parties_list,
    })


@api_view(['GET'])
@permission_required("categories", "view")
def get_categories(request):
    categories = Category.objects.all().order_by('-created_at')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_required("categories", "view")
def get_category(request, pk):
    try:
        category = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
    serializer = CategorySerializer(category)
    return Response(serializer.data)


@api_view(['POST'])
@permission_required("categories", "create")
def create_category(request):
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        category = serializer.save()
        Activity.objects.create(action=f"Create Category: {category.name}", user=request.user if request.user.is_authenticated else None)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_required("categories", "update")
def update_category(request, pk):
    try:
        category = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
    serializer = CategorySerializer(category, data=request.data)
    if serializer.is_valid():
        serializer.save()
        Activity.objects.create(action=f"Update Category: {category.name}", user=request.user if request.user.is_authenticated else None)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_required("categories", "delete")
def delete_category(request, pk):
    try:
        category = Category.objects.get(pk=pk)
        name = category.name
    except Category.DoesNotExist:
        return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
    category.delete()
    Activity.objects.create(action=f"Delete Category: {name}", user=request.user if request.user.is_authenticated else None)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_required("units", "view")
def get_units(request):
    units = Unit.objects.all().order_by('-created_at')
    serializer = UnitSerializer(units, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_required("units", "view")
def get_unit(request, pk):
    try:
        unit = Unit.objects.get(pk=pk)
    except Unit.DoesNotExist:
        return Response({"error": "Unit not found"}, status=status.HTTP_404_NOT_FOUND)  
    serializer = UnitSerializer(unit)
    return Response(serializer.data)


@api_view(['POST'])
@permission_required("units", "create")
def create_unit(request):
    serializer = UnitSerializer(data=request.data)
    if serializer.is_valid():
        unit = serializer.save()
        Activity.objects.create(action=f"Create Unit: {unit.name}", user=request.user if request.user.is_authenticated else None)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_required("units", "update")
def update_unit(request, pk):
    try:
        unit = Unit.objects.get(pk=pk)
    except Unit.DoesNotExist:
        return Response({"error": "Unit not found"}, status=status.HTTP_404_NOT_FOUND)
    serializer = UnitSerializer(unit, data=request.data)
    if serializer.is_valid():
        serializer.save()
        Activity.objects.create(action=f"Update Unit: {unit.name}", user=request.user if request.user.is_authenticated else None)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_required("units", "delete")
def delete_unit(request, pk):
    try:
        unit = Unit.objects.get(pk=pk)
        name = unit.name
    except Unit.DoesNotExist:
        return Response({"error": "Unit not found"}, status=status.HTTP_404_NOT_FOUND)
    unit.delete()
    Activity.objects.create(action=f"Delete Unit: {name}", user=request.user if request.user.is_authenticated else None)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_required_any([("parties", "view"), ("sales", "view"), ("sales", "create"), ("purchases", "view"), ("purchases", "create")])
def get_parties(request):
    party_type = request.GET.get("type")

    parties = Party.objects.all()

    if party_type in ["Customer", "Supplier"]:
        parties = parties.filter(party_type=party_type)

    parties = parties.order_by('-created_at')

    serializer = PartySerializer(parties, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_required("parties", "view")
def get_party(request, pk):
    try:
        party = Party.objects.get(pk=pk)
    except Party.DoesNotExist:
        return Response({"error": "Party not found"}, status=status.HTTP_404_NOT_FOUND)
    serializer = PartySerializer(party)
    return Response(serializer.data)


@api_view(['POST'])
@permission_required("parties", "create")
def create_party(request):
    serializer = PartySerializer(data=request.data)
    if serializer.is_valid():
        party = serializer.save()
        Activity.objects.create(action=f"Create Party: {party.name}", user=request.user if request.user.is_authenticated else None)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_required("parties", "update")
def update_party(request, pk):
    try:
        party = Party.objects.get(pk=pk)
    except Party.DoesNotExist:
        return Response({"error": "Party not found"}, status=status.HTTP_404_NOT_FOUND)
    serializer = PartySerializer(party, data=request.data)
    if serializer.is_valid():
        serializer.save()
        Activity.objects.create(action=f"Update Party: {party.name}", user=request.user if request.user.is_authenticated else None)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_required("parties", "delete")
def delete_party(request, pk):
    try:
        party = Party.objects.get(pk=pk)
        name = party.name
    except Party.DoesNotExist:
        return Response({"error": "Party not found"}, status=status.HTTP_404_NOT_FOUND)

    party.delete()
    Activity.objects.create(action=f"Delete Party: {name}", user=request.user if request.user.is_authenticated else None)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_required_any([("products", "view"), ("sales", "view"), ("sales", "create"), ("purchases", "view"), ("purchases", "create")])
def get_products(request):
    supplier_id = request.GET.get("supplier")
    products = Product.objects.all()

    if supplier_id:
        products = products.filter(supplier_id=supplier_id)

    products = products.order_by('-created_at')
    serializer = ProductSerializer(
        products,
        many=True,
        context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_required("products", "view")
def get_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = ProductSerializer(
        product,
        context={'request': request}
    )
    return Response(serializer.data)


@api_view(['POST'])
@permission_required("products", "create")
def create_product(request):
    serializer = ProductSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    product = serializer.save()
    Activity.objects.create(action=f"Create Product: {product.product_name}", user=request.user if request.user.is_authenticated else None)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_required("products", "update")
def update_product(request, pk):
    product = get_object_or_404(Product, pk=pk)

    if request.FILES.get('image'):
        if product.image:
            product.image.delete(save=False)

    serializer = ProductSerializer(
        product,
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    Activity.objects.create(action=f"Update Product: {product.product_name}", user=request.user if request.user.is_authenticated else None)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_required("products", "delete")
def delete_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
        name = product.product_name
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    if product.image:
        product.image.delete(save=False)

    product.delete()
    Activity.objects.create(action=f"Delete Product: {name}", user=request.user if request.user.is_authenticated else None)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_required("sales", "view")
def get_sales(request):
    sales = Sale.objects.all().order_by('-created_at')
    serializer = SaleSerializer(sales, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_required("sales", "view")
def get_sale(request, pk):
    sale = get_object_or_404(Sale, pk=pk)
    serializer = SaleSerializer(sale)
    return Response(serializer.data)


@api_view(['POST'])
@permission_required("sales", "create")
def create_sale(request):
    serializer = SaleSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    sale = serializer.save()
    Activity.objects.create(action=f"Create Sale: {sale.invoice_no}", user=request.user if request.user.is_authenticated else None)
    return Response(serializer.data, status=201)


@api_view(['PUT'])
@permission_required("sales", "update")
def update_sale(request, pk):
    sale = get_object_or_404(Sale, pk=pk)
    serializer = SaleSerializer(sale, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    Activity.objects.create(action=f"Update Sale: {sale.invoice_no}", user=request.user if request.user.is_authenticated else None)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_required("sales", "delete")
def delete_sale(request, pk):
    sale = get_object_or_404(Sale, pk=pk)
    invoice_no = sale.invoice_no
    sale.delete()
    Activity.objects.create(action=f"Delete Sale: {invoice_no}", user=request.user if request.user.is_authenticated else None)
    return Response({"message": "Sale deleted"})


@api_view(['GET'])
@permission_required("purchases", "view")
def get_purchases(request):
    purchases = Purchase.objects.all().order_by('-created_at')
    serializer = PurchaseSerializer(purchases, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_required("purchases", "view")
def get_purchase(request, pk):
    try:
        purchase = Purchase.objects.get(pk=pk)
    except Purchase.DoesNotExist:
        return Response({"error": "Purchase not found"}, status=404)
    serializer = PurchaseSerializer(purchase)
    return Response(serializer.data)


@api_view(['POST'])
@permission_required("purchases", "create")
def create_purchase(request):
    serializer = PurchaseSerializer(data=request.data)
    if serializer.is_valid():
        purchase = serializer.save()
        Activity.objects.create(action=f"Create Purchase: {purchase.purchase_no}", user=request.user if request.user.is_authenticated else None)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_required("payments", "view")
def get_payments(request):
    payments = Payment.objects.all().order_by('-created_at')
    serializer = PaymentSerializer(payments, many=True)
    total_credit = payments.filter(payment_type='Credit').aggregate(total=Sum('amount'))['total'] or 0
    total_debit = payments.filter(payment_type='Debit').aggregate(total=Sum('amount'))['total'] or 0
    data = {"payments": serializer.data, "total_credit": total_credit, "total_debit": total_debit}
    return Response(data)


@api_view(['POST'])
@permission_required("damaged_stock", "create")
def add_damaged_stock(request):
    serializer = DamagedStockSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_required("stock_adjustment", "create")
def adjust_stock(request):
    serializer = StockAdjustmentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    adjust = serializer.save()
    Activity.objects.create(action=f"Stock Adjustment: {adjust.product}", user=request.user if request.user.is_authenticated else None)
    return Response(serializer.data)


@api_view(['GET'])
def get_all_transactions(request):
    transactions = []
    sales = Sale.objects.select_related("customer").all()
    for sale in sales:
        transactions.append({
            "id": f"S-{sale.id}",
            "party_name": sale.customer.name if sale.customer else "Walk-in",
            "type": "Credit",
            "amount": sale.total_amount,
            "mode": sale.payment_mode or "Cash",
            "reference": sale.invoice_no,
            "created_at": sale.created_at,
        })

    purchases = Purchase.objects.select_related("supplier").all()
    for purchase in purchases:
        transactions.append({
            "id": f"P-{purchase.id}",
            "party_name": purchase.supplier.name,
            "type": "Debit",
            "amount": purchase.total_amount,
            "mode": purchase.payment_type or "Cash",
            "reference": purchase.purchase_no,
            "created_at": purchase.created_at,
        })
    transactions = sorted(
        transactions,
        key=lambda x: x["created_at"],
        reverse=True
    )
    return Response(transactions)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_password_change(request):
    existing = PasswordChangeRequest.objects.filter(
        user=request.user,
        status__in=["Pending", "Approved"]
    ).exists()

    if existing:
        return Response({"error": "Request already pending"}, status=400)

    PasswordChangeRequest.objects.create(user=request.user)
    return Response({"message": "Password change request sent"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_password_requests(request):

    if request.user.userprofile.role != "Owner":
        return Response({"error": "Permission denied"}, status=403)

    requests = PasswordChangeRequest.objects.select_related("user").all().order_by("-created_at")
    data = [
        {
            "id": r.id,
            "username": r.user.username,
            "name": r.user.first_name,
            "status": r.status,
            "request_type": r.request_type,
            "message": r.message,
            "created_at": r.created_at
        }
        for r in requests
    ]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_password_request(request, pk):
    if request.user.userprofile.role != "Owner":
        return Response({"error": "Permission denied"}, status=403)

    req = get_object_or_404(PasswordChangeRequest, pk=pk)

    if req.status != "Pending":
        return Response({"error": "Already processed"}, status=400)

    req.status = "Approved"
    req.save()
    return Response({"message": "Request approved"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def decline_password_request(request, pk):

    if request.user.userprofile.role != "Owner":
        return Response({"error": "Permission denied"}, status=403)

    req = get_object_or_404(PasswordChangeRequest, pk=pk)
    req.status = "Rejected"
    req.save()
    return Response({"message": "Request declined"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_password_request_status(request):
    approved_request = PasswordChangeRequest.objects.filter(
        user=request.user,
        status="Approved"
    ).exists()
    return Response({
        "approved": approved_request
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def request_account_resume(request):
    """Paused user sends an account resume request from the login page."""
    username = request.data.get("username")
    message = request.data.get("message", "")

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if user.is_active:
        return Response({"error": "Account is already active"}, status=400)

    existing = PasswordChangeRequest.objects.filter(
        user=user,
        request_type="account_resume",
        status="Pending"
    ).exists()

    if existing:
        return Response({"error": "Request already pending"}, status=400)

    PasswordChangeRequest.objects.create(
        user=user,
        request_type="account_resume",
        message=message
    )
    return Response({"message": "Request sent to owner successfully"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resume_account(request, pk):
    """Owner resumes a paused user account and marks the request as Approved."""
    if request.user.userprofile.role != "Owner":
        return Response({"error": "Permission denied"}, status=403)

    req = get_object_or_404(PasswordChangeRequest, pk=pk)

    if req.request_type != "account_resume":
        return Response({"error": "Invalid request type"}, status=400)

    if req.status != "Pending":
        return Response({"error": "Request already processed"}, status=400)

    # Reactivate the user
    user = req.user
    user.is_active = True
    user.save()

    req.status = "Approved"
    req.save()

    Activity.objects.create(action="Resume User Account", user=request.user)
    return Response({"message": "Account resumed successfully"})


@api_view(["GET", "POST"])
@permission_required("permission", "create")
def user_permissions(request, user_id):

    if request.user.userprofile.role != "Owner":
        return Response({"error": "Only Owner can manage permissions"}, status=403)
    user = get_object_or_404(User, pk=user_id)

    if request.method == "GET":
        perms = Permission.objects.filter(user=user)
        data = {}
        for p in perms:
            entry = {
                "view": p.can_view,
                "create": p.can_create,
                "update": p.can_update,
                "delete": p.can_delete,
            }
            if p.module == "dashboard":
                entry["fields"] = p.get_dashboard_fields_list()
            data[p.module] = entry
        return Response({"permissions": data})

    elif request.method == "POST":
        permissions_data = request.data.get("permissions", {})

        for module, actions in permissions_data.items():
            perm, _ = Permission.objects.get_or_create(
                user=user,
                module=module
            )
            perm.can_view = actions.get("view", False)
            perm.can_create = actions.get("create", False)
            perm.can_update = actions.get("update", False)
            perm.can_delete = actions.get("delete", False)

            if module == "dashboard":
                fields_list = actions.get("fields", [])
                perm.set_dashboard_fields_list(fields_list)
            perm.save()
        return Response({"message": "Permissions updated successfully"})