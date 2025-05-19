// Paystack integration for payment processing
document.addEventListener('DOMContentLoaded', () => {
  const paymentForm = document.getElementById('payment-form');
  const paymentButton = document.getElementById('payment-button');
  const errorDiv = document.getElementById('payment-error');

  if (paymentForm) {
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      paymentButton.disabled = true;
      errorDiv.textContent = '';

      const email = document.getElementById('email').value;
      const amount = document.getElementById('amount').value * 100; // Convert to kobo
      const state = document.getElementById('state').value;

      // Initialize Paystack transaction
      const handler = PaystackPop.setup({
        key: 'YOUR_PAYSTACK_PUBLIC_KEY', // Replace with Paystack public key from .env
        email: email,
        amount: amount,
        currency: 'NGN',
        metadata: {
          state: state,
        },
        callback: (response) => {
          // Send reference to server for verification
          fetch('/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reference: response.reference }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.status === 'success') {
                window.location.href = '/public/success?code=' + data.code;
              } else {
                errorDiv.textContent = 'Payment verification failed. Please try again.';
                paymentButton.disabled = false;
              }
            })
            .catch(err => {
              errorDiv.textContent = 'An error occurred. Please try again.';
              paymentButton.disabled = false;
            });
        },
        onClose: () => {
          errorDiv.textContent = 'Payment cancelled.';
          paymentButton.disabled = false;
        },
      });

      handler.openIframe();
    });
  }
});