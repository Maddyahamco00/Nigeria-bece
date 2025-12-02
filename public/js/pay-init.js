document.addEventListener('DOMContentLoaded', () => {
  const payBtn = document.getElementById('payBtn');
  const alertBox = document.getElementById('alert');

  // Paystack public key exposed from server-rendered view
  const PAYSTACK_KEY = window.PAYSTACK_PUBLIC_KEY || '';

  // Prefill form from query params when redirected from registration
  const params = new URLSearchParams(window.location.search);
  const qName = params.get('name');
  const qEmail = params.get('email');
  const qGuardian = params.get('guardian');
  const qAmount = params.get('amount');
  const qSchoolId = params.get('schoolId');

  if (qName) document.getElementById('name').value = decodeURIComponent(qName);
  if (qEmail) document.getElementById('email').value = decodeURIComponent(qEmail);
  if (qGuardian) document.getElementById('guardian').value = decodeURIComponent(qGuardian);
  if (qAmount) document.getElementById('amount').value = decodeURIComponent(qAmount);
  if (qSchoolId) document.getElementById('schoolId').value = decodeURIComponent(qSchoolId);

  function showAlert(msg, type = 'danger') {
    alertBox.style.display = 'block';
    alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => { alertBox.style.display = 'none'; alertBox.innerHTML = ''; }, 6000);
  }

  payBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const amount = Number(document.getElementById('amount').value);
    const schoolId = document.getElementById('schoolId').value || undefined;

    if (!email || !amount) {
      showAlert('Please provide email and amount');
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Initializing...';

    try {
      const name = document.getElementById('name').value;
      const guardian = document.getElementById('guardian').value;

      const resp = await fetch('/payment/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount, name, guardian, metadata: { schoolId } })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to init payment');

      // If we have a Paystack public key, open the inline modal. Otherwise fall back to showing the hosted link.
      const reference = data.reference || (data.data && data.data.reference) || null;
      if (!PAYSTACK_KEY) {
        // fallback: show a safe link instead of automatically redirecting to hosted checkout
        showFallbackLink(data.authorization_url);
        return;
      }

      // Use Paystack inline modal
      try {
        const handler = PaystackPop.setup({
          key: PAYSTACK_KEY,
          email,
          amount: Math.round(Number(amount) * 100),
          ref: reference,
          metadata: {
            custom_fields: []
          },
          callback: async function(response) {
            // response.reference - verify with server, then redirect to registration
            payBtn.textContent = 'Verifying...';
            try {
              const verifyResp = await fetch('/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: response.reference })
              });
              const j = await verifyResp.json();
              if (!verifyResp.ok) throw new Error(j.error || 'Verification failed');
              // Redirect to registration (server provided the correct redirect URL)
               window.location.replace(j.redirectUrl || `/students/register?payment_ref=${encodeURIComponent(response.reference)}`);
              //  window.location.href = `/students/register?payment_ref=${encodeURIComponent(response.reference)}`;
            } catch (err) {
              console.error('Verification error', err);
              showAlert(err.message || 'Verification failed');
              payBtn.disabled = false;
              payBtn.textContent = 'Pay with Paystack (Test)';
            }
          },
          onClose: function() {
            showAlert('Payment window closed. You can try again.');
            payBtn.disabled = false;
            payBtn.textContent = 'Pay with Paystack (Test)';
          }
        });
        handler.openIframe();
      } catch (err) {
        console.error('Paystack inline error', err);
        // fallback: show a safe link to open in a new tab instead of forcing navigation
        if (data.authorization_url) showFallbackLink(data.authorization_url);
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Payment initialization failed');
      payBtn.disabled = false;
      payBtn.textContent = 'Pay with Paystack (Test)';
    }
  });

  function showFallbackLink(url) {
    alertBox.style.display = 'block';
    alertBox.innerHTML = `
      <div class="alert alert-warning">Inline checkout not available. <a href="${url}" target="_blank" rel="noopener">Open hosted checkout in new tab</a></div>
    `;
    payBtn.disabled = false;
    payBtn.textContent = 'Pay with Paystack (Test)';
  }
});
