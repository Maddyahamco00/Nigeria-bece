  // public/js/payment.js
document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("payment-form");
  const paymentButton = document.getElementById("payment-button");
  const errorDiv = document.getElementById("payment-error");

  // Use public key exposed by the view if available
  const PAYSTACK_KEY = window.PAYSTACK_PUBLIC_KEY || '';

  if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      paymentButton.disabled = true;
      errorDiv.textContent = "";

      const email = document.getElementById("email").value;
      const amount = document.getElementById("amount").value;

      try {
        // Initialize on server
        const initRes = await fetch("/payment/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, amount })
        });

        const { authorization_url, reference } = await initRes.json();

        // If inline key is available, use inline modal
        if (PAYSTACK_KEY && reference) {
          const handler = PaystackPop.setup({
            key: PAYSTACK_KEY,
            email,
            amount: Math.round(Number(amount) * 100),
            ref: reference,
            onClose: () => {
              errorDiv.textContent = "Payment was cancelled.";
              paymentButton.disabled = false;
            },
            callback: async (response) => {
              try {
                const verifyRes = await fetch("/payment/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reference: response.reference })
                });
                const data = await verifyRes.json();
                if (data.status === "success") {
                  window.location.href = `/payment/success?code=${data.code}`;
                } else if (data.ok && data.redirectUrl) {
                  window.location.href = data.redirectUrl;
                } else {
                  throw new Error('Verification failed');
                }
              } catch (err) {
                console.error('Verification error', err);
                errorDiv.textContent = 'Payment verification failed.';
                paymentButton.disabled = false;
              }
            }
          });
          handler.openIframe();
          return;
        }

        // Fallback: if server returned a hosted authorization_url, present a safe link
        if (authorization_url) {
          // errorDiv.innerHTML = `Inline checkout unavailable. <a href="${authorization_url}" target="_blank" rel="noopener">Open hosted checkout in a new tab</a>`;
          // paymentButton.disabled = false;
           window.location.href = authorization_url;
          return;
        }

        errorDiv.textContent = "Payment init failed.";
        paymentButton.disabled = false;

      } catch (err) {
        console.error(err);
        errorDiv.textContent = "Payment initialization failed.";
        paymentButton.disabled = false;
      }
    });
  }
});