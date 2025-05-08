// Empire des Rues - Un jeu mobile inspiré par Schedule 1
// Fichier principal: game.js

// Structure de données du joueur
const player = {
  money: 500,        // Argent de départ
  inventory: {},     // Inventaire des produits
  reputation: 0,     // Réputation dans la ville
  territory: 1,      // Territoires contrôlés
  day: 1,            // Jour actuel
  police_heat: 0,    // Attention de la police (0-100)
  cartel_heat: 0,    // Tension avec les cartels (0-100)
};

// Produits disponibles dans le jeu
const products = {
  product1: {
    name: "Produit A",
    baseBuyPrice: 50,
    baseSellPrice: 100,
    risk: 10,        // Risque d'attirer l'attention (0-100)
    availability: 80 // Disponibilité sur le marché (0-100)
  },
  product2: {
    name: "Produit B",
    baseBuyPrice: 200,
    baseSellPrice: 400,
    risk: 25,
    availability: 60
  },
  product3: {
    name: "Produit C",
    baseBuyPrice: 500,
    baseSellPrice: 1200,
    risk: 50,
    availability: 30
  },
  product4: {
    name: "Produit D",
    baseBuyPrice: 1500,
    baseSellPrice: 4000,
    risk: 75,
    availability: 10
  }
};

// Zones de la ville
const districts = {
  slums: {
    name: "Quartiers Pauvres",
    demandMultiplier: 0.8,
    priceMultiplier: 0.7,
    policePresence: 0.5,
    cartelPresence: 0.8,
    unlocked: true
  },
  downtown: {
    name: "Centre-Ville",
    demandMultiplier: 1.0,
    priceMultiplier: 1.0,
    policePresence: 1.2,
    cartelPresence: 0.3,
    unlocked: true
  },
  suburbs: {
    name: "Banlieue",
    demandMultiplier: 0.6,
    priceMultiplier: 1.5,
    policePresence: 1.5,
    cartelPresence: 0.1,
    unlocked: false
  },
  financial: {
    name: "Quartier Financier",
    demandMultiplier: 1.5,
    priceMultiplier: 2.0,
    policePresence: 1.8,
    cartelPresence: 0.2,
    unlocked: false
  }
};

// Articles de la boutique
const shopItems = {
  burnerPhone: {
    name: "Téléphone jetable",
    price: 300,
    effect: "Réduit l'attention de la police de 10%",
    action: () => {
      player.police_heat = Math.max(0, player.police_heat - 10);
      return "Attention de la police réduite!";
    }
  },
  bribe: {
    name: "Pot-de-vin",
    price: 1000,
    effect: "Réduit l'attention de la police de 25%",
    action: () => {
      player.police_heat = Math.max(0, player.police_heat - 25);
      return "Attention de la police significativement réduite!";
    }
  },
  bodyguard: {
    name: "Garde du corps",
    price: 800,
    effect: "Réduit les tensions avec les cartels de 15%",
    action: () => {
      player.cartel_heat = Math.max(0, player.cartel_heat - 15);
      return "Tensions avec les cartels réduites!";
    }
  },
  territory: {
    name: "Expansion de territoire",
    price: 5000,
    effect: "Augmente votre territoire contrôlé",
    action: () => {
      player.territory += 1;
      return "Territoire étendu! Vous pouvez vendre plus de marchandise.";
    }
  }
};

// Événements aléatoires
const randomEvents = [
  {
    name: "Raid de police",
    probability: 0.05,
    heatThreshold: 50,
    action: () => {
      if (Math.random() < player.police_heat / 100) {
        // Perdre de l'argent et/ou des produits
        const fine = Math.floor(player.money * 0.3);
        player.money -= fine;
        return `La police vous a attrapé! Vous avez payé une amende de $${fine}.`;
      } else {
        return "Vous avez échappé à la police de justesse!";
      }
    }
  },
  {
    name: "Confrontation de cartel",
    probability: 0.05,
    heatThreshold: 50,
    action: () => {
      if (Math.random() < player.cartel_heat / 100) {
        // Perdre de l'argent et/ou des produits
        const loss = Math.floor(player.money * 0.2);
        player.money -= loss;
        return `Un cartel rival vous a attaqué! Vous avez perdu $${loss}.`;
      } else {
        return "Vous avez évité une confrontation avec un cartel rival!";
      }
    }
  },
  {
    name: "Nouveau contact",
    probability: 0.1,
    action: () => {
      const discount = Math.floor(Math.random() * 10) + 5;
      return `Vous avez rencontré un nouveau fournisseur qui offre ${discount}% de réduction sur votre prochain achat!`;
    }
  }
];

// Fonctions principales du jeu

// Générer les prix du marché pour la journée
function generateMarketPrices(district) {
  const dist = districts[district];
  const marketPrices = {};
  
  Object.keys(products).forEach(productId => {
    const product = products[productId];
    
    // Facteur aléatoire qui fait fluctuer les prix (0.8 - 1.2)
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    // Prix d'achat et de vente ajustés au district
    marketPrices[productId] = {
      buyPrice: Math.floor(product.baseBuyPrice * randomFactor * dist.priceMultiplier),
      sellPrice: Math.floor(product.baseSellPrice * randomFactor * dist.priceMultiplier),
      available: Math.floor(Math.random() * 10) + 1 // Quantité disponible (1-10)
    };
  });
  
  return marketPrices;
}

