import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-payment',
  imports: [],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  currentDiscount = 0;
  basePrice = 5.00;
  taxRate = 0.21;
  error: string | null = null;
  isLoading = true;
  user: any;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {

    this.user = this.authService.getCurrentUser();

    setTimeout(() => {
      const cardNumber = document.getElementById('card-number') as HTMLInputElement;
      const cardholderName = document.getElementById('cardholder-name') as HTMLInputElement;
      const expiryDate = document.getElementById('expiry-date') as HTMLInputElement;
      const cvv = document.getElementById('cvv') as HTMLInputElement;

      if (cardNumber) cardNumber.value = '4242 4242 4242 4242';
      if (cardholderName) cardholderName.value = 'Juan Pérez García';
      if (expiryDate) expiryDate.value = '12/25';
      if (cvv) cvv.value = '123';

      this.updateTotals();
    }, 100);
  }

  goBack() {
    if (this.user.username) {
      this.router.navigate(['/layout', this.user.username]);
    } else {
      this.router.navigate(['/login']);
    }
  }

  formatCardNumber(input: HTMLInputElement) {
    let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;
  }

  formatExpiryDate(input: HTMLInputElement) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
  }

  updateTotals() {
    const discountValue = (this.basePrice * this.currentDiscount) / 100;
    const subtotalAfterDiscount = this.basePrice - discountValue;
    const taxAmount = subtotalAfterDiscount * this.taxRate;
    const total = subtotalAfterDiscount + taxAmount;

    const subtotalElement = document.getElementById('subtotal');
    const taxAmountElement = document.getElementById('tax-amount');
    const totalAmountElement = document.getElementById('total-amount');
    const payButtonTextElement = document.getElementById('pay-button-text');

    if (subtotalElement) subtotalElement.textContent = `${this.basePrice.toFixed(2)}€`;
    if (taxAmountElement) taxAmountElement.textContent = `${taxAmount.toFixed(2)}€`;
    if (totalAmountElement) totalAmountElement.textContent = `${total.toFixed(2)}€`;
    if (payButtonTextElement) payButtonTextElement.textContent = `Pagar ${total.toFixed(2)}€`;
  }

  handlePayment() {
  if (this.user.username) {
    this.router.navigate(['/user/register/professional-profile', this.user.username]);
  }
}

  cancelPayment() {
    this.goBack();
  }
}
