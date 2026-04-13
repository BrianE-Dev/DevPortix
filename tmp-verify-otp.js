const url = "http://localhost:5500/api/auth/verify-otp";
const payload = {
  email: "test+copilot20260413@mailinator.com",
  otp: "343584",
};

(async () => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("STATUS", res.status);
    const text = await res.text();
    console.log("BODY", text);
  } catch (error) {
    console.error("ERROR", error);
    process.exit(1);
  }
})();
