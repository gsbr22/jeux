// App.js - Application React Native pour Empire des Rues
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  FlatList,
  Image,
  Alert
} from 'react-native';
import * as gameLogic from './game';

export default function App() {
  // États du jeu
  const [player, setPlayer] = useState(gameLogic.player);
  const [currentDistrict, setCurrentDistrict] = useState('slums');
  const [marketPrices, setMarketPrices] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('market'); // 'market', 'inventory', 'shop'
  const [gameMessage, setGameMessage] = useState('Bienvenue à Hyland Point!');

  // Initialiser le jeu
  useEffect(() => {
    refreshMarket();
  }, []);

  // Rafraîchir le marché
  const refreshMarket = () => {
    const prices = gameLogic.generateMarketPrices(currentDistrict);
    setMarketPrices(prices);
  };

  // Passer à la journée suivante
  const handleNextDay = () => {
    const result = gameLogic.nextDay();
    setPlayer({...gameLogic.player});
    setGameMessage(result.message);
    refreshMarket();
    
    // Vérifier si le jeu est terminé
    const gameOverCheck = gameLogic.checkGameOver();
    if (gameOverCheck.gameOver) {
      Alert.alert('Fin du Jeu', gameOverCheck.message, [
        {text: 'Nouvelle partie', onPress: () => resetGame()}
      ]);
    }
  };

  // Réinitialiser le jeu
  const resetGame = () => {
    // Réinitialiser le joueur aux valeurs par défaut
    Object.assign(gameLogic.player, {
      money: 500,
      inventory: {},
      reputation: 0,
      territory: 1,
      day: 1,
      police_heat: 0,
      cartel_heat: 0,
    });
    setPlayer({...gameLogic.player});
    setCurrentDistrict('slums');
    setGameMessage('Nouvelle partie commencée. Bonne chance!');
    refreshMarket();
  };

  // Acheter un produit
  const handleBuy = (productId) => {
    const product = gameLogic.products[productId];
    const market = marketPrices[productId];
    
    if (!market || market.available <= 0) {
      setGameMessage("Ce produit n'est pas disponible!");
      return;
    }
    
    // Pour simplifier, achat de 1 unité à la fois
    const result = gameLogic.buyProduct(productId, 1, marketPrices);
    setGameMessage(result.message);
    setPlayer({...gameLogic.player});
  };

  // Vendre un produit
  const handleSell = (productId) => {
    // Pour simplifier, vente de 1 unité à la fois
    const result = gameLogic.sellProduct(productId, 1, marketPrices);
    setGameMessage(result.message);
    setPlayer({...gameLogic.player});
  };

  // Acheter un article du magasin
  const handleShopPurchase = (itemId) => {
    const result = gameLogic.buyShopItem(itemId);
    setGameMessage(result.message);
    setPlayer({...gameLogic.player});
  };

  // Changer le district actuel
  const changeDistrict = (districtId) => {
    if (!gameLogic.districts[districtId].unlocked) {
      setGameMessage("Ce quartier n'est pas encore débloqué!");
      return;
    }
    
    setCurrentDistrict(districtId);
    refreshMarket();
    setGameMessage(`Vous êtes maintenant dans ${gameLogic.districts[districtId].name}`);
  };

  // Rendu des produits du marché
  const renderMarketItem = ({ item: productId }) => {
    const product = gameLogic.products[productId];
    const market = marketPrices[productId];
    
    if (!market) return null;
    
    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text>Prix: ${market.buyPrice}</Text>
          <Text>Disponible: {market.available}</Text>
          <Text style={styles.riskText}>Risque: {product.risk}%</Text>
        </View>
        <TouchableOpacity 
          style={styles.buyButton}
          onPress={() => handleBuy(productId)}
        >
          <Text style={styles.buttonText}>Acheter</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Rendu des produits de l'inventaire
  const renderInventoryItem = ({ item: productId }) => {
    const product = gameLogic.products[productId];
    const quantity = player.inventory[productId] || 0;
    
    if (!quantity) return null;
    
    const market = marketPrices[productId];
    const sellPrice = market ? market.sellPrice : product.baseSellPrice;
    
    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text>Quantité: {quantity}</Text>
          <Text>Prix de vente: ${sellPrice}</Text>
        </View>
        <TouchableOpacity 
          style={styles.sellButton}
          onPress={() => handleSell(productId)}
          disabled={quantity <= 0}
        >
          <Text style={styles.buttonText}>Vendre</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Rendu des articles de la boutique
  const renderShopItem = ({ item: itemId }) => {
    const item = gameLogic.shopItems[itemId];
    
    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text>Prix: ${item.price}</Text>
          <Text style={styles.itemDescription}>{item.effect}</Text>
        </View>
        <TouchableOpacity 
          style={styles.buyButton}
          onPress={() => handleShopPurchase(itemId)}
          disabled={player.money < item.price}
        >
          <Text style={styles.buttonText}>Acheter</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Rendu des districts
  const renderDistricts = () => {
    return Object.keys(gameLogic.districts).map((districtId) => {
      const district = gameLogic.districts[districtId];
      const isActive = currentDistrict === districtId;
      const isLocked = !district.unlocked;
      
      return (
        <TouchableOpacity 
          key={districtId}
          style={[
            styles.districtButton,
            isActive && styles.activeDistrict,
            isLocked && styles.lockedDistrict
          ]}
          onPress={() => changeDistrict(districtId)}
          disabled={isLocked}
        >
          <Text style={styles.districtButtonText}>
            {district.name}
            {isLocked ? ' 🔒' : ''}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  // Contenu du modal selon le type
  const renderModalContent = () => {
    switch (modalContent) {
      case 'market':
        return (
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Marché Noir</Text>
            <FlatList
              data={Object.keys(gameLogic.products)}
              renderItem={renderMarketItem}
              keyExtractor={item => item}
            />
          </View>
        );
      case 'inventory':
        return (
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Votre Inventaire</Text>
            <FlatList
              data={Object.keys(gameLogic.products)}
              renderItem={renderInventoryItem}
              keyExtractor={item => item}
            />
          </View>
        );
      case 'shop':
        return (
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Boutique</Text>
            <FlatList
              data={Object.keys(gameLogic.shopItems)}
              renderItem={renderShopItem}
              keyExtractor={item => item}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* En-tête avec infos du joueur */}
      <View style={styles.header}>
        <Text style={styles.title}>Empire des Rues</Text>
        <Text style={styles.subtitle}>Jour {player.day}</Text>
      </View>
      
      {/* Statistiques du joueur */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${player.money}</Text>
          <Text style={styles.statLabel}>Cash</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{player.territory}</Text>
          <Text style={styles.statLabel}>Territoire</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{player.police_heat}%</Text>
          <Text style={styles.statLabel}>Police</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{player.cartel_heat}%</Text>
          <Text style={styles.statLabel}>Cartel</Text>
        </View>
      </View>
      
      {/* Message du jeu */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{gameMessage}</Text>
      </View>
      
      {/* Districts */}
      <Text style={styles.sectionTitle}>Quartiers</Text>
      <ScrollView horizontal style={styles.districtsRow}>
        {renderDistricts()}
      </ScrollView>
      
      {/* Boutons d'action principaux */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setModalContent('market');
            setModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Marché</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setModalContent('inventory');
            setModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Inventaire</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setModalContent('shop');
            setModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Boutique</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bouton Jour Suivant */}
      <TouchableOpacity 
        style={styles.nextDayButton}
        onPress={handleNextDay}
      >
        <Text style={styles.nextDayButtonText}>Jour Suivant</Text>
      </TouchableOpacity>
      
      {/* Modal pour les différentes sections */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </View>
  );
}
