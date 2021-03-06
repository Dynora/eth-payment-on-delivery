# Generated by Django 2.1.2 on 2018-10-22 10:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_auto_20181009_1632'),
    ]

    operations = [
        migrations.CreateModel(
            name='Transport',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('transport_id', models.CharField(db_index=True, max_length=128, unique=True)),
                ('transporter_address', models.CharField(db_index=True, max_length=64)),
                ('merchant_address', models.CharField(db_index=True, max_length=64)),
                ('created', models.DateTimeField(blank=True, null=True)),
                ('timeout', models.DateTimeField(blank=True, null=True)),
                ('finished', models.DateTimeField(blank=True, null=True)),
                ('deposit_received', models.DateTimeField(blank=True, null=True)),
                ('cancelled', models.DateTimeField(blank=True, null=True)),
                ('deposit_claimed', models.DateTimeField(blank=True, null=True)),
                ('deposit', models.DecimalField(decimal_places=6, max_digits=12, null=True)),
                ('delivery_fee', models.DecimalField(decimal_places=6, max_digits=12, null=True)),
            ],
        ),
        migrations.AddField(
            model_name='delivery',
            name='transport_id',
            field=models.CharField(blank=True, db_index=True, max_length=128, null=True, unique=True),
        ),
    ]
