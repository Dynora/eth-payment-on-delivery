from django.contrib import auth
from django.shortcuts import render, redirect

# Create your views here.
from django.urls import reverse
from django.views.generic import TemplateView, FormView
from web3auth.views import login_api as web3_login_api

from shop.forms import OrderForm
from shop.models import Order


class HomeView(FormView):
    template_name = "shop/home.html"
    form_class = OrderForm
    #success_url = "/order/payment/"

    def form_valid(self, form):

        form.instance.user = self.request.user
        form.instance.total_amount = form.instance.product.price
        form.instance.save()
        self.kwargs.update({'instance': form.instance})

        return super().form_valid(form)

    def get_success_url(self):
        return reverse('payment', kwargs={'order_id': self.kwargs['instance'].id})


def logout(request):
    auth.logout(request)
    return redirect('home')


class PaymentView(TemplateView):
    template_name = "shop/payment.html"

    def get_context_data(self, **kwargs):
        context = super(PaymentView, self).get_context_data(**kwargs)
        context['order'] = Order.objects.get(id=kwargs['order_id'], user=self.request.user)
        return context
