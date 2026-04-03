from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0028_permission'),
    ]

    operations = [
        # Change UserProfile.role from max_length=20+choices to max_length=50 plain
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(max_length=50),
        ),

        # Create Role model
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('is_system', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),

        # Create RolePermission model
        migrations.CreateModel(
            name='RolePermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('module', models.CharField(max_length=100)),
                ('can_view', models.BooleanField(default=False)),
                ('can_create', models.BooleanField(default=False)),
                ('can_update', models.BooleanField(default=False)),
                ('can_delete', models.BooleanField(default=False)),
                ('role', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='default_permissions',
                    to='inventory.role',
                )),
            ],
            options={
                'unique_together': {('role', 'module')},
            },
        ),
    ]