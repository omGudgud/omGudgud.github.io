// Game state stored in JSON format
const STORAGE_KEY = 'buttonGameState';

// Function to load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
        try {
            return JSON.parse(savedState);
        } catch (e) {
            console.error("Error parsing saved game state:", e);
            // Fallback to initial state if parsing fails
            return getInitialGameState();
        }
    }
    return getInitialGameState(); // Return initial state if nothing is saved
}

// Function to save game state to localStorage
function saveGameState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Error saving game state:", e);
    }
}

// Function to get the initial game state structure
function getInitialGameState() {
    return {
        netBalance: 5,
        inHand: 1,
    trueInHand: 1, // Actual value including decimals
    winChance: 60,  // Starting at 60% (Initial value adjusted, cap is 85%)
    upgradePrice: 20, // Starting price for upgrade (will be replaced by dynamic calculation)
    multiplier: 2, // Starting multiplier value
    multiplierUpgradePrice: 10000, // Price for multiplier upgrade (will be recalculated on first possible upgrade)
        upgradeIteration: 0 // Counter for the win chance upgrade button clicks
        // Removed level property
    };
}

// Initialize game state by loading or using defaults
let gameState = loadGameState();

// Store the initial state structure for resetting (ensure initial state also respects cap if needed)
const initialGameStateStructure = getInitialGameState();
initialGameStateStructure.winChance = Math.min(initialGameStateStructure.winChance, 85); // Apply cap to initial state structure


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
    const retryButton = document.getElementById('retry-button'); // Get the retry button
    const tenthButton = document.getElementById('tenth-button'); // Get the tenth button

    // Tutorial Overlay Elements
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const closeTutorialButton = document.getElementById('close-tutorial');

    // Variables to manage hold-to-click intervals
    let addInterval = null; // Will hold either TimeoutID or IntervalID
    let addFiveInterval = null; // Will hold either TimeoutID or IntervalID
    const HOLD_DELAY_MS = 350; // Initial delay before rapid clicks start
    const HOLD_INTERVAL_MS = 40; // 25 clicks per second (1000ms / 25 = 40ms)

    // Update the display and save state
    function updateDisplay() {
        // Enforce the win chance cap before saving/displaying
        gameState.winChance = Math.min(gameState.winChance, 85);

        // Save the current state *before* updating the display elements
        saveGameState(gameState);

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

        // Calculate and display the cost for the *next* win chance upgrade
        const l_next = Math.max(0, Math.floor((gameState.multiplier - 2) / 0.5));
        const i_next = gameState.upgradeIteration + 1;
        // Corrected formula to match the actual cost calculation in the button handler
        let nextUpgradeCost = Math.floor(Math.pow((20 + l_next), (1 + (0.05 + (l_next * 0.01)) * (i_next-1))));
        // Apply the price cap (100M) for display
        nextUpgradeCost = Math.min(nextUpgradeCost, 100000000);
        upgradePriceElement.textContent = nextUpgradeCost;

        // Update multiplier upgrade price, applying the cap (1B) for display
        const displayMultiplierPrice = Math.min(gameState.multiplierUpgradePrice, 1000000000);
        multiplierUpgradePriceElement.textContent = displayMultiplierPrice;
        
        // Update main button text to show current multiplier
        mainButton.textContent = gameState.multiplier + 'x';

        // Disable upgrade button if not enough balance for the *next* upgrade OR if win chance is already at the 85% cap
        // Disable upgrade button if not enough balance for the *next* (potentially capped at 100M) upgrade OR if win chance is already at the 85% cap
        upgradeButton.disabled = gameState.netBalance < nextUpgradeCost || gameState.winChance >= 85; // nextUpgradeCost already capped above

        // Enable multiplier upgrade button only if win probability is >= 80% and net balance >= (potentially capped at 1B) multiplierUpgradePrice
        multiplierUpgradeButton.disabled = !(gameState.winChance >= 80 && gameState.netBalance >= displayMultiplierPrice); // displayMultiplierPrice already capped above
    }

    // --- Tutorial Overlay Logic ---
    if (tutorialOverlay && closeTutorialButton) {
        // Show the tutorial overlay when the page loads
        tutorialOverlay.style.display = 'flex'; // Use flex as defined in CSS

        // Add event listener to the close button
        closeTutorialButton.addEventListener('click', function() {
            tutorialOverlay.style.display = 'none';
        });

        // Optional: Close overlay if user clicks outside the content box
        tutorialOverlay.addEventListener('click', function(event) {
            if (event.target === tutorialOverlay) { // Check if the click is on the overlay itself
                tutorialOverlay.style.display = 'none';
            }
        });
    }
    // --- End Tutorial Overlay Logic ---

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

    // --- Refactored Add Button Logic ---

    // Function to handle adding 1
    function handleAddOne() {
        if (gameState.netBalance >= 1) {
            gameState.netBalance -= 1;
            gameState.trueInHand += 1;
            updateDisplay();
            // Optional: Add subtle feedback for repeated clicks if desired
            // addButton.style.opacity = '0.8';
            // setTimeout(() => { addButton.style.opacity = '1'; }, 50);
        } else {
            // Stop interval if balance runs out
            clearInterval(addInterval);
            addInterval = null;
            // Visual feedback for insufficient funds
            addButton.style.backgroundColor = '#ffcccc';
            setTimeout(() => {
                addButton.style.backgroundColor = 'white';
            }, 300);
        }
    }

    // Function to handle adding 5
    function handleAddFive() {
        if (gameState.netBalance >= 5) {
            gameState.netBalance -= 5;
            gameState.trueInHand += 5;
            updateDisplay();
            // Optional: Add subtle feedback for repeated clicks if desired
            // addFiveButton.style.opacity = '0.8';
            // setTimeout(() => { addFiveButton.style.opacity = '1'; }, 50);
        } else {
            // Stop interval if balance runs out
            clearInterval(addFiveInterval);
            addFiveInterval = null;
            // Visual feedback for insufficient funds
            addFiveButton.style.backgroundColor = '#ffcccc';
            setTimeout(() => {
                addFiveButton.style.backgroundColor = '#f0e6ff'; // Back to light purple
            }, 300);
        }
    }

    // Function to stop the add interval (handles both timeout and interval)
    function stopAddInterval() {
        if (addInterval) {
            clearTimeout(addInterval); // Clear the initial delay timeout if it's running
            clearInterval(addInterval); // Clear the rapid click interval if it's running
            addInterval = null;
            // Restore visual state if needed
            addButton.style.transform = 'scale(1)';
        }
    }

    // Function to stop the add five interval (handles both timeout and interval)
    function stopAddFiveInterval() {
        if (addFiveInterval) {
            clearTimeout(addFiveInterval); // Clear the initial delay timeout if it's running
            clearInterval(addFiveInterval); // Clear the rapid click interval if it's running
            addFiveInterval = null;
            // Restore visual state if needed
            addFiveButton.style.transform = 'scale(1)';
        }
    }

    // Add button event listeners for hold-to-click (Mouse & Touch)
    function startAddHold(event) {
        // Prevent default touch actions (like scrolling) and potential mouse event emulation
        if (event.type === 'touchstart') {
            event.preventDefault();
        }
        // Clear any existing timer/interval first
        stopAddInterval();
        // Register the initial click immediately
        handleAddOne();
        addButton.style.transform = 'scale(0.9)'; // Apply visual feedback immediately
        // Start the initial delay timeout *after* the first click
        addInterval = setTimeout(() => {
            // Start the rapid click interval (no need for another immediate click here)
            addInterval = setInterval(handleAddOne, HOLD_INTERVAL_MS);
            // Note: Animation already applied, no need to re-apply here
        }, HOLD_DELAY_MS);
    }

    addButton.addEventListener('mousedown', startAddHold);
    addButton.addEventListener('touchstart', startAddHold);

    addButton.addEventListener('mouseup', stopAddInterval);
    addButton.addEventListener('mouseleave', stopAddInterval);
    addButton.addEventListener('touchend', stopAddInterval);
    addButton.addEventListener('touchcancel', stopAddInterval);

    // Prevent context menu on right-click hold (mouse only)
    addButton.addEventListener('contextmenu', function(e) { e.preventDefault(); });


    // Add Five button event listeners for hold-to-click (Mouse & Touch)
    function startAddFiveHold(event) {
        // Prevent default touch actions (like scrolling) and potential mouse event emulation
        if (event.type === 'touchstart') {
            event.preventDefault();
        }
        // Clear any existing timer/interval first
        stopAddFiveInterval();
        // Register the initial click immediately
        handleAddFive();
        addFiveButton.style.transform = 'scale(0.9)'; // Apply visual feedback immediately
        // Start the initial delay timeout *after* the first click
        addFiveInterval = setTimeout(() => {
            // Start the rapid click interval (no need for another immediate click here)
            addFiveInterval = setInterval(handleAddFive, HOLD_INTERVAL_MS);
            // Note: Animation already applied, no need to re-apply here
        }, HOLD_DELAY_MS);
    }

    addFiveButton.addEventListener('mousedown', startAddFiveHold);
    addFiveButton.addEventListener('touchstart', startAddFiveHold);

    addFiveButton.addEventListener('mouseup', stopAddFiveInterval);
    addFiveButton.addEventListener('mouseleave', stopAddFiveInterval);
    addFiveButton.addEventListener('touchend', stopAddFiveInterval);
    addFiveButton.addEventListener('touchcancel', stopAddFiveInterval);

    // Prevent context menu on right-click hold (mouse only)
    addFiveButton.addEventListener('contextmenu', function(e) { e.preventDefault(); });


    // Tenth button click handler - transfer 1/10th of net balance to in-hand
    tenthButton.addEventListener('click', function() {
        const amountToTransfer = Math.floor(gameState.netBalance / 10);

        if (amountToTransfer > 0 && gameState.netBalance >= amountToTransfer) {
            gameState.netBalance -= amountToTransfer;
            gameState.trueInHand += amountToTransfer;

            // Visual feedback
            tenthButton.style.transform = 'scale(0.9)';
            setTimeout(() => {
                tenthButton.style.transform = 'scale(1)';
            }, 100);

            updateDisplay();
        } else {
            // Visual feedback for insufficient funds or zero transfer amount
            tenthButton.style.backgroundColor = '#ffcccc'; // Light red
            setTimeout(() => {
                // Reset to its specific yellow tint
                tenthButton.style.backgroundColor = '#d0afff'; // LemonChiffon (matches CSS)
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

    // Upgrade button click handler - increase win chance with dynamic cost
    upgradeButton.addEventListener('click', function() {
        // Calculate current level 'l'
        const l_current = Math.max(0, Math.floor((gameState.multiplier - 2) / 0.5));
        // Calculate iteration 'i' for the *current* purchase cost
        const i_current = gameState.upgradeIteration + 1;
        // Calculate the cost for *this* upgrade
        let currentUpgradeCost = Math.floor(Math.pow((20 + l_current), (1 + (0.05 +(l_current * 0.01)) * (i_current-1))));
        // Apply the price cap (100M) before checking affordability
        currentUpgradeCost = Math.min(currentUpgradeCost, 100000000);

        // Check if affordable (using capped cost) and win chance is not already capped
        if (gameState.netBalance >= currentUpgradeCost && gameState.winChance < 85) {
            // Deduct the calculated (and potentially capped) cost from net balance
            gameState.netBalance -= currentUpgradeCost;

            // Increase win chance by 1%, capping at 85%
            gameState.winChance = Math.min(gameState.winChance + 1, 85);

            // Increment the iteration counter for the next upgrade cost calculation
            gameState.upgradeIteration++;

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
        // Apply cap (1B) to the price check
        const currentMultiplierPrice = Math.min(gameState.multiplierUpgradePrice, 1000000000);
        if (gameState.winChance >= 80 && gameState.netBalance >= currentMultiplierPrice) {
            // Calculate the *next* multiplier level *before* the prompt
            const nextMultiplier = gameState.multiplier + 0.5;
            const nextLevel = Math.floor(Math.max(0, (nextMultiplier - 2) * 2)); // Level based on the *next* multiplier
            
            // Calculate the win chance for the *next* round based on the *next* level
            // The formula is 60% for level 1 (multiplier 2.0), 55% for level 2 (multiplier 2.5), etc.
            // Level 1 corresponds to (nextLevel = 1), so (nextLevel - 1) * 5 = 0. 60 - 0 = 60.
            // Level 2 corresponds to (nextLevel = 2), so (nextLevel - 1) * 5 = 5. 60 - 5 = 55.
            const nextResetWinChance = Math.max(60 - (nextLevel * 5), 40); // Corrected calculation based on nextLevel

            // Add console.log for debugging
            console.log(`Current Multiplier: ${gameState.multiplier}, Next Multiplier: ${nextMultiplier}, Next Level Derived: ${nextLevel}, Prompt Win Chance: ${nextResetWinChance}`);

            // Determine the correct prompt message
            let promptMessage;
            if (gameState.multiplier === 4) {
                promptMessage = "Congratulations!\n\nYou have officially completed the game. If you wish, you can still continue with higher multipliers. Do you want to continue?";
            } else {
                promptMessage = `The button will reset all progress. Multiplier will increase by 0.5x. The start win probability for the next round will be ${nextResetWinChance}%. Are you sure?`;
            }

            showCustomPrompt(promptMessage, function() {
                // Yes clicked - proceed with upgrade
                
                // Deduct the price (using the potentially capped value)
                gameState.netBalance -= currentMultiplierPrice;
                
                // Increase multiplier by 0.5
                gameState.multiplier += 0.5; // This is now the 'nextMultiplier' calculated earlier

                // Reset win probability using the pre-calculated nextResetWinChance
                gameState.winChance = nextResetWinChance;
                // No need to recalculate level or win chance here

                // Reset in-hand balance
                gameState.trueInHand = 1;
                gameState.inHand = 1;
                
                // Reset net balance to 10
                gameState.netBalance = 10;
                
                // Reset upgrade price back to 20 (or rather, reset the iteration counter)
                gameState.upgradeIteration = 0; // Reset the win chance upgrade iteration counter

                // Calculate the price for the *next* multiplier upgrade based on the *new* multiplier
                const nextMultiplier = gameState.multiplier; // Already increased by 0.5
                const rawPrice = Math.pow(nextMultiplier, 13.3);
                // Round to the nearest thousand and apply cap (1B)
                gameState.multiplierUpgradePrice = Math.min(Math.round(rawPrice / 1000) * 1000, 1000000000);

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

    // Retry button click handler - reset game state and clear storage
    retryButton.addEventListener('click', function() {
        showCustomPrompt("Are you sure you want to reset all progress and start over?", function() {
            // Yes clicked - reset the game state variable
            gameState = JSON.parse(JSON.stringify(initialGameStateStructure)); // Reset to initial state structure

            // Clear the saved state from localStorage
            localStorage.removeItem(STORAGE_KEY);

            // Visual feedback
            retryButton.style.transform = 'scale(0.9)';
            setTimeout(() => {
                retryButton.style.transform = 'scale(1)';
            }, 100);

            updateDisplay(); // Update the UI
        }, function() {
            // No clicked - do nothing
        });
    });

    // Initialize display immediately when the page loads
    updateDisplay();
});
