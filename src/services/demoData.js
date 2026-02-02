import { categoryService } from '../services/categoryService';
import { actionService } from '../services/actionService';

/**
 * Script pour initialiser des catégories et actions de démonstration
 * Utile pour tester l'application rapidement
 */
export const initDemoData = async () => {
  try {
    console.log('📦 Initialisation des données de démonstration...');

    // Catégorie Voiture
    const carCategoryId = await categoryService.create('Voiture', '🚗', '#ef4444');
    await actionService.create(carCategoryId, 'Révision');
    await actionService.create(carCategoryId, 'Vidange');
    await actionService.create(carCategoryId, 'Contrôle technique');
    await actionService.create(carCategoryId, 'Pneus');

    // Catégorie Maison
    const houseCategoryId = await categoryService.create('Maison', '🏠', '#10b981');
    await actionService.create(houseCategoryId, 'Ramonage');
    await actionService.create(houseCategoryId, 'Chaudière');
    await actionService.create(houseCategoryId, 'Gouttières');
    await actionService.create(houseCategoryId, 'Jardin');

    // Catégorie Personnel
    const personalCategoryId = await categoryService.create('Moi', '👤', '#3b82f6');
    await actionService.create(personalCategoryId, 'Coiffeur');
    await actionService.create(personalCategoryId, 'Dentiste');
    await actionService.create(personalCategoryId, 'Médecin');
    await actionService.create(personalCategoryId, 'Sport');

    // Catégorie Santé
    const healthCategoryId = await categoryService.create('Santé', '🏥', '#f59e0b');
    await actionService.create(healthCategoryId, 'Prise de sang');
    await actionService.create(healthCategoryId, 'Vaccin');
    await actionService.create(healthCategoryId, 'Check-up');

    console.log('✅ Données de démonstration créées avec succès !');
    console.log('🎯 Vous pouvez maintenant tester l\'application');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de démo:', error);
    return false;
  }
};

/**
 * Script pour supprimer toutes les données
 * À utiliser avec précaution !
 */
export const clearAllData = async () => {
  try {
    console.log('🗑️  Suppression de toutes les données...');
    const { getTursoClient } = await import('../config/turso');
    const db = getTursoClient();
    
    await db.execute('DELETE FROM entries');
    await db.execute('DELETE FROM actions');
    await db.execute('DELETE FROM categories');
    
    console.log('✅ Toutes les données ont été supprimées');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return false;
  }
};
