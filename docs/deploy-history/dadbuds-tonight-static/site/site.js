const params = new URLSearchParams(window.location.search);
const referralCode = params.get("ref") || params.get("referral_code") || "BOYSOFSUMMER";

for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]) {
  for (const input of document.querySelectorAll(`[name="${key}"]`)) {
    input.value = key === "ref" ? referralCode : params.get(key) || "";
  }
}

const referralInput = document.querySelector(`[name="referral_code"]`);
if (referralInput) {
  referralInput.value = referralCode;
}

const email = params.get("email");
if (email) {
  const emailInput = document.querySelector(`[name="email"]`);
  if (emailInput) emailInput.value = email;
}

const notifyForm = document.querySelector(`form[name="dadbuds-notify"]`);
if (notifyForm && ["127.0.0.1", "localhost"].includes(window.location.hostname)) {
  notifyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(notifyForm);
    const emailValue = String(formData.get("email") || "");
    window.location.href = `/join/?email=${encodeURIComponent(emailValue)}&ref=${encodeURIComponent(referralCode)}`;
  });
}