// Acheter un produit
function buyProduct(productId, quantity, marketPrices) {
  const product = products[productId];
  const market = marketPrices[productId];
  
  const totalCost = market.buyPrice * quantity;
  
  if (player.money < totalCost) {
    return {success: false, message: "Pas assez d'argent!"};
  }
  
  if (market.available < quantity) {
    return {success: false, message: "Quantité non disponible sur le marché!"};
  }
  
  // Mettre à jour l'inventaire
  if (!player.inventory[productId]) {
    player.inventory[productId] = 0;
  }
  player.inventory[productId] += quantity;
  
  // Payer et ajuster le marché
  player.money -= totalCost;
  market.available -= quantity;
  
  // Augmenter légèrement la chaleur
  player.police_heat += (product.risk * quantity) / 20;
  player.police_heat = Math.min(100, player.police_heat);
  
  return {
    success: true, 
    message: `Acheté ${quantity} ${product.name} pour $${totalCost}`
  };
}

// Vendre un produit
function sellProduct(productId, quantity, marketPrices) {
  const product = products[productId];
  const market = marketPrices[productId];
  
  if (!player.inventory[productId] || player.inventory[productId] < quantity) {
    return {success: false, message: "Vous n'avez pas assez de ce produit!"};
  }
  
  // Calculer capacité de vente basée sur le territoire
  const maxSalesCapacity = player.territory * 10;
  const totalSales = Object.values(player.inventory).reduce((a, b) => a + b, 0);
  
  if (totalSales > maxSalesCapacity) {
    return {success: false, message: "Votre territoire est trop petit pour vendre autant!"};
  }
  
  const totalEarned = market.sellPrice * quantity;
  
  // Mettre à jour l'inventaire et l'argent
  player.inventory[productId] -= quantity;
  player.money += totalEarned;
  
  // Augmenter la chaleur
  player.police_heat += (product.risk * quantity) / 10;
  player.cartel_heat += (quantity / 5);
  
  player.police_heat = Math.min(100, player.police_heat);
  player.cartel_heat = Math.min(100, player.cartel_heat);
  
  return {
    success: true, 
    message: `Vendu ${quantity} ${product.name} pour $${totalEarned}`
  };
}

// Acheter un article de la boutique
function buyShopItem(itemId) {
  const item = shopItems[itemId];
  
  if (player.money < item.price) {
    return {success: false, message: "Pas assez d'argent!"};
  }
  
  player.money -= item.price;
  const result = item.action();
  
  return {
    success: true,
    message: `Acheté ${item.name} pour $${item.price}. ${result}`
  };
}

// Passer à la journée suivante
function nextDay() {
  player.day += 1;
  
  // Réduire légèrement la chaleur avec le temps
  player.police_heat = Math.max(0, player.police_heat - 5);
  player.cartel_heat = Math.max(0, player.cartel_heat - 3);
  
  // Débloquer de nouveaux districts basés sur la réputation/l'argent
  if (player.money >= 10000 && !districts.suburbs.unlocked) {
    districts.suburbs.unlocked = true;
    return {
      success: true,
      message: "Jour " + player.day + ". Nouveau quartier débloqué: Banlieue!"
    };
  }
  
  if (player.money >= 50000 && !districts.financial.unlocked) {
    districts.financial.unlocked = true;
    return {
      success: true,
      message: "Jour " + player.day + ". Nouveau quartier débloqué: Quartier Financier!"
    };
  }
  
  // Vérifier les événements aléatoires
  for (const event of randomEvents) {
    if (Math.random() < event.probability) {
      if (event.heatThreshold && player.police_heat < event.heatThreshold) {
        continue;
      }
      return {
        success: true,
        message: "Jour " + player.day + ". " + event.action()
      };
    }
  }
  
  return {
    success: true,
    message: "Jour " + player.day + ". Une nouvelle journée commence."
  };
}

// Vérifier si le jeu est terminé
function checkGameOver() {
  if (player.money < 0) {
    return {gameOver: true, message: "Vous êtes en faillite. Fin du jeu."};
  }
  
  if (player.police_heat >= 100) {
    return {gameOver: true, message: "La police vous a arrêté. Fin du jeu."};
  }
  
  if (player.cartel_heat >= 100) {
    return {gameOver: true, message: "Un cartel rival vous a éliminé. Fin du jeu."};
  }
  
  if (player.money >= 1000000) {
    return {gameOver: true, message: "Vous êtes devenu un baron de la drogue! Victoire!"};
  }
  
  return {gameOver: false};
}

// Interface UI simplifiée (à remplacer par React Native ou autre framework mobile)
function updateUI() {
  // Cette fonction serait remplacée par le code d'interface utilisateur réel
  console.log("=== Empire des Rues ===");
  console.log(`Jour: ${player.day}`);
  console.log(`Argent: $${player.money}`);
  console.log(`Territoires: ${player.territory}`);
  console.log(`Attention police: ${player.police_heat}%`);
  console.log(`Tension cartels: ${player.cartel_heat}%`);
  console.log("Inventaire:");
  Object.keys(player.inventory).forEach(productId => {
    if (player.inventory[productId] > 0) {
      console.log(`- ${products[productId].name}: ${player.inventory[productId]}`);
    }
  });
}

// Exports pour l'application
export {
  player,
  products,
  districts,
  shopItems,
  generateMarketPrices,
  buyProduct,
  sellProduct,
  buyShopItem,
  nextDay,
  checkGameOver,
  updateUI
};
