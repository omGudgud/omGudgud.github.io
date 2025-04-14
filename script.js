// Game state stored in JSON format
const STORAGE_KEY = 'buttonGameState';
// Removed TUTORIAL_SHOWN_KEY as it's no longer needed

// Function to load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
        try {
            // No need to handle tutorialShown here anymore
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
        // Removed tutorialShown flag from main game state
        netBalance: 5,
        inHand: 1,
    trueInHand: 1, // Actual value including decimals
    winChance: 60,  // Starting at 60% (Initial value adjusted, cap is 85%)
    upgradePrice: 20, // Starting price for upgrade (will be replaced by dynamic calculation)
    multiplier: 2, // Starting multiplier value
    multiplierUpgradePrice: 10000, // Price for multiplier upgrade (will be recalculated on first possible upgrade)
        upgradeIteration: 0, // Counter for the win chance upgrade button clicks
        showMultiplierPrompt: false, // Flag to control the visibility of the multiplier increase prompt
        permanentWinChanceBonus: 0, // Card 1 Bonus: Permanent +% win chance
        lossProtectionChance: 0,    // Card 2 Bonus: % chance to ignore loss
        doubleWinChance: 0          // Card 3 Bonus: % chance to multiply winnings again
        // Removed level property
    };
}

// Initialize game state by loading or using defaults
let gameState = loadGameState();

