# Generated by Django 2.1.2 on 2018-10-09 16:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_auto_20181009_1542'),
    ]

    operations = [
        migrations.AlterField(
            model_name='delivery',
            name='deposit',
            field=models.DecimalField(decimal_places=6, max_digits=12, null=True),
        ),
    ]
