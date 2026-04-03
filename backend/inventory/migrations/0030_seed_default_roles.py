from django.db import migrations


EMPLOYEE_DEFAULTS = {
    "sales": {"view": True, "create": True, "update": True, "delete": False},
    "current_stock": {"view": True, "create": False, "update": False, "delete": False},
}

SUPERVISOR_DEFAULTS = {
    "dashboard": {"view": True, "create": False, "update": False, "delete": False},
    "sales": {"view": True, "create": True, "update": True, "delete": False},
    "products": {"view": True, "create": False, "update": False, "delete": False},
    "parties": {"view": True, "create": False, "update": False, "delete": False},
    "damaged_stock": {"view": True, "create": True, "update": False, "delete": False},
    "stock_adjustment": {"view": True, "create": True, "update": False, "delete": False},
    "current_stock": {"view": True, "create": False, "update": False, "delete": False},
    "low_stock": {"view": True, "create": False, "update": False, "delete": False},
}

MANAGER_DEFAULTS = {
    "dashboard": {"view": True, "create": False, "update": False, "delete": False},
    "sales": {"view": True, "create": True, "update": True, "delete": True},
    "purchases": {"view": True, "create": True, "update": True, "delete": False},
    "products": {"view": True, "create": True, "update": True, "delete": False},
    "parties": {"view": True, "create": True, "update": True, "delete": False},
    "categories": {"view": True, "create": True, "update": True, "delete": False},
    "units": {"view": True, "create": True, "update": True, "delete": False},
    "payments": {"view": True, "create": False, "update": False, "delete": False},
    "damaged_stock": {"view": True, "create": True, "update": False, "delete": False},
    "stock_adjustment": {"view": True, "create": True, "update": False, "delete": False},
    "current_stock": {"view": True, "create": False, "update": False, "delete": False},
    "low_stock": {"view": True, "create": False, "update": False, "delete": False},
    "sales_summary": {"view": True, "create": False, "update": False, "delete": False},
    "profit_loss": {"view": True, "create": False, "update": False, "delete": False},
    "customer_outstanding": {"view": True, "create": False, "update": False, "delete": False},
    "activity": {"view": True, "create": False, "update": False, "delete": False},
}

ROLE_DEFAULTS = {
    "Employee": EMPLOYEE_DEFAULTS,
    "Supervisor": SUPERVISOR_DEFAULTS,
    "Manager": MANAGER_DEFAULTS,
    "Owner": {},       # Owner bypasses all permission checks — no defaults needed
}


def seed_roles(apps, schema_editor):
    Role = apps.get_model("inventory", "Role")
    RolePermission = apps.get_model("inventory", "RolePermission")

    for role_name, perms in ROLE_DEFAULTS.items():
        role, _ = Role.objects.get_or_create(
            name=role_name,
            defaults={"is_system": True}
        )
        role.is_system = True
        role.save()

        for module, actions in perms.items():
            RolePermission.objects.get_or_create(
                role=role,
                module=module,
                defaults={
                    "can_view": actions.get("view", False),
                    "can_create": actions.get("create", False),
                    "can_update": actions.get("update", False),
                    "can_delete": actions.get("delete", False),
                }
            )


def unseed_roles(apps, schema_editor):
    Role = apps.get_model("inventory", "Role")
    Role.objects.filter(name__in=ROLE_DEFAULTS.keys()).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0029_role_rolepermission_alter_userprofile_role"),
    ]

    operations = [
        migrations.RunPython(seed_roles, unseed_roles),
    ]