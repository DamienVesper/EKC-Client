const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const Toastify = require('toastify-js');

const initializeDropdown = () => {
    const dropdown = document.getElementById('accountDropdown');

    // Clear existing options
    dropdown.innerHTML = '';

    // Initialize accountData object with stored data
    window.accountData = store.get('accountData') || {
        account1: { password: '', username: 'Account 1' },
        account2: { password: '', username: 'Account 2' },
        account3: { password: '', username: 'Account 3' },
        account4: { password: '', username: 'Account 4' },
        account5: { password: '', username: 'Account 5' },
    };

    // Get the selected option from the store
    const selectedOptionId = store.get('selectedOptionId');

    // Add options from the accountData object
    Object.entries(window.accountData).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.text = value.username;
        dropdown.appendChild(option);

        // Set the selected option if it matches the stored ID
        if (key === selectedOptionId) {
            option.selected = true;
        }
    });
};


document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.launch-button').disabled = true;
    initializeDropdown();
    const style = document.createElement('style');
    style.textContent = `
        /*!
        * Toastify js 1.12.0
        * https://github.com/apvarun/toastify-js
        * @license MIT licensed
        *
        * Copyright (C) 2018 Varun A P
        */
        .toastify {
            padding: 12px 20px;
            color: #fff;
            display: inline-block;
            box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px rgba(77, 96, 232, 0.3);
            background: -webkit-linear-gradient(315deg, #73a5ff, #5477f5);
            background: linear-gradient(135deg, #73a5ff, #5477f5);
            position: fixed;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
            border-radius: 2px;
            cursor: pointer;
            text-decoration: none;
            max-width: calc(50% - 20px);
            z-index: 2147483647;
        }
        .toastify.on {
            opacity: 1;
        }
        /* Add more styles as needed */
    `;
    document.head.appendChild(style);

});

const saveAccountData = (newAccountData) => {
    store.set('accountData', newAccountData);
};

window.exitLauncher = () => {
    ipcRenderer.invoke('exitLauncher');
};

window.startGame = () => {
    const dropdown = document.getElementById('accountDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const selectedAccountId = selectedOption.value;

    const selectedAccount = window.accountData[selectedAccountId];
    store.set('amlData', selectedAccount);

    // Save the selected option ID
    store.set('selectedOptionId', selectedAccountId);

    ipcRenderer.invoke('startGame');
};


// Function to handle opening the popup
window.openPopup = () => {
    const popup = document.getElementById('loginPopup');
    popup.style.display = 'block';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
};


// Function to handle closing the popup
window.closePopup = () => {
    const popup = document.getElementById('loginPopup');
    popup.style.display = 'none';
};

window.removeAccount = () => {
    const dropdown = document.getElementById('accountDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const optionValue = selectedOption.value;
    if (optionValue) {
        // Set the account data to the default format
        window.accountData[optionValue] = { password: '', username: `Account ${optionValue.split('account')[1]}` };
        saveAccountData(window.accountData); // Save the updated account data to Electron Store
        selectedOption.text = `Account ${optionValue.split('account')[1]}`; // Set the selected option text back to the default format
    }
};

window.login = () => {
    const dropdown = document.getElementById('accountDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const optionValue = selectedOption.value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Create a copy of the current accountData object
    const newAccountData = { ...window.accountData };

    // Update the selected account's username and password
    // eslint-disable-next-line no-prototype-builtins
    if (optionValue && newAccountData.hasOwnProperty(optionValue)) {
        newAccountData[optionValue].username = username;
        newAccountData[optionValue].password = password;
    }

    // Call the saveAccountData function with the updated accountData
    saveAccountData(newAccountData);

    // Update the selected option text
    if (optionValue) {
        selectedOption.text = username ? username : newAccountData[optionValue].username;
    }

    // Close the popup
    closePopup();
};


// Access the accountData object from the main window
window.accountData = {
    account1: { password: '', username: 'Account 1' },
    account2: { password: '', username: 'Account 2' },
    account3: { password: '', username: 'Account 3' },
    account4: { password: '', username: 'Account 4' },
    account5: { password: '', username: 'Account 5' },
};


// Flag to track if the new client version toast is displayed
let isNewVersionToastDisplayed = false;

// Set interval to check for update availability and show toast notification
setInterval(() => {
    const osplatform = store.get('osplatform');
    if (osplatform !== 'win32') {
        document.querySelector('.launch-button').disabled = false;
        return;
    }
    const updateAvailable = store.get('updateAvailable');
    if (updateAvailable !== 'upToDate') {
        document.getElementById('updateStatus').innerHTML = `Update percent: ${store.get('updatePercent').toFixed(1)}%`;
    }
    if (updateAvailable === 'upToDate' && !isNewVersionToastDisplayed) {
        Toastify({
            text: 'Your client is up-to-date.',
            duration: 5000,
            gravity: 'top',
            position: 'center',
            style: {
                background: 'linear-gradient(to right, #00b09b, #96c93d)',
            },
        }).showToast();
        document.querySelector('.launch-button').disabled = false;
        isNewVersionToastDisplayed = true; // Set flag to true after displaying toast
    }
    if (updateAvailable && updateAvailable !== 'upToDate' && !isNewVersionToastDisplayed) {
        Toastify({
            text: `New client version available: ${store.get('updateVersion')}, downloading...`,
            duration: 3000,
            gravity: 'top',
            position: 'center',
            style: {
                background: 'linear-gradient(to right, #00b09b, #96c93d)',
            },
        }).showToast();
        isNewVersionToastDisplayed = true; // Set flag to true after displaying toast
    }
}, 1000); // Check every second

store.onDidChange('updateAvailable', (newValue) => {
    if (newValue === 'upToDate') {
        isNewVersionToastDisplayed = false;
    }
});