import datetime
import models
import math

CART_ID = 'CART-ID'

class ItemAlreadyExists(Exception):
    pass

class ItemDoesNotExist(Exception):
    pass

class Cart:
    def __init__(self, request):
        cart_id = request.session.get(CART_ID)
        if cart_id:
            try:
                cart = models.Cart.objects.get(id=cart_id, checked_out=False)
            except models.Cart.DoesNotExist:
                cart = self.new(request)
        else:
            cart = self.new(request)
        self.cart = cart

    def __iter__(self):
        for item in self.cart.item_set.all():
            yield item

    def new(self, request):
        cart = models.Cart(creation_date=datetime.datetime.now())
        cart.save()
        request.session[CART_ID] = cart.id
        return cart

    def add(self, product, unit_price, quantity=1):
        try:
            item = models.Item.objects.get(
                cart=self.cart,
                product=product,
            )
        except models.Item.DoesNotExist:
            item = models.Item()
            item.cart = self.cart
            item.product = product
            item.unit_price = unit_price
            item.quantity = quantity
            item.save()
        else: #ItemAlreadyExists
            item.unit_price = unit_price
            item.quantity = item.quantity + int(quantity)
            item.save()

    def remove(self, product):
        try:
            item = models.Item.objects.get(
                cart=self.cart,
                product=product,
            )
        except models.Item.DoesNotExist:
            raise ItemDoesNotExist
        else:
            item.delete()

    def update(self, product, quantity, unit_price=None):
        try:
            item = models.Item.objects.get(
                cart=self.cart,
                product=product,
            )
        except models.Item.DoesNotExist:
            raise ItemDoesNotExist

    def items(self):
        return self.cart.item_set.all()

    def count(self):
        result = 0
        for item in self.items():
            result += 1 * item.quantity
        return result

    def total(self):
        result = 0
        for item in self.items():
            result += item.total_price
        return float(result)

    # automatically discounts based on how many things in the cart
    def discount_percent(self):
        num = self.count()

        percent = min(30.0, (num / 2.0) * 10.0)
        return (percent / 100.0)

    # 'You saved X'!
    def discount(self):
        return float(math.ceil(self.total() * self.discount_percent()))

    # 'New total is X!'
    def discount_applied(self):
        return self.total() - self.discount()

    def clear(self):
        for item in self.items():
            item.delete()

