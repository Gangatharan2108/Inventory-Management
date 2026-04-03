from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0034_passwordchangerequest_request_type_message'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='sub_unit',
            field=models.ForeignKey(
                blank=True,
                help_text='Optional secondary unit (e.g. Bag, Bottle)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sub_products',
                to='inventory.unit',
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='conversion_factor',
            field=models.DecimalField(
                decimal_places=4,
                default=1,
                help_text='How many base units = 1 sub unit (e.g. 1 Bag = 40 Kg → 40)',
                max_digits=10,
            ),
        ),
        migrations.AlterField(
            model_name='product',
            name='unit',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='base_products',
                to='inventory.unit',
            ),
        ),
    ]
