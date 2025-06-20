
        // Game state
        const gameState = {
            balance: 10000,
            currentBet: 0,
            selectedBet: null,
            deckId: '',
            gameInProgress: false,
            soundEnabled: true,
            gameHistory: []
        };

        // Custom 32-card deck (7-Ace of all suits)
        const customDeck = [
            '7S', '8S', '9S', '0S', 'JS', 'QS', 'KS', 'AS',
            '7H', '8H', '9H', '0H', 'JH', 'QH', 'KH', 'AH',
            '7D', '8D', '9D', '0D', 'JD', 'QD', 'KD', 'AD',
            '7C', '8C', '9C', '0C', 'JC', 'QC', 'KC', 'AC'
        ];

        // DOM elements
        const elements = {
            balance: document.getElementById('balance'),
            betAmountInput: document.getElementById('amount'),
            betPlayer: document.getElementById('bet-player'),
            betBanker: document.getElementById('bet-banker'),
            betTie: document.getElementById('bet-tie'),
            playerCards: [
                document.getElementById('player-card-1'),
                document.getElementById('player-card-2'),
                document.getElementById('player-card-3')
            ],
            bankerCards: [
                document.getElementById('banker-card-1'),
                document.getElementById('banker-card-2'),
                document.getElementById('banker-card-3')
            ],
            playerStrength: document.getElementById('player-strength'),
            bankerStrength: document.getElementById('banker-strength'),
            resultDisplay: document.getElementById('result'),
            dealBtn: document.getElementById('deal-btn'),
            resetBtn: document.getElementById('reset-btn'),
            currentBetAmount: document.getElementById('current-bet-amount'),
            currentBetType: document.getElementById('current-bet-type'),
            historyItems: document.getElementById('history-items'),
            soundToggle: document.getElementById('sound-toggle'),
            helpBtn: document.getElementById('help-btn'),
            chips: document.querySelectorAll('.chip')
        };

        // Audio elements
        const audio = {
            deal: document.getElementById('dealSound'),
            win: document.getElementById('winSound'),
            lose: document.getElementById('loseSound'),
            chip: document.getElementById('chipSound')
        };

        // Initialize the game
        async function initGame() {
            try {
                showLoading();
                
                // Create a shuffled deck using our custom 32-card deck
                gameState.deckId = 'custom-32-deck';
                gameState.shuffledDeck = [...customDeck].sort(() => Math.random() - 0.5);
                gameState.deckIndex = 0;
                
                console.log('New 32-card deck created and shuffled');
                hideLoading();
            } catch (error) {
                console.error('Error initializing deck:', error);
                showResult('Error initializing game', 'lose');
                hideLoading();
                resetGameState();
            }
        }

        // Place a bet
        function placeBet(betType) {
            if (gameState.gameInProgress) return;
            
            // Play chip sound
            playSound(audio.chip);
            
            // Remove previous selection
            if (gameState.selectedBet) {
                document.getElementById(`bet-${gameState.selectedBet}`).classList.remove('selected');
            }
            
            // Update bet type
            gameState.selectedBet = betType;
            const betElement = document.getElementById(`bet-${gameState.selectedBet}`);
            betElement.classList.add('selected');
            betElement.classList.add('animate__animated', 'animate__pulse');
            
            // Remove animation after it completes
            setTimeout(() => {
                betElement.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
            
            // Get and validate bet amount
            let betValue = parseInt(elements.betAmountInput.value);
            if (isNaN(betValue)) {
                betValue = 100;
                elements.betAmountInput.value = 100;
            }
            
            if (betValue < 50) {
                betValue = 50;
                elements.betAmountInput.value = 50;
            } else if (betValue > 10000) {
                betValue = 10000;
                elements.betAmountInput.value = 10000;
            }
            
            if (betValue > gameState.balance) {
                showResult('Insufficient balance for this bet', 'lose');
                playSound(audio.lose);
                gameState.selectedBet = null;
                betElement.classList.remove('selected');
                elements.currentBetAmount.textContent = '0';
                elements.currentBetType.textContent = '-';
                return;
            }
            
            gameState.currentBet = betValue;
            
            // Update UI
            elements.currentBetAmount.textContent = gameState.currentBet.toLocaleString();
            elements.currentBetType.textContent = gameState.selectedBet.charAt(0).toUpperCase() + gameState.selectedBet.slice(1);
            
            console.log(`Bet placed: $${gameState.currentBet} on ${gameState.selectedBet}`);
            
            // Enable deal button if not in progress
            if (!gameState.gameInProgress) {
                elements.dealBtn.disabled = false;
            }
        }

        // Deal cards
        async function dealCards() {
            if (!gameState.selectedBet || gameState.gameInProgress || gameState.currentBet === 0) {
                showResult('Please place a valid bet first', 'lose');
                playSound(audio.lose);
                return;
            }
            
            gameState.gameInProgress = true;
            elements.dealBtn.disabled = true;
            elements.resultDisplay.textContent = '';
            elements.playerStrength.textContent = '';
            elements.bankerStrength.textContent = '';
            
            // Deduct bet from balance
            gameState.balance -= gameState.currentBet;
            updateBalance();
            
            try {
                showLoading();
                
                // Show card backs with animation
                elements.playerCards.forEach(card => {
                    card.src = 'https://deckofcardsapi.com/static/img/back.png';
                    card.classList.add('card-deal');
                });
                
                elements.bankerCards.forEach(card => {
                    card.src = 'https://deckofcardsapi.com/static/img/back.png';
                    card.classList.add('card-deal');
                });
                
                // Play deal sound
                playSound(audio.deal);
                
                // Draw six cards (3 for player, 3 for banker) from our custom deck
                const playerCardsData = [];
                const bankerCardsData = [];
                
                for (let i = 0; i < 3; i++) {
                    const cardCode = gameState.shuffledDeck[gameState.deckIndex++];
                    playerCardsData.push(createCardData(cardCode));
                    
                    const cardCode2 = gameState.shuffledDeck[gameState.deckIndex++];
                    bankerCardsData.push(createCardData(cardCode2));
                }
                
                // Reveal cards after delay with staggered animation
                setTimeout(() => {
                    // Player cards
                    elements.playerCards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.remove('card-deal');
                            card.src = playerCardsData[index].image;
                            playSound(audio.deal);
                        }, index * 200);
                    });
                    
                    // Banker cards
                    elements.bankerCards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.remove('card-deal');
                            card.src = bankerCardsData[index].image;
                            playSound(audio.deal);
                        }, (index + 3) * 200);
                    });
                    
                    // Determine winner after all cards are revealed
                    setTimeout(() => {
                        determineWinner(playerCardsData, bankerCardsData);
                        hideLoading();
                    }, 1500);
                }, 500);
            } catch (error) {
                console.error('Error dealing cards:', error);
                showResult('Error dealing cards', 'lose');
                playSound(audio.lose);
                gameState.balance += gameState.currentBet; // Refund bet
                updateBalance();
                resetGameState();
                hideLoading();
            }
        }

        // Create card data object from card code
        function createCardData(code) {
            const valueMap = {
                '7': '7', '8': '8', '9': '9', '0': '10',
                'J': 'JACK', 'Q': 'QUEEN', 'K': 'KING', 'A': 'ACE'
            };
            const suitMap = {
                'S': 'SPADES', 'H': 'HEARTS', 'D': 'DIAMONDS', 'C': 'CLUBS'
            };
            
            const valueChar = code[0];
            const suitChar = code[1];
            
            return {
                code: code,
                value: valueMap[valueChar],
                suit: suitMap[suitChar],
                image: `https://deckofcardsapi.com/static/img/${code}.png`
            };
        }

        // Evaluate a hand in 32-card game
        function evaluateHand(cards) {
            // Card values: Ace is high
            const cardValues = {
                '7': 7, '8': 8, '9': 9, '10': 10,
                'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
            };
            
            // Get card values and suits
            const values = cards.map(card => cardValues[card.value]);
            const suits = cards.map(card => card.suit);
            
            // Sort values in descending order
            values.sort((a, b) => b - a);
            
            // Check for Trail (three of a kind)
            if (values[0] === values[1] && values[1] === values[2]) {
                return { strength: 6, name: 'Trail', highCard: values[0] };
            }
            
            // Check for Pure Sequence (straight flush)
            const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
            const isStraight = (values[0] === values[1] + 1 && values[1] === values[2] + 1) ||
                             (values[0] === 14 && values[1] === 3 && values[2] === 2); // A-2-3 (not possible in 32-card)
            
            if (isFlush && isStraight) {
                return { strength: 5, name: 'Pure Sequence', highCard: values[0] };
            }
            
            // Check for Sequence (straight)
            if (isStraight) {
                return { strength: 4, name: 'Sequence', highCard: values[0] };
            }
            
            // Check for Color (flush)
            if (isFlush) {
                return { strength: 3, name: 'Color', highCard: values[0] };
            }
            
            // Check for Pair (two of a kind)
            if (values[0] === values[1] || values[1] === values[2]) {
                const pairValue = values[0] === values[1] ? values[0] : values[1];
                const kicker = values[0] === values[1] ? values[2] : values[0];
                return { strength: 2, name: 'Pair', highCard: pairValue, kicker: kicker };
            }
            
            // High card
            return { strength: 1, name: 'High Card', highCard: values[0], second: values[1], third: values[2] };
        }

        // Compare two hands
        function compareHands(hand1, hand2) {
            // First compare hand strength
            if (hand1.strength > hand2.strength) return 1;
            if (hand1.strength < hand2.strength) return -1;
            
            // If same strength, compare high cards
            if (hand1.highCard > hand2.highCard) return 1;
            if (hand1.highCard < hand2.highCard) return -1;
            
            // For pairs, compare kickers
            if (hand1.strength === 2) {
                if (hand1.kicker > hand2.kicker) return 1;
                if (hand1.kicker < hand2.kicker) return -1;
            }
            
            // For high cards, compare second and third cards
            if (hand1.strength === 1) {
                if (hand1.second > hand2.second) return 1;
                if (hand1.second < hand2.second) return -1;
                if (hand1.third > hand2.third) return 1;
                if (hand1.third < hand2.third) return -1;
            }
            
            // Complete tie
            return 0;
        }

        // Determine the winner
        function determineWinner(playerCards, bankerCards) {
            // Evaluate both hands
            const playerHand = evaluateHand(playerCards);
            const bankerHand = evaluateHand(bankerCards);
            
            // Display hand strengths
            elements.playerStrength.textContent = playerHand.name;
            elements.bankerStrength.textContent = bankerHand.name;
            
            // Compare hands
            const comparison = compareHands(playerHand, bankerHand);
            
            let winner = '';
            let winnings = 0;
            let result = '';
            let outcomeClass = '';
            
            // Determine winner
            if (comparison > 0) {
                winner = 'player';
            } else if (comparison < 0) {
                winner = 'banker';
            } else {
                winner = 'tie';
            }
            
            // Calculate winnings and determine outcome
            if (winner === 'tie') {
                if (gameState.selectedBet === 'tie') {
                    winnings = gameState.currentBet * 9; // 8:1 payout + original bet
                    result = `TIE! Both have ${playerHand.name}. You win ${formatCurrency(winnings)}!`;
                    outcomeClass = 'win';
                    playSound(audio.win);
                    elements.resultDisplay.classList.add('animate__animated', 'animate__tada');
                } else {
                    result = `TIE! Both have ${playerHand.name}. You lose ${formatCurrency(gameState.currentBet)}`;
                    outcomeClass = 'lose';
                    playSound(audio.lose);
                }
            } else {
                const winnerName = winner === 'player' ? 'Player' : 'Banker';
                const winnerHand = winner === 'player' ? playerHand : bankerHand;
                
                if (gameState.selectedBet === winner) {
                    winnings = gameState.currentBet * 2; // 1:1 payout + original bet
                    result = `${winnerName} WINS with ${winnerHand.name}! You win ${formatCurrency(winnings)}!`;
                    outcomeClass = 'win';
                    playSound(audio.win);
                    elements.resultDisplay.classList.add('animate__animated', 'animate__tada');
                } else {
                    result = `${winnerName} WINS with ${winnerHand.name}! You lose ${formatCurrency(gameState.currentBet)}`;
                    outcomeClass = 'lose';
                    playSound(audio.lose);
                }
            }
            
            // Update balance
            gameState.balance += winnings;
            updateBalance();
            
            // Show result
            showResult(result, outcomeClass);
            
            // Add to history
            addToHistory(winner, outcomeClass);
            
            // Enable reset button
            elements.resetBtn.disabled = false;
            
            // Remove animation after it completes
            setTimeout(() => {
                elements.resultDisplay.classList.remove('animate__animated', 'animate__tada');
            }, 1000);
        }

        // Reset the game
        function resetGame() {
            // Reset card displays
            elements.playerCards.forEach(card => {
                card.src = 'https://deckofcardsapi.com/static/img/back.png';
            });
            elements.bankerCards.forEach(card => {
                card.src = 'https://deckofcardsapi.com/static/img/back.png';
            });
            
            // Clear hand strengths
            elements.playerStrength.textContent = '';
            elements.bankerStrength.textContent = '';
            
            // Clear selections
            if (gameState.selectedBet) {
                document.getElementById(`bet-${gameState.selectedBet}`).classList.remove('selected');
            }
            gameState.selectedBet = null;
            gameState.currentBet = 0;
            
            // Reset UI
            elements.resultDisplay.textContent = '';
            elements.resultDisplay.className = 'result-display';
            elements.dealBtn.disabled = false;
            elements.resetBtn.disabled = true;
            elements.currentBetAmount.textContent = '0';
            elements.currentBetType.textContent = '-';
            gameState.gameInProgress = false;
            
            // Reset chip selection
            elements.chips.forEach(chip => chip.classList.remove('active'));
            
            // Check deck and reshuffle if needed
            if (gameState.deckIndex > 20) {
                initGame(); // Reshuffle
            }
        }

        // Update balance display
        function updateBalance() {
            elements.balance.textContent = gameState.balance.toLocaleString();
        }

        // Show result with animation
        function showResult(message, type) {
            elements.resultDisplay.textContent = message;
            elements.resultDisplay.className = 'result-display';
            elements.resultDisplay.classList.add(type);
        }

        // Add game to history
        function addToHistory(winner, outcome) {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${outcome}`;
            
            const icon = document.createElement('i');
            if (winner === 'player') {
                icon.className = 'fas fa-user';
            } else if (winner === 'banker') {
                icon.className = 'fas fa-university';
            } else {
                icon.className = 'fas fa-equals';
            }
            
            const outcomeText = document.createElement('div');
            outcomeText.className = 'outcome';
            outcomeText.textContent = outcome === 'win' ? 'Win' : 'Lose';
            
            historyItem.appendChild(icon);
            historyItem.appendChild(outcomeText);
            
            // Add animation
            historyItem.classList.add('animate__animated', 'animate__fadeIn');
            
            // Add to beginning of history
            elements.historyItems.insertBefore(historyItem, elements.historyItems.firstChild);
            
            // Limit history to 10 items
            if (elements.historyItems.children.length > 10) {
                elements.historyItems.removeChild(elements.historyItems.lastChild);
            }
            
            // Add to game state history
            gameState.gameHistory.unshift({ winner, outcome });
        }

        // Format currency
        function formatCurrency(amount) {
            return '$' + amount.toLocaleString();
        }

        // Play sound
        function playSound(sound) {
            if (gameState.soundEnabled) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log('Sound play prevented:', e));
            }
        }

        // Toggle sound
        function toggleSound() {
            gameState.soundEnabled = !gameState.soundEnabled;
            elements.soundToggle.innerHTML = gameState.soundEnabled ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-volume-mute"></i>';
        }

        // Show loading state
        function showLoading() {
            elements.dealBtn.innerHTML = '<div class="spinner"></div>';
            elements.dealBtn.disabled = true;
        }

        // Hide loading state
        function hideLoading() {
            elements.dealBtn.innerHTML = '<i class="fas fa-play"></i> Deal Cards';
            if (!gameState.gameInProgress && gameState.selectedBet && gameState.currentBet > 0) {
                elements.dealBtn.disabled = false;
            }
        }

        // Reset game state (without UI reset)
        function resetGameState() {
            gameState.gameInProgress = false;
            if (gameState.selectedBet && gameState.currentBet > 0) {
                elements.dealBtn.disabled = false;
            }
            elements.resetBtn.disabled = true;
        }

        // Show help
        function showHelp() {
            alert(`32-Card Game Rules (Similar to Teen Patti/Flash):
            
1. Place your bet on Player, Banker, or Tie
2. Click "Deal Cards" to reveal three cards for each side
3. Hand rankings (highest to lowest):
   - Trail (Three of a kind)
   - Pure Sequence (Straight flush)
   - Sequence (Straight)
   - Color (Flush)
   - Pair (Two of a kind)
   - High Card
4. Payouts:
   - Player/Banker: 1:1
   - Tie: 8:1
   
Note: Uses a standard Indian 32-card deck (7 through Ace of all suits)

Good luck!`);
        }

        // Event listeners
        elements.betPlayer.addEventListener('click', () => placeBet('player'));
        elements.betBanker.addEventListener('click', () => placeBet('banker'));
        elements.betTie.addEventListener('click', () => placeBet('tie'));
        elements.dealBtn.addEventListener('click', dealCards);
        elements.resetBtn.addEventListener('click', resetGame);
        elements.soundToggle.addEventListener('click', toggleSound);
        elements.helpBtn.addEventListener('click', showHelp);
        
        // Chip buttons
        elements.chips.forEach(chip => {
            chip.addEventListener('click', function() {
                playSound(audio.chip);
                elements.chips.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                const amount = parseInt(this.dataset.amount);
                elements.betAmountInput.value = amount;
                if (gameState.selectedBet) {
                    placeBet(gameState.selectedBet);
                }
            });
        });
        
        // Bet amount input validation
        elements.betAmountInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            
            if (isNaN(value)) {
                value = 100;
            } else if (value < 50) {
                value = 50;
            } else if (value > 10000) {
                value = 10000;
            }
            
            this.value = value;
            
            if (gameState.selectedBet) {
                placeBet(gameState.selectedBet);
            }
        });
        
        // Initialize the game when page loads
        window.addEventListener('load', () => {
            updateBalance();
            initGame();
        });
   