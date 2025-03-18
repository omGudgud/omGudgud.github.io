// Game state stored in JSON format
let gameState = {
    netBalance: 5,
    inHand: 1,
    trueInHand: 1, // Actual value including decimals
    winChance: 60,  // Starting at 60%
    upgradePrice: 20, // Starting price for upgrade
    multiplier: 2, // Starting multiplier value
    multiplierUpgradePrice: 10000, // Price for multiplier upgrade
    level: 0 // Level counter for multiplier upgrades
};

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    const netBalanceElement = document.getElementById('net-balance');
    const inHandElement = document.getElementById('in-hand');
    const showInHandElement = document.getElementById('show-in-hand');
    const winChanceElement = document.getElementById('win-chance');
    const upgradePriceElement = document.getElementById('upgrade-price');
    const mainButton = document.getElementById('main-button');
    const onePointTwoButton = document.getElementById('one-point-two-button');
    const addButton = document.getElementById('add-button');
    const addFiveButton = document.getElementById('add-five-button');
    const bankButton = document.getElementById('bank-button');
    const upgradeButton = document.getElementById('upgrade-button');
    const multiplierUpgradeButton = document.getElementById('multiplier-upgrade-button');
    const multiplierUpgradePriceElement = document.getElementById('multiplier-upgrade-price');

    // Update the display
    function updateDisplay() {
        // Update all display values from the game state
        netBalanceElement.textContent = Math.floor(gameState.netBalance);
        
        // Update the in-hand value (without decimals for display)
        gameState.inHand = Math.floor(gameState.trueInHand);
        inHandElement.textContent = gameState.inHand;
        
        // Update the hidden show-in-hand value (also without decimals)
        // This is used internally but not displayed to the user
        showInHandElement.textContent = Math.floor(gameState.trueInHand);
        
        // Always ensure the win chance displays the exact value from the game state
        winChanceElement.textContent = gameState.winChance + '%';
        
        // Always ensure the upgrade price displays the exact value from the game state
        upgradePriceElement.textContent = gameState.upgradePrice;
        
        // Update multiplier upgrade price
        multiplierUpgradePriceElement.textContent = gameState.multiplierUpgradePrice;
        
        // Update main button text to show current multiplier
        mainButton.textContent = gameState.multiplier + 'x';
        
        // Disable upgrade button if not enough balance
        upgradeButton.disabled = gameState.netBalance < gameState.upgradePrice;
        
        // Enable multiplier upgrade button only if win probability is >= 80% and net balance >= multiplierUpgradePrice
        multiplierUpgradeButton.disabled = !(gameState.winChance >= 80 && gameState.netBalance >= gameState.multiplierUpgradePrice);
    }

    // Main button click handler - multiplier button
    mainButton.addEventListener('click', function() {
        // If in-hand balance is already 0, it stays 0
        if (gameState.trueInHand === 0) {
            // Visual feedback for zero balance
            mainButton.style.backgroundColor = '#cccccc'; // Gray
            setTimeout(() => {
                mainButton.style.backgroundColor = '#ffb6c1'; // Back to pastel red
            }, 300);
            return;
        }
        
        // Generate random number between 0 and 100
        const randomValue = Math.random() * 100;
        
        if (randomValue < gameState.winChance) {
            // Win chance percent to multiply the in-hand value by the current multiplier
            gameState.trueInHand *= gameState.multiplier; // Multiply by the current multiplier
            
            // Visual feedback for success
            mainButton.style.backgroundColor = '#90ee90'; // Light green
            setTimeout(() => {
                mainButton.style.backgroundColor = '#ffb6c1'; // Back to pastel red
            }, 300);
        } else {
            // Lose chance percent to wipe out in-hand value
            gameState.trueInHand = 0;
            
            // Visual feedback for loss
            mainButton.style.backgroundColor = '#ff6347'; // Tomato red
            setTimeout(() => {
                mainButton.style.backgroundColor = '#ffb6c1'; // Back to pastel red
            }, 300);
        }
        
        updateDisplay();
    });

    // 1.2x button click handler
    onePointTwoButton.addEventListener('click', function() {
        // If in-hand balance is already 0, it stays 0
        if (gameState.trueInHand === 0) {
            // Visual feedback for zero balance
            onePointTwoButton.style.backgroundColor = '#cccccc'; // Gray
            setTimeout(() => {
                onePointTwoButton.style.backgroundColor = '#fffde7'; // Back to yellow tint
            }, 300);
            return;
        }
        
        // Generate random number between 0 and 100
        const randomValue = Math.random() * 100;
        
        if (randomValue < 80) { // 80% chance to increase by 1.2x
            // Increase the in-hand value by 1.2x
            gameState.trueInHand *= 1.2;
            
            // Visual feedback for success
            onePointTwoButton.style.backgroundColor = '#90ee90'; // Light green
            setTimeout(() => {
                onePointTwoButton.style.backgroundColor = '#fffde7'; // Back to yellow tint
            }, 300);
        } else { // 20% chance to wipe out
            // Wipe out in-hand value
            gameState.trueInHand = 0;
            
            // Visual feedback for loss
            onePointTwoButton.style.backgroundColor = '#ff6347'; // Tomato red
            setTimeout(() => {
                onePointTwoButton.style.backgroundColor = '#fffde7'; // Back to yellow tint
            }, 300);
        }
        
        updateDisplay();
    });

    // Add button click handler - transfer 1 from net to in-hand
    addButton.addEventListener('click', function() {
        if (gameState.netBalance >= 1) {
            gameState.netBalance -= 1;
            gameState.trueInHand += 1;
            
            // Visual feedback
            addButton.style.transform = 'scale(0.9)';
            setTimeout(() => {
                addButton.style.transform = 'scale(1)';
            }, 100);
            
            updateDisplay();
        } else {
            // Visual feedback for insufficient funds
            addButton.style.backgroundColor = '#ffcccc';
            setTimeout(() => {
                addButton.style.backgroundColor = 'white';
            }, 300);
        }
    });

    // Add Five button click handler - transfer 5 from net to in-hand
    addFiveButton.addEventListener('click', function() {
        if (gameState.netBalance >= 5) {
            gameState.netBalance -= 5;
            gameState.trueInHand += 5;
            
            // Visual feedback
            addFiveButton.style.transform = 'scale(0.9)';
            setTimeout(() => {
                addFiveButton.style.transform = 'scale(1)';
            }, 100);
            
            updateDisplay();
        } else {
            // Visual feedback for insufficient funds
            addFiveButton.style.backgroundColor = '#ffcccc';
            setTimeout(() => {
                addFiveButton.style.backgroundColor = '#f0e6ff'; // Back to light purple
            }, 300);
        }
    });

    // Bank button click handler - transfer all from in-hand to net
    bankButton.addEventListener('click', function() {
        if (gameState.trueInHand > 0) {
            gameState.netBalance += Math.floor(gameState.trueInHand);
            gameState.trueInHand = 0;
            
            // Visual feedback
            bankButton.style.transform = 'scale(0.9)';
            setTimeout(() => {
                bankButton.style.transform = 'scale(1)';
            }, 100);
            
            updateDisplay();
        } else {
            // Visual feedback for nothing to bank
            bankButton.style.backgroundColor = '#ffcccc';
            setTimeout(() => {
                bankButton.style.backgroundColor = 'white';
            }, 300);
        }
    });

    // Upgrade button click handler - increase win chance
    upgradeButton.addEventListener('click', function() {
        if (gameState.netBalance >= gameState.upgradePrice) {
            // Deduct the price from net balance
            gameState.netBalance -= gameState.upgradePrice;
            
            // Increase win chance by 1%
            gameState.winChance += 1;
            
            // Double the price for next upgrade
            gameState.upgradePrice += 5;
            
            // Visual feedback
            upgradeButton.style.transform = 'scale(0.9)';
            setTimeout(() => {
                upgradeButton.style.transform = 'scale(1)';
            }, 100);
            
            updateDisplay();
        }
    });
    
    // Function to create and show custom prompt
    function showCustomPrompt(message, onYes, onNo) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-prompt-overlay';
        
        // Create prompt container
        const promptContainer = document.createElement('div');
        promptContainer.className = 'custom-prompt-container';
        
        // Create message
        const promptMessage = document.createElement('div');
        promptMessage.className = 'custom-prompt-message';
        promptMessage.textContent = message;
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'custom-prompt-buttons';
        
        // Create Yes button
        const yesButton = document.createElement('button');
        yesButton.className = 'custom-prompt-button custom-prompt-yes';
        yesButton.textContent = 'Yes';
        yesButton.addEventListener('click', function() {
            document.body.removeChild(overlay);
            if (onYes) onYes();
        });
        
        // Create No button
        const noButton = document.createElement('button');
        noButton.className = 'custom-prompt-button custom-prompt-no';
        noButton.textContent = 'No';
        noButton.addEventListener('click', function() {
            document.body.removeChild(overlay);
            if (onNo) onNo();
        });
        
        // Append elements
        buttonsContainer.appendChild(yesButton);
        buttonsContainer.appendChild(noButton);
        promptContainer.appendChild(promptMessage);
        promptContainer.appendChild(buttonsContainer);
        overlay.appendChild(promptContainer);
        
        // Add to body
        document.body.appendChild(overlay);
    }
    
    // Multiplier upgrade button click handler
    multiplierUpgradeButton.addEventListener('click', function() {
        if (gameState.winChance >= 80 && gameState.netBalance >= gameState.multiplierUpgradePrice) {
            // Show confirmation prompt
            const promptMessage = "The button will reset all the progress, and the multiplier will increase by 0.5x. The start win probability will be " + 
                                 (gameState.level < 4 ? (58 - gameState.level * 2) : 50) + "%. Are you sure you want to press the button?";
            
            showCustomPrompt(promptMessage, function() {
                // Yes clicked - proceed with upgrade
                
                // Deduct the price
                gameState.netBalance -= gameState.multiplierUpgradePrice;
                
                // Increase multiplier by 0.5
                gameState.multiplier += 0.5;
                
                // Increase level
                gameState.level += 1;
                
                // Reset win probability based on level (minimum 50%)
                gameState.winChance = Math.max(58 - (gameState.level - 1) * 2, 50);
                
                // Reset in-hand balance
                gameState.trueInHand = 1;
                gameState.inHand = 1;
                
                // Reset net balance to 10
                gameState.netBalance = 10;
                
                // Reset upgrade price back to 20
                gameState.upgradePrice = 20;
                
                // Increase price for next multiplier upgrade
                gameState.multiplierUpgradePrice += 10000;
                
                // Visual feedback
                multiplierUpgradeButton.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    multiplierUpgradeButton.style.transform = 'scale(1)';
                }, 100);
                
                updateDisplay();
            }, function() {
                // No clicked - do nothing
            });
        }
    });

    // Initialize display immediately when the page loads
    updateDisplay();
});