// Store the initial state structure for resetting (ensure initial state also respects cap if needed)
// Make sure to copy ALL properties, including the new ones
const initialGameStateStructure = JSON.parse(JSON.stringify(getInitialGameState()));
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
    const infoButton = document.getElementById('info-button'); // Get the new info button

    // Tutorial Overlay Elements
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const closeTutorialButton = document.getElementById('close-tutorial');

    // Multiplier Increase Prompt Elements
    const multiplierIncreaseOverlay = document.getElementById('multiplier-increase-prompt-overlay');
    const multiplierIncreaseCards = document.querySelectorAll('.multiplier-increase-card');

    // Variables to manage hold-to-click intervals
    let addInterval = null; // Will hold either TimeoutID or IntervalID
    let addFiveInterval = null; // Will hold either TimeoutID or IntervalID
    let addTenthInterval = null; // Interval for the tenth button (rapid add)
    let longPressTimer = null; // Timer for the "all in" long press
    let allInTriggered = false; // Flag to check if "all in" happened
    const HOLD_DELAY_MS = 350; // Initial delay before rapid clicks start
    const HOLD_INTERVAL_MS = 40; // 25 clicks per second (1000ms / 25 = 40ms)
    const LONG_PRESS_DURATION_MS = 1200; // 1.2 seconds for "all in"
    // Moved Rand_counter and Last_update_time to global scope

    // Check if the multiplier prompt should be shown on load (after elements are defined)
    if (gameState.showMultiplierPrompt) {
        showMultiplierIncreasePrompt();
    }

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
        
        // Calculate and display the effective win chance (base + permanent bonus)
        const displayWinChance = Math.min(gameState.winChance + (gameState.permanentWinChanceBonus || 0), 100); // Cap at 100% for display
        winChanceElement.textContent = displayWinChance + '%';

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
    if (tutorialOverlay && closeTutorialButton && infoButton) {
        // Function to close the tutorial
        function closeTutorial() {
            tutorialOverlay.style.display = 'none';
            // No longer need to set localStorage item
        }

        // Add event listener to the info button to show the tutorial
        infoButton.addEventListener('click', function() {
            tutorialOverlay.style.display = 'flex'; // Show the overlay
        });

        // Add event listener to the close button
        closeTutorialButton.addEventListener('click', closeTutorial);

        // Optional: Close overlay if user clicks outside the content box
        tutorialOverlay.addEventListener('click', function(event) {
            if (event.target === tutorialOverlay) { // Check if the click is on the overlay itself
                closeTutorial();
            }
        });
    }
    // --- End Tutorial Overlay Logic ---

    // Main button click handler - multiplier button
    mainButton.addEventListener('click', function() {
        // Rand_counter is now incremented inside generateRandomNumber
        // If in-hand balance is already 0, it stays 0
        if (gameState.trueInHand === 0) {
            // Visual feedback for zero balance
            mainButton.style.backgroundColor = '#cccccc'; // Gray
            setTimeout(() => {
                mainButton.style.backgroundColor = '#ff9aa2'; // Back to original CSS color
            }, 300);
            return;
        }
        
        // Generate random number for win/loss check
        const winLossRoll = generateRandomNumber() * 100;
        const effectiveWinChance = Math.min(gameState.winChance + (gameState.permanentWinChanceBonus || 0), 100); // Calculate effective win chance with bonus (cap at 100%)
        console.log(`Main Button Click:`);
        console.log(`  - Win Chance: Base=${gameState.winChance}%, Bonus=${gameState.permanentWinChanceBonus || 0}%, Effective=${effectiveWinChance.toFixed(2)}%`);
        console.log(`  - Win/Loss Roll: ${winLossRoll.toFixed(2)}`);

        if (winLossRoll < effectiveWinChance) {
            // --- WIN ---
            const initialWinAmount = gameState.trueInHand * gameState.multiplier;
            gameState.trueInHand = initialWinAmount; // Apply initial multiplier
            console.log(`Main Button: Initial Win! In Hand: ${gameState.trueInHand}`);

            // Check for Double Win Chance (Card 3 Bonus)
            const doubleWinRoll = generateRandomNumber() * 100;
            console.log(`  - Double Win Check: Roll=${doubleWinRoll.toFixed(2)}, Chance=${gameState.doubleWinChance || 0}%`);
            if (doubleWinRoll < (gameState.doubleWinChance || 0)) {
                gameState.trueInHand *= gameState.multiplier; // Apply multiplier again
                console.log(`  - Double Win Triggered! New In Hand: ${gameState.trueInHand}`);
            } else {
                console.log(`  - Double Win Not Triggered.`);
            }

            // Visual feedback for success
            mainButton.style.backgroundColor = '#90ee90'; // Light green
            setTimeout(() => {
                mainButton.style.backgroundColor = '#ff9aa2'; // Back to original CSS color
            }, 300);
        } else {
            // --- LOSS ---
            console.log(`  - Result: Loss`);
            // Check for Loss Protection Chance (Card 2 Bonus)
            const lossProtectionRoll = generateRandomNumber() * 100;
            console.log(`  - Loss Protection Check: Roll=${lossProtectionRoll.toFixed(2)}, Chance=${gameState.lossProtectionChance || 0}%`);
            if (lossProtectionRoll < (gameState.lossProtectionChance || 0)) {
                console.log(`  - Loss Protected! In Hand remains: ${gameState.trueInHand}`);
                // Don't set trueInHand to 0
            } else {
                // Lose chance percent to wipe out in-hand value
                console.log(`  - Loss Not Protected. In Hand reset to 0.`);
                gameState.trueInHand = 0;
            }
            
            // Visual feedback for loss
            mainButton.style.backgroundColor = '#ff6347'; // Tomato red
            setTimeout(() => {
                mainButton.style.backgroundColor = '#ff9aa2'; // Back to original CSS color
            }, 300);
        }
        
        updateDisplay();
    });

    // 1.2x button click handler
    onePointTwoButton.addEventListener('click', function() {
        // Rand_counter is now incremented inside generateRandomNumber
        // If in-hand balance is already 0, it stays 0
        if (gameState.trueInHand === 0) {
            // Visual feedback for zero balance
            onePointTwoButton.style.backgroundColor = '#cccccc'; // Gray
            setTimeout(() => {
                onePointTwoButton.style.backgroundColor = '#fffde7'; // Back to yellow tint
            }, 300);
            return;
        }
        
        // Generate random number for win/loss check
        const winLossRoll = generateRandomNumber() * 100;
        console.log(`1.2x Button Click:`);
        console.log(`  - Win Chance: 80% (Fixed)`);
        console.log(`  - Win/Loss Roll: ${winLossRoll.toFixed(2)}`);

        if (winLossRoll < 80) { // 80% chance to increase by 1.2x
            // --- WIN ---
            const initialWinAmount = gameState.trueInHand * 1.2;
            gameState.trueInHand = initialWinAmount; // Apply initial 1.2x multiplier
            console.log(`1.2x Button: Initial Win! In Hand: ${gameState.trueInHand}`);

            // Check for Double Win Chance (Card 3 Bonus) - applies 1.2x again
            const doubleWinRoll = generateRandomNumber() * 100;
            console.log(`  - Double Win Check: Roll=${doubleWinRoll.toFixed(2)}, Chance=${gameState.doubleWinChance || 0}%`);
            if (doubleWinRoll < (gameState.doubleWinChance || 0)) {
                gameState.trueInHand *= 1.2; // Apply 1.2x multiplier again
                console.log(`  - Double Win Triggered! New In Hand: ${gameState.trueInHand}`);
            } else {
                 console.log(`  - Double Win Not Triggered.`);
            }
            // Visual feedback for success
            onePointTwoButton.style.backgroundColor = '#90ee90'; // Light green
            setTimeout(() => {
                onePointTwoButton.style.backgroundColor = '#fffde7'; // Back to yellow tint
            }, 300);
        } else { // 20% chance to wipe out
            // --- LOSS ---
            console.log(`  - Result: Loss`);
             // Check for Loss Protection Chance (Card 2 Bonus)
            const lossProtectionRoll = generateRandomNumber() * 100;
            console.log(`  - Loss Protection Check: Roll=${lossProtectionRoll.toFixed(2)}, Chance=${gameState.lossProtectionChance || 0}%`);
            if (lossProtectionRoll < (gameState.lossProtectionChance || 0)) {
                 console.log(`  - Loss Protected! In Hand remains: ${gameState.trueInHand}`);
                 // Don't set trueInHand to 0
            } else {
                // Wipe out in-hand value
                console.log(`  - Loss Not Protected. In Hand reset to 0.`);
                gameState.trueInHand = 0;
            }
            
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

    // Function to handle adding 10%
    function handleAddTenth() {
        const amountToTransfer = Math.floor(gameState.netBalance / 10);

        if (amountToTransfer > 0 && gameState.netBalance >= amountToTransfer) {
            gameState.netBalance -= amountToTransfer;
            gameState.trueInHand += amountToTransfer;
            updateDisplay();
            // Optional: Add subtle feedback for repeated clicks if desired
            // tenthButton.style.opacity = '0.8';
            // setTimeout(() => { tenthButton.style.opacity = '1'; }, 50);
        } else {
            // Stop interval if balance runs out or transfer is 0
            clearInterval(addTenthInterval);
            addTenthInterval = null;
            // Visual feedback for insufficient funds or zero transfer
            tenthButton.style.backgroundColor = '#ffcccc'; // Light red
            setTimeout(() => {
                // Reset to its specific purple tint
                tenthButton.style.backgroundColor = '#d0afff'; // Matches CSS
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

    // Function to stop the add tenth interval and long press timer
    function stopAddTenthInterval() {
        // Clear the long press timer if it's still pending
        clearTimeout(longPressTimer);
        longPressTimer = null;

        // Only clear the rapid add interval if "all in" didn't happen
        if (!allInTriggered) {
            if (addTenthInterval) {
                clearTimeout(addTenthInterval); // Clear the initial delay timeout if it's running
                clearInterval(addTenthInterval); // Clear the rapid click interval if it's running
                addTenthInterval = null;
            }
        }
        // Always restore visual state
        tenthButton.style.transform = 'scale(1)';
        // Reset the allInTriggered flag for the next press
        // allInTriggered = false; // Resetting here might be too early if another event fires quickly. Reset in startAddTenthHold instead.
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
    addButton.addEventListener('touchstart', startAddHold, { passive: false }); // Explicitly non-passive

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
    addFiveButton.addEventListener('touchstart', startAddFiveHold, { passive: false }); // Explicitly non-passive

    addFiveButton.addEventListener('mouseup', stopAddFiveInterval);
    addFiveButton.addEventListener('mouseleave', stopAddFiveInterval);
    addFiveButton.addEventListener('touchend', stopAddFiveInterval);
    addFiveButton.addEventListener('touchcancel', stopAddFiveInterval);

    // Prevent context menu on right-click hold (mouse only)
    addFiveButton.addEventListener('contextmenu', function(e) { e.preventDefault(); });


    // Tenth button event listeners for hold-to-click (Mouse & Touch)
    function startAddTenthHold(event) {
        // Prevent default touch actions (like scrolling) and potential mouse event emulation
        if (event.type === 'touchstart') {
            event.preventDefault();
        }
        // Reset the "all in" flag at the start of a new press
        allInTriggered = false;
        // Clear any existing timer/interval first (stopAddTenthInterval now also clears longPressTimer)
        stopAddTenthInterval();
        // Register the initial click immediately
        handleAddTenth();
        tenthButton.style.transform = 'scale(0.9)'; // Apply visual feedback immediately

        // Start the initial delay timeout *after* the first click for rapid add
        addTenthInterval = setTimeout(() => {
            // Start the rapid click interval (no need for another immediate click here)
            addTenthInterval = setInterval(handleAddTenth, HOLD_INTERVAL_MS);
            // Note: Animation already applied, no need to re-apply here
        }, HOLD_DELAY_MS);

        // --- Start the Long Press Timer for "All In" ---
        // Clear any previous long press timer just in case (redundant due to stopAddTenthInterval call, but safe)
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            // Long press detected!
            allInTriggered = true; // Set the flag

            // Stop the rapid add interval if it's running
            if (addTenthInterval) {
                clearTimeout(addTenthInterval); // Clear initial delay timeout
                clearInterval(addTenthInterval); // Clear rapid click interval
                addTenthInterval = null;
            }

            // Perform "All In" if there's balance to move
            if (gameState.netBalance > 0) {
                console.log("All in triggered!"); // For debugging
                gameState.trueInHand += gameState.netBalance;
                gameState.netBalance = 0;

                // Visual feedback for "All In"
                tenthButton.style.backgroundColor = '#ffcc00'; // Bright yellow flash
                setTimeout(() => {
                    // Reset to its specific purple tint
                    tenthButton.style.backgroundColor = '#d0afff'; // Matches CSS
                }, 300);

                updateDisplay(); // Update UI immediately
            }
            longPressTimer = null; // Timer has fired
        }, LONG_PRESS_DURATION_MS); // 1.2 seconds
    }

    tenthButton.addEventListener('mousedown', startAddTenthHold);
    tenthButton.addEventListener('touchstart', startAddTenthHold, { passive: false }); // Explicitly non-passive

    tenthButton.addEventListener('mouseup', stopAddTenthInterval);
    tenthButton.addEventListener('mouseleave', stopAddTenthInterval);
    tenthButton.addEventListener('touchend', stopAddTenthInterval);
    tenthButton.addEventListener('touchcancel', stopAddTenthInterval);

    // Prevent context menu on right-click hold (mouse only)
    tenthButton.addEventListener('contextmenu', function(e) { e.preventDefault(); });


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

                // Set the flag to show the prompt *before* saving state
                gameState.showMultiplierPrompt = true;
                
                updateDisplay(); // Update UI first (this also saves the state with the flag set)

                // Show the new multiplier increase prompt immediately after update
                showMultiplierIncreasePrompt();

            }, function() {
                // No clicked - do nothing
            });
        }
    });

    // Retry button click handler - reset game state and clear storage
    retryButton.addEventListener('click', function() {
        showCustomPrompt("Are you sure you want to reset all progress and start over?", function() {
            // Yes clicked - reset the game state variable
            // Use the stored initial structure which now includes the new properties initialized to 0
            gameState = JSON.parse(JSON.stringify(initialGameStateStructure)); 

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

    // --- Multiplier Increase Prompt Logic ---
    const card1 = document.getElementById('card-1');
    const card2 = document.getElementById('card-2');
    const card3 = document.getElementById('card-3');

    function showMultiplierIncreasePrompt() {
        if (multiplierIncreaseOverlay) {
            multiplierIncreaseOverlay.style.display = 'flex';
        }
    }

    // Shared function to close prompt and save state
    function closeMultiplierPromptAndSave() {
        if (multiplierIncreaseOverlay) {
            multiplierIncreaseOverlay.style.display = 'none';
        }
        gameState.showMultiplierPrompt = false;
        saveGameState(gameState); // Save state after closing and setting flag
        updateDisplay(); // Update display to reflect any potential state changes from cards
    }

    // Card 1: Permanent Win Chance Bonus (+2%)
    function handleCard1Click() {
        gameState.permanentWinChanceBonus = (gameState.permanentWinChanceBonus || 0) + 2;
        // Optional: Cap the bonus if needed, e.g., gameState.permanentWinChanceBonus = Math.min(gameState.permanentWinChanceBonus, 50);
        console.log(`Card 1 Clicked: Permanent Win Chance Bonus increased to ${gameState.permanentWinChanceBonus}%`);
        closeMultiplierPromptAndSave();
    }

    // Card 2: Loss Protection Chance (+10%)
    function handleCard2Click() {
        gameState.lossProtectionChance = Math.min((gameState.lossProtectionChance || 0) + 10, 100); // Cap at 100%
        console.log(`Card 2 Clicked: Loss Protection Chance increased to ${gameState.lossProtectionChance}%`);
        closeMultiplierPromptAndSave();
    }

    // Card 3: Double Win Chance (+10%)
    function handleCard3Click() {
        gameState.doubleWinChance = Math.min((gameState.doubleWinChance || 0) + 10, 100); // Cap at 100%
        console.log(`Card 3 Clicked: Double Win Chance increased to ${gameState.doubleWinChance}%`);
        closeMultiplierPromptAndSave();
    }

    // Attach specific handlers to each card
    if (card1) card1.addEventListener('click', handleCard1Click);
    if (card2) card2.addEventListener('click', handleCard2Click);
    if (card3) card3.addEventListener('click', handleCard3Click);

    // --- End Multiplier Increase Prompt Logic ---

    // Initialize display immediately when the page loads
    updateDisplay();
});

// Global variables for the custom random number generator
let Rand_counter = 0;
let Last_update_time = 0;

var MD5 = function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

// tion to generate a random number between 0 and 1 using MD5 hash of time
function generateRandomNumber() {
    // Calculate time-based input value
    const timeInMillis = Date.now();
    const timeInSeconds = Math.floor(timeInMillis / 1000);
    // Reset counter if the second has changed
    if(!(Last_update_time===timeInSeconds)) {
        Rand_counter = 0;
    }
    // Increment counter *before* using it for EVERY call
    Rand_counter++; 
    const inputValue = ((timeInSeconds * 1000) + Rand_counter).toString(); // Use milliseconds and incrementing counter
    // console.log(`RNG Input: ${inputValue}`); // Optional debug log

    // Calculate MD5 hash using the existing MD5 function
    const hashResult = MD5(inputValue);
    console.log(hashResult);

    // Convert MD5 hash (hex string) to BigInt
    // Prepend '0x' to the hex string for BigInt conversion
    const hashAsBigInt = BigInt('0x' + hashResult);

    // Define the maximum 128-bit value (2^128 - 1) as BigInt
    const max128BitValue = (BigInt(1) << BigInt(128)) - BigInt(1);

    // Normalize the hash value to a range of 0 to 1
    // Convert BigInts to Number for floating-point division
    const normalizedValue = Number(hashAsBigInt) / Number(max128BitValue);
    // console.log(`RNG Output: ${normalizedValue}`); // Optional debug log
    Last_update_time=timeInSeconds;

    return normalizedValue; // Return the value between 0 and 1
}
