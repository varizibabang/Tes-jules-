document.addEventListener('DOMContentLoaded', () => {
    // --- GAME STATE ---
    let coins = 20;
    let inventory = {
        seeds: { 'moonpetal': 2, 'sunflare': 1 },
        plants: {},
        potions: {}
    };
    let gardenPlots = [null, null, null, null, null, null]; // 6 plots in the garden

    // --- GAME DATA ---
    const SEEDS = {
        'moonpetal': { name: 'Moonpetal', price: 10, growthTime: 10, icon: '🌸' }, // Changed icon
        'sunflare': { name: 'Sunflare', price: 15, growthTime: 15, icon: '☀️' },
        'shadow-root': { name: 'Shadow Root', price: 25, growthTime: 20, icon: '🌑' }
    };

    const POTIONS = {
        'healing-draught': { name: 'Healing Draught', price: 50, ingredients: { 'moonpetal': 2 }, icon: '🧪' },
        'energy-elixir': { name: 'Energy Elixir', price: 80, ingredients: { 'sunflare': 1, 'moonpetal': 1 }, icon: '⚡' }
    };

    // --- DOM ELEMENTS ---
    const coinCountEl = document.getElementById('coin-count');
    const plantsEl = document.getElementById('plants');
    const potionsForSaleEl = document.getElementById('potions-for-sale');
    const seedsForSaleEl = document.getElementById('seeds-for-sale');
    const brewBtn = document.getElementById('brew-btn');
    const cauldronEl = document.getElementById('cauldron');

    // --- RENDER FUNCTIONS ---
    function renderCoins() {
        coinCountEl.textContent = coins;
    }

    function renderGarden() {
        plantsEl.innerHTML = '';
        gardenPlots.forEach((plot, index) => {
            const plotEl = document.createElement('div');
            plotEl.className = 'plant p-4 border-2 border-dashed border-green-300 rounded-lg text-center cursor-pointer hover:bg-green-50';
            plotEl.dataset.index = index;
            if (plot) {
                const remainingTime = Math.ceil((plot.growsAt - Date.now()) / 1000);
                plotEl.innerHTML = `<div class="text-4xl">${SEEDS[plot.seed].icon}</div><div>${SEEDS[plot.seed].name}</div><div class="text-sm text-gray-500">${remainingTime > 0 ? `${remainingTime}s` : 'Ready!'}</div>`;
                if (remainingTime <= 0) {
                    plotEl.classList.add('border-green-500');
                    plotEl.addEventListener('click', harvestPlant);
                }
            } else {
                plotEl.innerHTML = `<div class="text-4xl">+</div><div>Empty Plot</div>`;
                plotEl.addEventListener('click', showSeedSelection);
            }
            plantsEl.appendChild(plotEl);
        });
    }

    function renderShop() {
        seedsForSaleEl.innerHTML = '';
        for (const seedId in SEEDS) {
            const seed = SEEDS[seedId];
            const seedEl = document.createElement('div');
            seedEl.className = 'seed p-4 border rounded-lg text-center cursor-pointer hover:bg-blue-50';
            seedEl.innerHTML = `<div class="text-4xl">${seed.icon}</div><div>${seed.name}</div><div class="font-bold">${seed.price} coins</div>`;
            seedEl.addEventListener('click', () => buySeed(seedId));
            seedsForSaleEl.appendChild(seedEl);
        }
    }

    // --- GAME LOGIC ---
    function showSeedSelection(event) {
        // For simplicity, we'll just plant the first available seed.
        // A more complete implementation would show a modal to select a seed.
        const plotIndex = event.currentTarget.dataset.index;
        const availableSeed = Object.keys(inventory.seeds).find(seedId => inventory.seeds[seedId] > 0);
        if (availableSeed) {
            plantSeed(availableSeed, plotIndex);
        } else {
            alert('You have no seeds to plant! Buy some from the shop.');
        }
    }

    function plantSeed(seedId, plotIndex) {
        if (gardenPlots[plotIndex] === null && inventory.seeds[seedId] > 0) {
            inventory.seeds[seedId]--;
            gardenPlots[plotIndex] = {
                seed: seedId,
                plantedAt: Date.now(),
                growsAt: Date.now() + SEEDS[seedId].growthTime * 1000
            };
            console.log(`Planted ${seedId} in plot ${plotIndex}`);
            updateGame();
        }
    }

    function harvestPlant(event) {
        const plotIndex = event.currentTarget.dataset.index;
        const plot = gardenPlots[plotIndex];
        if (plot && Date.now() >= plot.growsAt) {
            const plantId = plot.seed;
            inventory.plants[plantId] = (inventory.plants[plantId] || 0) + 1;
            gardenPlots[plotIndex] = null;
            console.log(`Harvested ${plantId} from plot ${plotIndex}`);
            updateGame();
        }
    }


    // --- INITIALIZE ---
    function renderInventory() {
        cauldronEl.innerHTML = '';
        let hasPlants = false;
        for (const plantId in inventory.plants) {
            if (inventory.plants[plantId] > 0) {
                hasPlants = true;
                const plantEl = document.createElement('span');
                plantEl.className = 'inline-block bg-gray-300 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2';
                plantEl.textContent = `${SEEDS[plantId].icon} ${SEEDS[plantId].name}: ${inventory.plants[plantId]}`;
                cauldronEl.appendChild(plantEl);
            }
        }
        if (!hasPlants) {
            cauldronEl.innerHTML = '<p class="text-gray-500">Harvest plants to see them here.</p>';
        }
    }

    function renderMarket() {
        potionsForSaleEl.innerHTML = '';
        let hasPotions = false;
        for (const potionId in inventory.potions) {
            if (inventory.potions[potionId] > 0) {
                hasPotions = true;
                const potion = POTIONS[potionId];
                const potionEl = document.createElement('div');
                potionEl.className = 'potion flex justify-between items-center bg-yellow-100 p-2 rounded-lg';
                potionEl.innerHTML = `
                    <div>
                        <span class="text-2xl">${potion.icon}</span>
                        <span>${potion.name} (${inventory.potions[potionId]})</span>
                    </div>
                    <button data-potion-id="${potionId}" class="sell-btn bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition">Sell for ${potion.price}</button>
                `;
                potionsForSaleEl.appendChild(potionEl);
            }
        }
        if (!hasPotions) {
            potionsForSaleEl.innerHTML = '<p class="text-gray-500">Brew potions to sell them here.</p>';
        }
        // Add event listeners to new sell buttons
        document.querySelectorAll('.sell-btn').forEach(button => {
            button.addEventListener('click', (e) => sellPotion(e.target.dataset.potionId));
        });
    }

    function brewPotion() {
        // This is a simple brew logic. It tries to brew any potion for which ingredients are available.
        for (const potionId in POTIONS) {
            const potion = POTIONS[potionId];
            let canBrew = true;
            for (const ingredientId in potion.ingredients) {
                if ((inventory.plants[ingredientId] || 0) < potion.ingredients[ingredientId]) {
                    canBrew = false;
                    break;
                }
            }

            if (canBrew) {
                // Consume ingredients
                for (const ingredientId in potion.ingredients) {
                    inventory.plants[ingredientId] -= potion.ingredients[ingredientId];
                }
                // Add potion to inventory
                inventory.potions[potionId] = (inventory.potions[potionId] || 0) + 1;
                alert(`You brewed a ${potion.name}!`);
                updateGame();
                return; // Brew one potion at a time
            }
        }
        alert('Not enough ingredients to brew any potion.');
    }

    function sellPotion(potionId) {
        if (inventory.potions[potionId] > 0) {
            inventory.potions[potionId]--;
            coins += POTIONS[potionId].price;
            triggerCoinAnimation();
            updateGame();
        }
    }

    function buySeed(seedId) {
        const seed = SEEDS[seedId];
        if (coins >= seed.price) {
            coins -= seed.price;
            inventory.seeds[seedId] = (inventory.seeds[seedId] || 0) + 1;
            console.log(`Bought ${seedId}`);
            triggerCoinAnimation();
            updateGame();
        } else {
            alert("Not enough coins!");
        }
    }

    function triggerCoinAnimation() {
        const coinDisplay = document.getElementById('coin-display');
        coinDisplay.classList.add('jiggle-animation');
        coinDisplay.addEventListener('animationend', () => {
            coinDisplay.classList.remove('jiggle-animation');
        }, { once: true });
    }

    function checkBrewablePotions() {
        let canBrewAny = false;
        for (const potionId in POTIONS) {
            const potion = POTIONS[potionId];
            let canBrew = true;
            for (const ingredientId in potion.ingredients) {
                if ((inventory.plants[ingredientId] || 0) < potion.ingredients[ingredientId]) {
                    canBrew = false;
                    break;
                }
            }
            if (canBrew) {
                canBrewAny = true;
                break;
            }
        }

        if (canBrewAny) {
            brewBtn.classList.add('pulse-animation');
        } else {
            brewBtn.classList.remove('pulse-animation');
        }
    }

    function updateGame() {
        renderCoins();
        renderGarden();
        renderShop();
        renderInventory();
        renderMarket();
        checkBrewablePotions();
    }

    // Game loop to update garden timers
    setInterval(renderGarden, 1000);

    // Event Listeners
    brewBtn.addEventListener('click', brewPotion);

    updateGame();
});