from django.urls import path
from . import views 
from .views_reports import *


urlpatterns = [

    path("auth/create/", views.create_user, name="create_user"),
    path("auth/login/", views.login_view, name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/csrf-cookie/", views.csrf_cookie, name="csrf_cookie" ),
    path("auth/me/", views.get_current_user, name="get_current_user"),

    path('dashboard/', views.get_dashboard_data, name='dashboard_data'),

    path("users/", views.get_users),
    path("users/<int:pk>/", views.get_single_user),
    path("users/update/<int:pk>/", views.update_user),
    path("users/toggle/<int:pk>/", views.toggle_user_status),
    path("users/verify-password/<int:pk>/", views.verify_old_password),
    path("users/delete/<int:pk>/", views.delete_user),

    path("request-password-change/", views.request_password_change),
    path("password-requests/", views.get_password_requests),
    path("password-requests/approve/<int:pk>/", views.approve_password_request),
    path("password-requests/decline/<int:pk>/", views.decline_password_request),
    path("check-password-request/", views.check_password_request_status),
    path("request-account-resume/", views.request_account_resume),
    path("password-requests/resume/<int:pk>/", views.resume_account),

    path('units/', views.get_units, name='get_units'),
    path('units/<int:pk>/', views.get_unit, name='get_unit'),
    path('units/create/', views.create_unit, name='create_unit'),
    path('units/update/<int:pk>/', views.update_unit, name='update_unit'),
    path('units/delete/<int:pk>/', views.delete_unit, name='delete_unit'),

    path("products/", views.get_products, name="get_products"),
    path("products/<int:pk>/", views.get_product, name="get_product"),
    path("products/create/", views.create_product, name="create_product"),
    path("products/update/<int:pk>/", views.update_product, name="update_product"),
    path("products/delete/<int:pk>/", views.delete_product, name="delete_product"),

    path('parties/', views.get_parties, name='get_parties'),
    path('parties/<int:pk>/', views.get_party, name='get_party'),
    path('parties/create/', views.create_party, name='create_party'),
    path('parties/update/<int:pk>/', views.update_party, name='update_party'),
    path('parties/delete/<int:pk>/', views.delete_party, name='delete_party'),

    path('categories/', views.get_categories, name='get_categories'),
    path('categories/<int:pk>/', views.get_category, name='get_category'),
    path('categories/create/', views.create_category, name='create_category'),
    path('categories/update/<int:pk>/', views.update_category, name='update_category'),
    path('categories/delete/<int:pk>/', views.delete_category, name='delete_category'),

    path("purchases/", views.get_purchases, name="get_purchases"),
    path("purchases/<int:pk>/", views.get_purchase, name="get_purchase"),
    path("purchases/create/", views.create_purchase, name="create_purchase"),

    path("sales/", views.get_sales, name="get_sales"),
    path("sales/<int:pk>/", views.get_sale, name="get_sale"),
    path("sales/create/", views.create_sale, name="create_sale"),
    path("sales/update/<int:pk>/", views.update_sale, name="update_sale"),
    path("sales/delete/<int:pk>/", views.delete_sale, name="delete_sale"),

    path('stock-adjustments/', views.adjust_stock, name='get_stock_adjustments'),
    path('damaged-stocks/', views.add_damaged_stock, name='get_damaged_stocks'),

    path('payments/', views.get_payments, name='get_payments'),

    path('activities/', views.get_activities, name='get_activities'),

    path("transactions/", views.get_all_transactions),

    path("permissions/<int:user_id>/", views.user_permissions),
    path("permissions/apply-defaults/<int:user_id>/", views.apply_role_defaults_to_user),
 
    path("roles/", views.get_roles),
    path("roles/create/", views.create_role),
    path("roles/update/<int:role_id>/", views.update_role_permissions),
    path("roles/delete/<int:role_id>/", views.delete_role),

    path('reports/current-stock/', current_stock_report),
    path('reports/low-stock/', low_stock_report),
    path('reports/out-of-stock/', out_of_stock_report),
    path('reports/sales-summary/', sales_summary_report),
    path('reports/product-sales/', product_wise_sales_report),
    path('reports/customer-sales/', customer_sales_report),
    path('reports/purchase-summary/', purchase_summary_report),
    path('reports/supplier-purchase/', supplier_purchase_report),
    path('reports/profit-loss/', profit_loss_report),
    path('reports/payment/', payment_report),
    path('reports/customer-outstanding/', customer_outstanding_report),
    path('reports/stock-movement/', stock_movement_report),
]

