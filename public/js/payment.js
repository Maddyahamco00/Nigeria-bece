// public/js/payment.js
document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("payment-form");
  const paymentButton = document.getElementById("payment-button");
  const errorDiv = document.getElementById("payment-error");

  // Use public key exposed by the view if available
  const PAYSTACK_KEY = window.PAYSTACK_PUBLIC_KEY || '';
  
  console.log('Payment script loaded, Paystack key:', PAYSTACK_KEY ? 'Available' : 'Missing');

  if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      paymentButton.disabled = true;
      paymentButton.textContent = 'Processing...';
      errorDiv.textContent = "";

      const email = document.getElementById("email").value;
      const amount = document.getElementById("amount").value;
      
      if (!email || !amount) {
        errorDiv.textContent = 'Please fill in all fields';
        paymentButton.disabled = false;
        paymentButton.textContent = 'Pay Now';
        return;
      }

      try {
        // Initialize on server
        const initRes = await fetch("/payment/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, amount })
        });
        
        if (!initRes.ok) {
          throw new Error(`HTTP ${initRes.status}: ${initRes.statusText}`);
        }

        const initData = await initRes.json();
        console.log('Init response:', initData);
        
        if (initData.error) {
          throw new Error(initData.error);
        }

        const { authorization_url, reference } = initData;

        // If inline key is available and we have a reference, use inline modal
        if (PAYSTACK_KEY && reference) {
          const handler = PaystackPop.setup({
            key: PAYSTACK_KEY,
            email,
            amount: Math.round(Number(amount) * 100),
            ref: reference,
            onClose: () => {
              errorDiv.textContent = "Payment was cancelled.";
              paymentButton.disabled = false;
              paymentButton.textContent = 'Pay Now';
            },
            callback: async (response) => {
              try {
                console.log('Payment callback:', response);
                const verifyRes = await fetch("/payment/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reference: response.reference })
                });
                
                const data = await verifyRes.json();
                console.log('Verify response:', data);
                
                if (data.ok && data.redirectUrl) {
                  window.location.href = data.redirectUrl;
                } else if (data.status === "success") {
                  window.location.href = `/success?reference=${response.reference}`;
                } else {
                  throw new Error(data.error || 'Verification failed');
                }
              } catch (err) {
                console.error('Verification error', err);
                errorDiv.textContent = 'Payment verification failed: ' + err.message;
                paymentButton.disabled = false;
                paymentButton.textContent = 'Pay Now';
              }
            }
          });
          handler.openIframe();
          return;
        }

        // Fallback: redirect to hosted checkout
        if (authorization_url) {
          window.location.href = authorization_url;
          return;
        }

        throw new Error('No payment method available');

      } catch (err) {
        console.error('Payment error:', err);
        errorDiv.textContent = "Payment failed: " + err.message;
        paymentButton.disabled = false;
        paymentButton.textContent = 'Pay Now';
      }
    });
  }
});