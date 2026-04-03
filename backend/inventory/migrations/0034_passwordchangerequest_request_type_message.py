from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0033_dashboard_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='passwordchangerequest',
            name='request_type',
            field=models.CharField(
                choices=[('password_change', 'Password Change'), ('account_resume', 'Account Resume')],
                default='password_change',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='passwordchangerequest',
            name='message',
            field=models.TextField(blank=True, null=True),
        ),
    ]
