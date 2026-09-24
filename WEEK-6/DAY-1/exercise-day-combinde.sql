<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Currency Converter</title>
<style>
  body {
    font-family: Arial, sans-serif;
    max-width: 480px;
    margin: 60px auto;
    padding: 0 20px;
  }
  h1 {
    font-size: 1.4rem;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  select, input {
    padding: 8px;
    font-size: 1rem;
    flex: 1;
  }
  button {
    padding: 10px 16px;
    font-size: 1rem;
    cursor: pointer;
  }
  #switchBtn {
    display: block;
    margin: 0 auto 16px;
  }
  #result {
    margin-top: 20px;
    font-size: 1.2rem;
    font-weight: bold;
  }
  #error {
    color: crimson;
  }
</style>
</head>
<body>

  <h1>Currency Converter</h1>

  <div class="row">
    <input type="number" id="amount" value="1" min="0" step="any">
  </div>

  <div class="row">
    <select id="fromCurrency"></select>
    <button id="switchBtn" type="button" title="Swap currencies">⇄</button>
    <select id="toCurrency"></select>
  </div>

  <button id="convertBtn" type="button">Convert</button>

  <p id="result"></p>
  <p id="error"></p>

  <script>
    // 1. Put your own API key here (sign up at https://app.exchangerate-api.com/sign-up)
    const API_KEY = "YOUR_API_KEY_HERE";
    const BASE_URL = "https://v6.exchangerate-api.com/v6";

    const fromSelect = document.getElementById("fromCurrency");
    const toSelect = document.getElementById("toCurrency");
    const amountInput = document.getElementById("amount");
    const resultEl = document.getElementById("result");
    const errorEl = document.getElementById("error");

    // Hardcoded ISO 4217 codes — same set the Supported Codes endpoint returns.
    // Used as an instant fallback so the dropdowns are usable even before/without
    // a successful API call (e.g. no key yet, offline, rate-limited).
    const FALLBACK_CODES = [
      ["USD","United States Dollar"], ["EUR","Euro"], ["GBP","British Pound Sterling"],
      ["JPY","Japanese Yen"], ["AUD","Australian Dollar"], ["CAD","Canadian Dollar"],
      ["CHF","Swiss Franc"], ["CNY","Chinese Renminbi"], ["HKD","Hong Kong Dollar"],
      ["NZD","New Zealand Dollar"], ["SEK","Swedish Krona"], ["KRW","South Korean Won"],
      ["SGD","Singapore Dollar"], ["NOK","Norwegian Krone"], ["MXN","Mexican Peso"],
      ["INR","Indian Rupee"], ["RUB","Russian Ruble"], ["ZAR","South African Rand"],
      ["TRY","Turkish Lira"], ["BRL","Brazilian Real"], ["TWD","New Taiwan Dollar"],
      ["DKK","Danish Krone"], ["PLN","Polish Zloty"], ["THB","Thai Baht"],
      ["IDR","Indonesian Rupiah"], ["HUF","Hungarian Forint"], ["CZK","Czech Koruna"],
      ["ILS","Israeli New Shekel"], ["CLP","Chilean Peso"], ["PHP","Philippine Peso"],
      ["AED","UAE Dirham"], ["COP","Colombian Peso"], ["SAR","Saudi Riyal"],
      ["MYR","Malaysian Ringgit"], ["RON","Romanian Leu"], ["ARS","Argentine Peso"],
      ["VND","Vietnamese Dong"], ["EGP","Egyptian Pound"], ["NGN","Nigerian Naira"],
      ["KES","Kenyan Shilling"], ["PKR","Pakistani Rupee"], ["BDT","Bangladeshi Taka"],
      ["UAH","Ukrainian Hryvnia"], ["QAR","Qatari Riyal"], ["KWD","Kuwaiti Dinar"],
      ["BHD","Bahraini Dinar"], ["OMR","Omani Rial"], ["JOD","Jordanian Dinar"],
      ["MAD","Moroccan Dirham"], ["DZD","Algerian Dinar"], ["TND","Tunisian Dinar"],
      ["GHS","Ghanaian Cedi"], ["ETB","Ethiopian Birr"], ["UGX","Ugandan Shilling"],
      ["TZS","Tanzanian Shilling"], ["ISK","Icelandic Krona"], ["BGN","Bulgarian Lev"],
      ["HRK","Croatian Kuna"], ["RSD","Serbian Dinar"]
    ];

    function populateDropdowns(codes) {
      fromSelect.innerHTML = "";
      toSelect.innerHTML = "";

      codes.forEach(([code, name]) => {
        const optionFrom = document.createElement("option");
        optionFrom.value = code;
        optionFrom.textContent = `${code} - ${name}`;
        fromSelect.appendChild(optionFrom);

        const optionTo = document.createElement("option");
        optionTo.value = code;
        optionTo.textContent = `${code} - ${name}`;
        toSelect.appendChild(optionTo);
      });

      fromSelect.value = "USD";
      toSelect.value = "EUR";
    }

    // 2. Fetch supported currency codes and populate the dropdowns.
    // Falls back to the hardcoded FALLBACK_CODES list if the API call fails
    // (e.g. missing/invalid key, offline, rate limit).
    async function loadSupportedCurrencies() {
      // Populate immediately from the hardcoded list so the UI is usable right away
      populateDropdowns(FALLBACK_CODES);

      try {
        const response = await fetch(`${BASE_URL}/${API_KEY}/codes`);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.result !== "success") {
          throw new Error("API did not return a successful result");
        }

        // data.supported_codes is an array like [["USD", "United States Dollar"], ...]
        // Replace the fallback list with the live, authoritative list from the API
        populateDropdowns(data.supported_codes);

      } catch (err) {
        errorEl.textContent =
          `Using offline currency list — live codes could not be loaded (${err.message})`;
      }
    }

    // 3. Fetch the pair conversion rate and display the converted amount
    async function convertCurrency() {
      errorEl.textContent = "";
      resultEl.textContent = "Converting...";

      const from = fromSelect.value;
      const to = toSelect.value;
      const amount = amountInput.value || 1;

      try {
        const response = await fetch(
          `${BASE_URL}/${API_KEY}/pair/${from}/${to}/${amount}`
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.result !== "success") {
          throw new Error("API did not return a successful result");
        }

        resultEl.textContent =
          `${amount} ${from} = ${data.conversion_result} ${to} ` +
          `(rate: 1 ${from} = ${data.conversion_rate} ${to})`;

      } catch (err) {
        resultEl.textContent = "";
        errorEl.textContent = `Conversion failed: ${err.message}`;
      }
    }

    // 4. Bonus: swap the two currencies and re-run the conversion
    function swapCurrencies() {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      convertCurrency();
    }

    document.getElementById("convertBtn").addEventListener("click", convertCurrency);
    document.getElementById("switchBtn").addEventListener("click", swapCurrencies);

    // Kick things off
    loadSupportedCurrencies();
  </script>

</body>
</html>