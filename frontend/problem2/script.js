const tokenPricesURL = "https://interview.switcheo.com/prices.json";
const tokenIconBaseURL = "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";

let tokenPrices = {};

const els = {
  form: document.getElementById('swap-form'),
  globalError: document.getElementById('global-error'),
  globalErrorText: document.getElementById('global-error-text'),
  retryBtn: document.getElementById('retry-btn'),
  inputAmount: document.getElementById('input-amount'),
  inputCurrency: document.getElementById('input-currency'),
  inputIcon: document.getElementById('input-icon'),
  inputError: document.getElementById('input-error'),
  outputAmount: document.getElementById('output-amount'),
  outputCurrency: document.getElementById('output-currency'),
  outputIcon: document.getElementById('output-icon'),
  swapBtn: document.getElementById('swap-btn'),
  submitBtn: document.getElementById('submit-btn'),
  successMsg: document.getElementById('success-message'),
  rateDisplay: document.getElementById('rate-display'),
};

// Fetch token prices and populate dropdowns
async function loadPrices() {
  setLoading(true);
  hideGlobalError();

  try {
    const response = await fetch(tokenPricesURL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Store only the latest price for each token
    const latestPrices = {};
    data.forEach(({ currency, price, date }) => {
      if (!latestPrices[currency] || new Date(date) > new Date(latestPrices[currency].date)) {
        latestPrices[currency] = { price, date };
      }
    });

    tokenPrices = Object.fromEntries(
      Object.entries(latestPrices).map(([currency, value]) => [currency, value.price])
    );

    populateSelects();
    setLoading(false);
  } catch (error) {
    console.error("Failed to fetch token prices:", error);
    showGlobalError("Không tải được dữ liệu giá. Vui lòng kiểm tra kết nối và thử lại.");
  }
}

function setLoading(isLoading) {
  els.inputAmount.disabled = isLoading;
  els.inputCurrency.disabled = isLoading;
  els.outputCurrency.disabled = isLoading;
  els.swapBtn.disabled = isLoading;
  if (isLoading) {
    els.submitBtn.disabled = true;
  }
}

function showGlobalError(message) {
  els.globalErrorText.textContent = message;
  els.globalError.style.display = 'flex';
  // Keep controls disabled while there is no price data to work with.
  setLoading(true);
}

function hideGlobalError() {
  els.globalError.style.display = 'none';
}

function populateSelects() {
  const currencies = Object.keys(tokenPrices).sort();

  [els.inputCurrency, els.outputCurrency].forEach(select => {
    select.innerHTML = '<option value="" disabled selected>Select</option>';
    currencies.forEach(currency => {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      select.appendChild(option);
    });
  });
}

// Prevent picking the same token on both sides: grey out whichever currency
// is already selected on the opposite dropdown instead of letting the user
// submit a meaningless 1:1 "swap".
function refreshCurrencyOptions() {
  Array.from(els.inputCurrency.options).forEach(opt => {
    if (opt.value) opt.disabled = opt.value === els.outputCurrency.value;
  });
  Array.from(els.outputCurrency.options).forEach(opt => {
    if (opt.value) opt.disabled = opt.value === els.inputCurrency.value;
  });
}

function updateIcons() {
  const inputCurrency = els.inputCurrency.value;
  if (inputCurrency) {
    els.inputIcon.src = `${tokenIconBaseURL}/${inputCurrency}.svg`;
    els.inputIcon.style.display = 'block';
    els.inputIcon.onerror = () => { els.inputIcon.style.display = 'none'; };
  }

  const outputCurrency = els.outputCurrency.value;
  if (outputCurrency) {
    els.outputIcon.src = `${tokenIconBaseURL}/${outputCurrency}.svg`;
    els.outputIcon.style.display = 'block';
    els.outputIcon.onerror = () => { els.outputIcon.style.display = 'none'; };
  }
}

function calculateOutput() {
  const inputAmount = parseFloat(els.inputAmount.value);
  const inputCurrency = els.inputCurrency.value;
  const outputCurrency = els.outputCurrency.value;

  if (!inputCurrency || !outputCurrency) {
    els.rateDisplay.textContent = "";
    return;
  }

  if (inputCurrency === outputCurrency) {
    els.inputError.textContent = "Please choose two different tokens.";
    els.outputAmount.value = "";
    els.rateDisplay.textContent = "";
    els.submitBtn.disabled = true;
    return;
  }

  const inputPrice = tokenPrices[inputCurrency];
  const outputPrice = tokenPrices[outputCurrency];

  if (!inputPrice || !outputPrice) {
    els.inputError.textContent = "Price data unavailable for selected tokens.";
    els.rateDisplay.textContent = "";
    els.submitBtn.disabled = true;
    return;
  }

  // Show the exchange rate as soon as both tokens are picked, even before an amount is typed.
  const rate = inputPrice / outputPrice;
  els.rateDisplay.textContent = `1 ${inputCurrency} ≈ ${rate.toFixed(6)} ${outputCurrency}`;

  if (isNaN(inputAmount) || inputAmount <= 0) {
    els.inputError.textContent = "Please enter a valid amount.";
    els.outputAmount.value = "";
    els.submitBtn.disabled = true;
    return;
  }

  els.inputError.textContent = "";

  // Calculation: (inputAmount * inputPrice) / outputPrice
  const outputAmount = (inputAmount * inputPrice) / outputPrice;
  els.outputAmount.value = outputAmount.toFixed(6);

  els.submitBtn.disabled = false;
}

function swapCurrencies() {
  const temp = els.inputCurrency.value;
  els.inputCurrency.value = els.outputCurrency.value;
  els.outputCurrency.value = temp;

  refreshCurrencyOptions();
  updateIcons();
  calculateOutput();
}

function handleSwap(event) {
  event.preventDefault();
  const btn = els.submitBtn;
  btn.innerHTML = '<span class="spinner"></span> SWAPPING...';
  btn.disabled = true;

  // Simulate network delay
  setTimeout(() => {
    btn.innerHTML = 'CONFIRM SWAP';
    btn.disabled = false;
    els.successMsg.style.display = 'block';

    setTimeout(() => {
      els.successMsg.style.display = 'none';
    }, 3000);
  }, 1500);
}

function onCurrencyChange() {
  refreshCurrencyOptions();
  updateIcons();
  calculateOutput();
}

function bindEvents() {
  els.inputAmount.addEventListener('input', calculateOutput);
  els.inputCurrency.addEventListener('change', onCurrencyChange);
  els.outputCurrency.addEventListener('change', onCurrencyChange);
  els.swapBtn.addEventListener('click', swapCurrencies);
  els.form.addEventListener('submit', handleSwap);
  els.retryBtn.addEventListener('click', loadPrices);
}

bindEvents();
loadPrices();
