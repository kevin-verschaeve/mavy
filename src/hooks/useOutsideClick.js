import { useCallback } from 'react';

/**
 * Hook pour gérer la fermeture des menus/formulaires quand on clique en dehors
 *
 * @param {boolean} isOpen - État d'ouverture du menu
 * @param {function} setIsOpen - Fonction pour changer l'état d'ouverture
 * @returns {object} - { handleOutsidePress, handleInsidePress }
 */
export function useOutsideClick(isOpen, setIsOpen) {
  // Appelé quand on clique en dehors du menu
  const handleOutsidePress = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, setIsOpen]);

  // Empêche la propagation du touch vers le parent
  // Utilisé sur le conteneur du formulaire
  const handleInsidePress = useCallback(() => true, []);

  return {
    handleOutsidePress,
    handleInsidePress,
  };
}
