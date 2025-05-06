document.addEventListener('DOMContentLoaded', () => {

    const addRentalButton = document.getElementById('add-rental-button');
    const rentalModal = document.getElementById('add-rental-modal');
    const closeRentalModalButton = document.getElementById('close-rental-modal');
    const addRentalForm = document.getElementById('add-rental-form');
    const rentalTimeSelect = document.getElementById('rental-time');
    const rentalTotalDisplay = document.getElementById('rental-total-display');
    const transactionListContainer = document.getElementById('transaction-list-container');
    const filterFutbolButton = document.getElementById('filter-futbol');
    const filterBasquetbolButton = document.getElementById('filter-basquetbol');
    const filterAllButton = document.getElementById('filter-all');
    const customerNameInput = document.getElementById('customer-name');
    const paymentTypeSelect = document.getElementById('payment-type');
    const courtNumberSelect = document.getElementById('court-number');
    const sportTypeSelect = document.getElementById('sport-type');
    const startDateTimeInput = document.getElementById('start-datetime');
    const resetAppButton = document.getElementById('reset-app-button');

    const capitalizationCard = document.getElementById('capitalization-card');
    const capitalizationTotalEl = document.getElementById('capitalization-total');
    const maintenanceTotalEl = document.getElementById('maintenance-total');
    const servicesCountEl = document.getElementById('services-count');
    const starServiceNameEl = document.getElementById('star-service-name');
    const starServicePercentageEl = document.getElementById('star-service-percentage');
    const goalAmountDisplayEl = document.getElementById('goal-amount-display');
    const goalSubtitleEl = document.getElementById('goal-subtitle');
    const goalIconEl = document.getElementById('goal-icon');
    const goalTitleEl = document.getElementById('goal-title');
    const goalProgressBarEl = document.getElementById('goal-progress-bar');
    const goalCardEl = document.getElementById('goal-card');
    const maintenanceCardEl = document.getElementById('maintenance-card');

    const maintenanceModal = document.getElementById('add-maintenance-modal');
    const closeMaintenanceModalButton = document.getElementById('close-maintenance-modal');
    const addMaintenanceForm = document.getElementById('add-maintenance-form');
    const expenseDescriptionInput = document.getElementById('expense-description');
    const expenseAmountInput = document.getElementById('expense-amount');

    const goalModal = document.getElementById('set-goal-modal');
    const closeGoalModalButton = document.getElementById('close-goal-modal');
    const setGoalForm = document.getElementById('set-goal-form');
    const goalAmountInput = document.getElementById('goal-amount-input');

    const resetConfirmationModal = document.getElementById('reset-confirmation-modal');
    const closeResetModalButton = document.getElementById('close-reset-modal');
    const confirmResetButton = document.getElementById('confirm-reset-button');
    const cancelResetButton = document.getElementById('cancel-reset-button');

    const showPricesFab = document.getElementById('show-prices-fab');
    const pricingModal = document.getElementById('pricing-modal');
    const closePricingModalButton = document.getElementById('close-pricing-modal');

    const currencyModal = document.getElementById('currency-modal');
    const closeCurrencyModalButton = document.getElementById('close-currency-modal');
    const selectUsdButton = document.getElementById('select-usd-button');
    const selectGtqButton = document.getElementById('select-gtq-button');
    const exchangeRateInfoEl = document.getElementById('exchange-rate-info');
    const currencyIndicatorCapEl = document.getElementById('currency-indicator-cap');

    const RENTAL_PRICES_USD = { "0.5": 12, "1": 18, "1.5": 24, "2": 30 };
    const RENTALS_KEY = 'pmsRentals_v2';
    const EXPENSES_KEY = 'pmsMaintenanceExpenses_v2';
    const GOAL_KEY = 'pmsGoalAmount_v2';
    const CURRENCY_PREF_KEY = 'pmsCurrencyPref_v2';
    const EXCHANGE_RATE_KEY = 'pmsExchangeRate_v2';
    const STATUS_UPDATE_INTERVAL = 30000;
    const API_KEY = "YOUR_API_KEY_HERE";
    const FALLBACK_RATE_USD_GTQ = 7.80;

    let rentals = [];
    let maintenanceExpenses = [];
    let goalAmountUSD = 0;
    let currentlyDisplayedRentals = [];
    let currentCurrency = 'USD';
    let exchangeRateUSDtoGTQ = FALLBACK_RATE_USD_GTQ;
    let lastRateFetchTime = 0;
    const RATE_CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

    const loadCurrencyPreference = () => {
        const storedCurrency = localStorage.getItem(CURRENCY_PREF_KEY);
        currentCurrency = storedCurrency === 'GTQ' ? 'GTQ' : 'USD';
        const storedRateData = localStorage.getItem(EXCHANGE_RATE_KEY);
        if (storedRateData) {
            try {
                const { rate, timestamp } = JSON.parse(storedRateData);
                if (rate && timestamp && (Date.now() - timestamp < RATE_CACHE_DURATION)) {
                    exchangeRateUSDtoGTQ = parseFloat(rate);
                    lastRateFetchTime = timestamp;
                }
            } catch (error) {
                console.error("Error parsing stored exchange rate:", error);
            }
        }
    };

    const saveCurrencyPreference = () => {
        localStorage.setItem(CURRENCY_PREF_KEY, currentCurrency);
    };

    const saveExchangeRate = () => {
        const rateData = JSON.stringify({ rate: exchangeRateUSDtoGTQ, timestamp: Date.now() });
        localStorage.setItem(EXCHANGE_RATE_KEY, rateData);
    };

    const fetchExchangeRate = async () => {
        if (Date.now() - lastRateFetchTime < RATE_CACHE_DURATION && lastRateFetchTime !== 0) {
             updateUIForCurrency();
             return;
        }
        if (API_KEY === "YOUR_API_KEY_HERE") {
            console.warn("Using fallback exchange rate. Add API key for real-time rates.");
             exchangeRateUSDtoGTQ = FALLBACK_RATE_USD_GTQ;
             updateUIForCurrency();
             return;
        }

        const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.result === 'success' && data.conversion_rates && data.conversion_rates.GTQ) {
                exchangeRateUSDtoGTQ = parseFloat(data.conversion_rates.GTQ);
                lastRateFetchTime = Date.now();
                saveExchangeRate();
                console.log("Exchange rate updated:", exchangeRateUSDtoGTQ);
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            console.error("Error fetching exchange rate:", error);
            console.warn("Using potentially stale or fallback exchange rate:", exchangeRateUSDtoGTQ);
        } finally {
             updateUIForCurrency();
        }
    };

    const convertAmount = (amountUSD, toCurrency) => {
        if (toCurrency === 'USD') return amountUSD;
        if (toCurrency === 'GTQ') return amountUSD * exchangeRateUSDtoGTQ;
        return amountUSD;
    };

    const convertAmountToUSD = (amount, fromCurrency) => {
        if (fromCurrency === 'USD') return amount;
        if (fromCurrency === 'GTQ') return amount / exchangeRateUSDtoGTQ;
        return amount;
    };

    const getCurrencySymbol = (currency) => (currency === 'GTQ' ? 'Q' : '$');

    const formatCurrencyDisplay = (amount, currency) => {
        const symbol = getCurrencySymbol(currency);
        const value = amount.toFixed(2);
        return `${symbol}${value}`;
    };

    const updateAllSymbols = () => {
        const symbol = getCurrencySymbol(currentCurrency);
        document.querySelectorAll('.symbol').forEach(span => {
            if (!span.classList.contains('percent-sign')) {
                span.textContent = symbol;
            }
        });
        document.getElementById('capitalization-icon').className = currentCurrency === 'GTQ' ? 'fa-solid fa-coins' : 'fa-solid fa-dollar-sign';
        currencyIndicatorCapEl.textContent = `(${currentCurrency})`;
    };

    const updatePricingModal = () => {
         document.querySelectorAll('.price-card').forEach(card => {
             const basePriceUSD = parseFloat(card.dataset.basePrice);
             const displayPrice = convertAmount(basePriceUSD, currentCurrency);
             card.querySelector('.price-value').textContent = displayPrice.toFixed(2);
         });
    };

     const updateInputLabels = () => {
        const symbol = getCurrencySymbol(currentCurrency);
        document.querySelectorAll('.maintenance-input-symbol, .goal-input-symbol').forEach(el => {
            el.textContent = symbol;
        });
    };

    const updateUIForCurrency = () => {
        updateAllSymbols();
        updateDashboard();
        renderTransactionList();
        updatePricingModal();
        calculatePrice();
        updateInputLabels();
        exchangeRateInfoEl.textContent = `Tasa actual: 1 USD = ${exchangeRateUSDtoGTQ.toFixed(4)} GTQ`;
        selectUsdButton.classList.toggle('active', currentCurrency === 'USD');
        selectGtqButton.classList.toggle('active', currentCurrency === 'GTQ');
    };

    const loadData = () => {
        const storedRentals = localStorage.getItem(RENTALS_KEY);
        const storedExpenses = localStorage.getItem(EXPENSES_KEY);
        const storedGoal = localStorage.getItem(GOAL_KEY);
        try {
            rentals = storedRentals ? JSON.parse(storedRentals) : [];
            rentals.forEach(rental => {
                if (rental.startTime && !(rental.startTime instanceof Date)) {
                    rental.startTime = new Date(rental.startTime);
                }
                if (rental.endTime && !(rental.endTime instanceof Date)) {
                    rental.endTime = new Date(rental.endTime);
                }
                if (!rental.status) {
                    rental.status = 'Pendiente';
                }
                if (typeof rental.totalUSD !== 'number') { rental.totalUSD = rental.total || 0; }
            });
        } catch (error) {
            console.error("Error parsing rentals:", error); rentals = [];
        }
        try {
            maintenanceExpenses = storedExpenses ? JSON.parse(storedExpenses) : [];
            maintenanceExpenses.forEach(expense => {
                if (typeof expense.amountUSD !== 'number') { expense.amountUSD = expense.amount || 0; }
            });
        } catch (error) {
            console.error("Error parsing expenses:", error); maintenanceExpenses = [];
        }
        goalAmountUSD = storedGoal ? parseFloat(storedGoal) : 0;
        if (isNaN(goalAmountUSD)) goalAmountUSD = 0;
        currentlyDisplayedRentals = [...rentals];
    };

    const saveData = () => {
        try {
            localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
            localStorage.setItem(EXPENSES_KEY, JSON.stringify(maintenanceExpenses));
            localStorage.setItem(GOAL_KEY, goalAmountUSD.toString());
        } catch (error) {
            console.error("Error saving data:", error); alert("Error al guardar datos.");
        }
    };

    const calculatePrice = () => {
         const selectedTime = rentalTimeSelect.value;
         const priceUSD = RENTAL_PRICES_USD[selectedTime] || 0;
         const displayPrice = convertAmount(priceUSD, currentCurrency);
         rentalTotalDisplay.innerHTML = `<span class="symbol rental-symbol">${getCurrencySymbol(currentCurrency)}</span>${displayPrice.toFixed(2)}`;
    };

    const calculateCapitalizationTotalUSD = () => rentals.reduce((sum, rental) => sum + (rental.totalUSD || 0), 0);
    const calculateMaintenanceTotalUSD = () => maintenanceExpenses.reduce((sum, expense) => sum + (expense.amountUSD || 0), 0);

    const calculateStarService = () => {
        if (rentals.length === 0) return { name: 'N/A', percentage: 0 };
        const counts = rentals.reduce((acc, rental) => {
            acc[rental.sport] = (acc[rental.sport] || 0) + 1; return acc;
        }, {});
        let starSport = 'N/A'; let maxCount = 0; let tie = false;
        for (const sport in counts) {
            if (counts[sport] > maxCount) {
                maxCount = counts[sport]; starSport = sport; tie = false;
            } else if (counts[sport] === maxCount && maxCount > 0) {
                 if (!tie) { starSport += ' / ' + sport; tie = true; } else { starSport += ' / ' + sport; }
            }
        }
        const percentage = rentals.length > 0 ? Math.round((maxCount / rentals.length) * 100) : 0;
        return { name: starSport, percentage };
    };

    const updateDashboard = () => {
        const capitalizationTotalUSD = calculateCapitalizationTotalUSD();
        const maintenanceTotalUSD = calculateMaintenanceTotalUSD();
        const servicesCount = rentals.length;
        const starService = calculateStarService();
        const netProfitUSD = capitalizationTotalUSD - maintenanceTotalUSD;

        capitalizationTotalEl.textContent = convertAmount(capitalizationTotalUSD, currentCurrency).toFixed(2);
        maintenanceTotalEl.textContent = convertAmount(maintenanceTotalUSD, currentCurrency).toFixed(2);
        servicesCountEl.textContent = servicesCount;
        starServiceNameEl.textContent = starService.name;
        starServicePercentageEl.innerHTML = `${starService.percentage}<span class="symbol percent-sign">%</span>`;
        goalAmountDisplayEl.textContent = convertAmount(goalAmountUSD, currentCurrency).toFixed(2);

        goalCardEl.classList.remove('goal-status-not-reached', 'goal-status-reached', 'goal-status-exceeded');
        let goalStatusText = "Establece una meta"; let progressPercent = 0;

        if (goalAmountUSD > 0) {
            const displayGoal = convertAmount(goalAmountUSD, currentCurrency);
            const displayNetProfit = convertAmount(netProfitUSD, currentCurrency);
            const displayDiff = convertAmount(Math.abs(goalAmountUSD - netProfitUSD), currentCurrency);

            if (netProfitUSD >= goalAmountUSD) {
                progressPercent = 100;
                 if (netProfitUSD > goalAmountUSD) {
                      goalCardEl.classList.add('goal-status-exceeded');
                      goalStatusText = `Meta superada por ${formatCurrencyDisplay(displayDiff, currentCurrency)}`;
                 } else {
                      goalCardEl.classList.add('goal-status-reached');
                      goalStatusText = "¡Meta alcanzada!";
                 }
            } else {
                goalCardEl.classList.add('goal-status-not-reached');
                goalStatusText = `Faltan ${formatCurrencyDisplay(displayDiff, currentCurrency)} para la meta`;
                progressPercent = Math.max(0, Math.floor((netProfitUSD / goalAmountUSD) * 100));
            }
        } else {
            goalCardEl.classList.add('goal-status-not-reached');
        }
        goalSubtitleEl.textContent = goalStatusText;
        goalProgressBarEl.style.width = `${progressPercent}%`;
    };

    const formatDateForDisplay = (date) => {
        if (!(date instanceof Date) || isNaN(date)) return 'Fecha inválida';
        const optionsDate = { month: 'long', day: 'numeric' };
        const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: false };
        const dateString = date.toLocaleDateString('es-ES', optionsDate);
        const timeString = date.toLocaleTimeString('es-ES', optionsTime);
        const capitalizedDateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        return `${capitalizedDateString} - ${timeString}`;
    };

    const formatDateRangeForDisplay = (start, end) => {
        const startValid = start instanceof Date && !isNaN(start);
        const endValid = end instanceof Date && !isNaN(end);
        if (!startValid) return 'Fecha de inicio inválida';
        if (!endValid) return `Inicia: ${formatDateForDisplay(start)} (Fin pend.)`;
        const optionsDate = { month: 'short', day: 'numeric' };
        const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
        const startDateStr = start.toLocaleDateString('es-ES', optionsDate);
        const startTimeStr = start.toLocaleTimeString('es-ES', optionsTime).replace(/\./g, '');
        const endTimeStr = end.toLocaleTimeString('es-ES', optionsTime).replace(/\./g, '');
        const parts = startDateStr.split(' ');
        const capitalizedDateStr = parts.length > 1 ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + ' ' + parts[1] : startDateStr;
        return `${capitalizedDateStr} - De ${startTimeStr} A ${endTimeStr}`;
    };

    const renderTransactionList = (rentalsToRender = currentlyDisplayedRentals) => {
        transactionListContainer.innerHTML = '';
        const sortedRentals = [...rentalsToRender].sort((a, b) => {
            const dateA = (a.startTime instanceof Date && !isNaN(a.startTime)) ? a.startTime : new Date(0);
            const dateB = (b.startTime instanceof Date && !isNaN(b.startTime)) ? b.startTime : new Date(0);
            return dateB - dateA;
        });
        if (sortedRentals.length === 0) {
            transactionListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px 0;">No hay alquileres registrados.</p>';
            return;
        }
        sortedRentals.forEach(rental => {
            const item = document.createElement('div');
            item.classList.add('transaction-item');
            const id = rental.id ? rental.id.toString().slice(-6) : 'N/A';
            const sport = rental.sport || '?';
            const courtNumber = rental.courtNumber || '?';
            const totalUSD = typeof rental.totalUSD === 'number' ? rental.totalUSD : 0;
            const displayTotal = convertAmount(totalUSD, currentCurrency);
            const paymentType = rental.paymentType || '?';
            const customerName = rental.customerName || 'N/A';
            const status = rental.status || 'Desconocido';
            let endTime = rental.endTime;
            if (!(endTime instanceof Date) || isNaN(endTime)) {
                const durationHours = parseFloat(rental.time);
                if (rental.startTime instanceof Date && !isNaN(rental.startTime) && !isNaN(durationHours)) {
                    endTime = new Date(rental.startTime.getTime() + durationHours * 60 * 60 * 1000);
                } else { endTime = null; }
            }
            const dateRangeStr = formatDateRangeForDisplay(rental.startTime, endTime);
            let statusClass = '';
            switch (status.toLowerCase()) {
                case 'pendiente': statusClass = 'status-pendiente'; break;
                case 'en curso': statusClass = 'status-en-curso'; break;
                case 'finalizado': statusClass = 'status-finalizado'; break;
            }
            item.innerHTML = `
                <div class="transaction-info">
                    <span class="transaction-id">ID: ${id}</span>
                    <span class="transaction-type">${sport} (Cancha ${courtNumber})</span>
                    <span class="transaction-date">${dateRangeStr}</span>
                    <span class="transaction-status ${statusClass}">${status}</span>
                </div>
                <div class="transaction-details">
                    <span class="transaction-amount">${formatCurrencyDisplay(displayTotal, currentCurrency)}</span>
                    <span class="transaction-method">${paymentType}</span>
                    <span class="transaction-customer">${customerName}</span>
                </div>`;
            transactionListContainer.appendChild(item);
        });
    };

    const updateRentalStatuses = () => {
        const now = new Date(); let changed = false;
        rentals.forEach(rental => {
            if (!(rental.startTime instanceof Date) || isNaN(rental.startTime)) return;
            let endTime = rental.endTime;
            if (!(endTime instanceof Date) || isNaN(endTime)) {
                const durationHours = parseFloat(rental.time);
                if (!isNaN(durationHours)) { endTime = new Date(rental.startTime.getTime() + durationHours * 60 * 60 * 1000); }
                else { return; }
            }
            const currentStatus = rental.status; let newStatus = currentStatus;
            if (now >= endTime) newStatus = 'Finalizado';
            else if (now >= rental.startTime) newStatus = 'En curso';
            else newStatus = 'Pendiente';
            if (newStatus !== currentStatus) { rental.status = newStatus; changed = true; }
        });
        if (changed) { saveData(); renderTransactionList(); }
    };

    const openModal = (modalElement) => {
        if (modalElement) { modalElement.classList.add('visible'); }
    };
    const closeModal = (modalElement) => {
        if (modalElement) { modalElement.classList.remove('visible'); }
    };

    const handleAddRentalSubmit = (event) => {
        event.preventDefault();
        const customerName = customerNameInput.value.trim();
        const time = rentalTimeSelect.value;
        const paymentType = paymentTypeSelect.value;
        const courtNumber = courtNumberSelect.value;
        const sport = sportTypeSelect.value;
        const startTimeString = startDateTimeInput.value;
        if (!customerName || !time || !paymentType || !courtNumber || !sport || !startTimeString) {
            alert('Por favor, complete todos los campos obligatorios.'); return;
        }
        const startTime = new Date(startTimeString);
        if (isNaN(startTime)) { alert('La fecha y hora de inicio no son válidas.'); return; }
        const totalUSD = RENTAL_PRICES_USD[time] || 0;
        const durationHours = parseFloat(time);
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
        const newRental = { id: Date.now(), customerName, time, totalUSD, paymentType, courtNumber, sport, startTime, endTime, status: 'Pendiente' };
        rentals.push(newRental);
        currentlyDisplayedRentals = [...rentals];
        saveData(); updateRentalStatuses(); updateDashboard(); renderTransactionList();
        addRentalForm.reset(); rentalTimeSelect.selectedIndex = 0; paymentTypeSelect.selectedIndex = 0; courtNumberSelect.selectedIndex = 0; sportTypeSelect.selectedIndex = 0;
        calculatePrice();
        closeModal(rentalModal);
    };

     const handleAddMaintenanceSubmit = (event) => {
        event.preventDefault();
        const description = expenseDescriptionInput.value.trim();
        const amountInput = parseFloat(expenseAmountInput.value);
        if (!description || isNaN(amountInput) || amountInput <= 0) {
            alert('Por favor, ingrese una descripción y un monto válido para el gasto.'); return;
        }
        const amountUSD = convertAmountToUSD(amountInput, currentCurrency);
        const newExpense = { id: Date.now(), description, amountUSD };
        maintenanceExpenses.push(newExpense);
        saveData(); updateDashboard(); addMaintenanceForm.reset(); closeModal(maintenanceModal);
     };

     const handleSetGoalSubmit = (event) => {
        event.preventDefault();
        const amountInput = parseFloat(goalAmountInput.value);
        if (isNaN(amountInput) || amountInput < 0) {
             alert('Por favor, ingrese un monto de meta válido (0 o mayor).'); return;
        }
        goalAmountUSD = convertAmountToUSD(amountInput, currentCurrency);
        saveData(); updateDashboard(); setGoalForm.reset(); closeModal(goalModal);
     };

    const filterTransactions = (sportType) => {
        const filtered = rentals.filter(rental => rental.sport === sportType);
        currentlyDisplayedRentals = filtered;
        renderTransactionList();
    };

    const showAllTransactions = () => {
        currentlyDisplayedRentals = [...rentals]; renderTransactionList();
    };

    const performReset = () => {
         rentals = []; maintenanceExpenses = []; goalAmountUSD = 0; currentlyDisplayedRentals = [];
         saveData(); updateDashboard(); renderTransactionList();
         closeModal(resetConfirmationModal);
         alert("Aplicación reseteada.");
    };

    const handleCurrencyChange = (newCurrency) => {
        if (newCurrency !== currentCurrency) {
             currentCurrency = newCurrency;
             saveCurrencyPreference();
             updateUIForCurrency();
        }
        closeModal(currencyModal);
    }

    addRentalButton.addEventListener('click', () => {
        addRentalForm.reset(); rentalTimeSelect.selectedIndex = 0; paymentTypeSelect.selectedIndex = 0;
        courtNumberSelect.selectedIndex = 0; sportTypeSelect.selectedIndex = 0;
        calculatePrice();
        openModal(rentalModal); customerNameInput.focus();
    });
    closeRentalModalButton.addEventListener('click', () => closeModal(rentalModal));
    addRentalForm.addEventListener('submit', handleAddRentalSubmit);
    rentalModal.addEventListener('click', (event) => { if (event.target === rentalModal) closeModal(rentalModal); });

    maintenanceCardEl.addEventListener('click', () => {
        addMaintenanceForm.reset();
        updateInputLabels();
        openModal(maintenanceModal); expenseDescriptionInput.focus();
    });
    closeMaintenanceModalButton.addEventListener('click', () => closeModal(maintenanceModal));
    addMaintenanceForm.addEventListener('submit', handleAddMaintenanceSubmit);
    maintenanceModal.addEventListener('click', (event) => { if (event.target === maintenanceModal) closeModal(maintenanceModal); });

     goalCardEl.addEventListener('click', () => {
         const displayGoal = convertAmount(goalAmountUSD, currentCurrency);
         goalAmountInput.value = goalAmountUSD > 0 ? displayGoal.toFixed(2) : '';
         updateInputLabels();
         openModal(goalModal); goalAmountInput.focus();
     });
     closeGoalModalButton.addEventListener('click', () => closeModal(goalModal));
     setGoalForm.addEventListener('submit', handleSetGoalSubmit);
     goalModal.addEventListener('click', (event) => { if (event.target === goalModal) closeModal(goalModal); });

     resetAppButton.addEventListener('click', () => openModal(resetConfirmationModal));
     closeResetModalButton.addEventListener('click', () => closeModal(resetConfirmationModal));
     cancelResetButton.addEventListener('click', () => closeModal(resetConfirmationModal));
     confirmResetButton.addEventListener('click', performReset);
     resetConfirmationModal.addEventListener('click', (event) => { if (event.target === resetConfirmationModal) closeModal(resetConfirmationModal); });

    capitalizationCard.addEventListener('click', () => openModal(currencyModal));
    closeCurrencyModalButton.addEventListener('click', () => closeModal(currencyModal));
    selectUsdButton.addEventListener('click', () => handleCurrencyChange('USD'));
    selectGtqButton.addEventListener('click', () => handleCurrencyChange('GTQ'));
    currencyModal.addEventListener('click', (event) => { if (event.target === currencyModal) closeModal(currencyModal); });


    filterFutbolButton.addEventListener('click', () => filterTransactions('Fútbol'));
    filterBasquetbolButton.addEventListener('click', () => filterTransactions('Básquetbol'));
    filterAllButton.addEventListener('click', showAllTransactions);

    rentalTimeSelect.addEventListener('change', calculatePrice);

    showPricesFab.addEventListener('click', () => {
        updatePricingModal();
        openModal(pricingModal);
    });
    closePricingModalButton.addEventListener('click', () => closeModal(pricingModal));
    pricingModal.addEventListener('click', (event) => { if (event.target === pricingModal) closeModal(pricingModal); });

    loadCurrencyPreference();
    loadData();
    fetchExchangeRate();
    setInterval(updateRentalStatuses, STATUS_UPDATE_INTERVAL);

});