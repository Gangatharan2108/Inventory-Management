from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0032_alter_activity_action'),
    ]

    operations = [
        migrations.AddField(
            model_name='permission',
            name='dashboard_fields',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='rolepermission',
            name='dashboard_fields',
            field=models.TextField(blank=True, default=''),
        ),
    ]
