import random
import string
from datetime import datetime

import pytz
from django.shortcuts import render, redirect, reverse
from django.urls.exceptions import NoReverseMatch
from django.contrib.auth import login, authenticate
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, HttpResponseBadRequest
from web3auth.forms import LoginForm, SignupForm
from web3auth.utils import recover_to_addr
from django.utils.translation import ugettext_lazy as _
from web3auth.settings import app_settings

import json

from api.models import Delivery
from api.utils import get_web3_object, get_contract_object
from shop.models import Order


def get_redirect_url(request):
    if request.GET.get('next'):
        return request.GET.get('next')
    elif request.POST.get('next'):
        return request.POST.get('next')
    elif settings.LOGIN_REDIRECT_URL:
        try:
            url = reverse(settings.LOGIN_REDIRECT_URL)
        except NoReverseMatch:
            url = settings.LOGIN_REDIRECT_URL
        return url


@require_http_methods(["GET", "POST"])
def login_api(request):
    if request.method == 'GET':
        token = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for i in range(32))
        request.session['login_token'] = token
        return JsonResponse({'data': token, 'success': True})
    else:
        token = request.session.get('login_token')
        if not token:
            return JsonResponse({'error': _(
                "No login token in session, please request token again by sending GET request to this url"),
                'success': False})
        else:
            form = LoginForm(token, request.POST)
            if form.is_valid():
                signature, address = form.cleaned_data.get("signature"), form.cleaned_data.get("address")
                del request.session['login_token']
                user = authenticate(request, token=token, address=address, signature=signature)
                if user:
                    login(request, user, 'api.backend.Web3Backend')

                    return JsonResponse({'success': True, 'redirect_url': get_redirect_url(request)})
                else:
                    error = _("Can't find a user for the provided signature with address {address}").format(
                        address=address)
                    return JsonResponse({'success': False, 'error': error})
            else:
                return JsonResponse({'success': False, 'error': json.loads(form.errors.as_json())})


@method_decorator(csrf_exempt, name='dispatch')
class ProcessPaymentView(View):

    def post(self, request):

        web3 = get_web3_object()
        contract = get_contract_object(web3, 'PaymentOnDelivery')

        payment_id = request.POST.get('delivery_id')

        delivery, created = Delivery.objects.get_or_create(delivery_id=payment_id)

        delivery.save()

        try:
            order = Order.objects.get(
                id=request.POST.get('order_id'),
                user=request.user,
                user__username__iexact=delivery.customer_address,
            )
        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Order could not be found'})

        if order.paid:
            return JsonResponse({'success': False, 'message': 'Order already paid'})

        if delivery.merchant_address != settings.ETH_MERCHANT_ADDRESS:
            return JsonResponse({'success': False, 'message': 'Payment not valid for merchant'})

        if delivery.deposit != order.total_amount:
            return JsonResponse({'success': False, 'message': 'Deposit does not match order total amount'})

        order.payment = delivery

        if (delivery.timeout - delivery.created).total_seconds() >= settings.ETH_MERCHANT_MINIMUM_DELIVERY_TIME:
            order.paid = True
            message = 'Payment successfuly linked to order'
        else:
            order.paid = False
            message = 'Timeout doesn\'t meet merchant requirement'

        order.save()

        return JsonResponse({'success': order.paid, 'message': message})
