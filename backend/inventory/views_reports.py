from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import F, Sum
from .models import Product, SaleItem, PurchaseItem, Payment, Party, Sale, Purchase
from .permissions import permission_required


@api_view(['GET'])
@permission_required("current_stock", "view")
def current_stock_report(request):
    products = Product.objects.select_related('category', 'unit', 'sub_unit').all()

    data = []
    for p in products:
        data.append({
            "id": p.id,
            "product_name": p.product_name,
            "category": p.category.name if p.category else None,
            "available_quantity": p.stock_quantity,
            "unit": p.unit.short_name if p.unit else None,
            "sub_unit_short_name": p.sub_unit.short_name if p.sub_unit else None,
            "conversion_factor": p.conversion_factor,
            "reorder_level": p.minimum_stock,
            # BUG FIX: added maximum_stock so frontend StockBar can compute fill %
            "maximum_stock": p.maximum_stock,
            "stock_value": p.stock_quantity * p.cost_price,
        })
    return Response(data)


@api_view(['GET'])
@permission_required("low_stock", "view")
def low_stock_report(request):
    products = Product.objects.filter(stock_quantity__lte=F('minimum_stock'))
    data = []
    for p in products:
        data.append({
            "product_name": p.product_name,
            "current_quantity": p.stock_quantity,
            "minimum_quantity": p.minimum_stock,
        })
    return Response(data)


@api_view(['GET'])
def out_of_stock_report(request):
    products = Product.objects.filter(stock_quantity=0)
    data = [{"product_name": p.product_name} for p in products]
    return Response(data)


@api_view(['GET'])
@permission_required("sales_summary", "view")
def sales_summary_report(request):
    start = request.GET.get('start')
    end = request.GET.get('end')
    sales = Sale.objects.select_related('customer', 'worker').all().order_by('-created_at')
    if start and end:
        sales = sales.filter(created_at__date__range=[start, end])

    invoice_data = []
    for sale in sales:
        invoice_data.append({
            "sale_id": sale.id,
            "invoice_no": sale.invoice_no,
            "date": sale.created_at,
            "customer_name": sale.customer.name if sale.customer else "Walk-in",
            "total_price": sale.total_amount,
            "worker_name": sale.worker.first_name,
            "payment_mode": sale.payment_mode or "Cash",
        })

    product_summary = SaleItem.objects.filter(
        sale__in=sales
    ).values("product__product_name").annotate(
        total_price=Sum(F("quantity") * F("per_item_price"))
    )

    product_data = [
        {
            "product_name": item["product__product_name"],
            "total_price": item["total_price"],
        }
        for item in product_summary
    ]
    return Response({"invoices": invoice_data, "products": product_data})


@api_view(['GET'])
def product_wise_sales_report(request):
    items = SaleItem.objects.values('product__product_name').annotate(
        total_quantity=Sum('quantity'),
        revenue=Sum(F('quantity') * F('per_item_price'))
    )
    return Response(items)


@api_view(['GET'])
def customer_sales_report(request):
    customers = Party.objects.filter(party_type="Customer")
    data = []
    for c in customers:
        total_purchase = Sale.objects.filter(customer=c).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        payments = Payment.objects.filter(party=c, payment_type="Credit").aggregate(
            total=Sum('amount')
        )['total'] or 0
        data.append({
            "customer_name": c.name,
            "total_purchase": total_purchase,
            "outstanding": total_purchase - payments,
        })
    return Response(data)


@api_view(['GET'])
def purchase_summary_report(request):
    purchases = Purchase.objects.select_related('supplier')
    data = []
    for p in purchases:
        data.append({
            "supplier": p.supplier.name,
            "purchase_no": p.purchase_no,
            "purchase_date": p.created_at,
            "total_amount": p.total_amount,
        })
    return Response(data)


@api_view(['GET'])
def supplier_purchase_report(request):
    suppliers = Party.objects.filter(party_type="Supplier")
    data = []
    for s in suppliers:
        total_purchase = Purchase.objects.filter(supplier=s).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        data.append({
            "supplier_name": s.name,
            "total_purchase": total_purchase,
        })
    return Response(data)


@api_view(['GET'])
@permission_required("profit_loss", "view")
def profit_loss_report(request):
    total_sales = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
    total_purchase = Purchase.objects.aggregate(total=Sum('total_amount'))['total'] or 0
    profit = total_sales - total_purchase
    return Response({
        "total_sales": total_sales,
        "total_purchase": total_purchase,
        "profit": profit,
    })


@api_view(['GET'])
def payment_report(request):
    payments = Payment.objects.all()
    data = []
    for p in payments:
        data.append({
            "party": p.party.name,
            "type": p.payment_type,
            "amount": p.amount,
            "mode": p.payment_mode,
            "date": p.created_at,
        })
    return Response(data)


@api_view(['GET'])
@permission_required("customer_outstanding", "view")
def customer_outstanding_report(request):
    customers = Party.objects.filter(party_type="Customer")
    data = []
    for c in customers:
        total_bill = Sale.objects.filter(customer=c).aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        # BUG FIX: Previously was summing Payment records with payment_type="Credit",
        # but Sale.save() creates a Credit Payment equal to total_amount for EVERY sale,
        # meaning total_paid always equalled total_bill → balance was always 0.
        #
        # CORRECT LOGIC:
        # "paid" = sales where customer paid on the spot (Cash / Bank / UPI).
        # "outstanding" = sales done on Credit (payment_mode="Credit") that are not yet settled.
        #
        # Paid at time of sale (non-credit modes):
        paid_at_sale = Sale.objects.filter(customer=c).exclude(
            payment_mode__iexact="Credit"
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Additional payments collected later recorded as Debit payments from supplier side
        # (customers pay us — these are stored as Debit type from customer's party):
        extra_payments = Payment.objects.filter(
            party=c,
            payment_type="Debit"
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_paid = paid_at_sale + extra_payments
        balance = max(total_bill - total_paid, 0)

        data.append({
            "customer_name": c.name,
            "total_bill": total_bill,
            "paid": total_paid,
            "balance": balance,
        })
    return Response(data)


@api_view(['GET'])
def stock_movement_report(request):
    products = Product.objects.all()
    data = []
    for p in products:
        purchased = PurchaseItem.objects.filter(product=p).aggregate(
            total=Sum('quantity')
        )['total'] or 0
        sold = SaleItem.objects.filter(product=p).aggregate(
            total=Sum('quantity')
        )['total'] or 0
        damaged = p.damagedstock_set.aggregate(
            total=Sum('quantity')
        )['total'] or 0
        data.append({
            "product": p.product_name,
            "opening_stock": 0,
            "purchased": purchased,
            "sold": sold,
            "damaged": damaged,
            "closing_stock": p.stock_quantity,
        })
    return Response(data)