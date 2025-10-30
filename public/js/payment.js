  // public/js/payment.js
  /* document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("payment-form");
  const paymentButton = document.getElementById("payment-button");
  const errorDiv = document.getElementById("payment-error");

  if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      paymentButton.disabled = true;
      errorDiv.textContent = "";

      const email = document.getElementById("email").value;
      const amount = document.getElementById("amount").value;

      try {
        // 1️⃣ Initialize (local mode will send back success link)
        const initRes = await fetch("/payment/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, amount })
        });

        const { authorization_url, reference } = await initRes.json();

        if (authorization_url) {
          // ⚡ Local mode: directly redirect to success
          window.location.href = authorization_url;
        } else {
          errorDiv.textContent = "Payment init failed.";
          paymentButton.disabled = false;
        }

        // ====== Paystack real mode (disabled) ======
       
        const handler = PaystackPop.setup({
          key: "pk_test_459ec26b716655348ae00e8403393696999e59a0", 
          email,
          amount: amount * 100,
          ref: reference,
          onClose: () => {
            errorDiv.textContent = "Payment was cancelled.";
            paymentButton.disabled = false;
          },
          callback: async (response) => {
            const verifyRes = await fetch("/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: response.reference })
            });

            const data = await verifyRes.json();
            if (data.status === "success") {
              window.location.href = `/payment/success?code=${data.code}`;
            } else {
              errorDiv.textContent = "Payment verification failed.";
              paymentButton.disabled = false;
            }
          }
        });
        handler.openIframe();
        
      } catch (err) {
        console.error(err);
        errorDiv.textContent = "Payment initialization failed.";
        paymentButton.disabled = false;
      }
    });
  }
});
*/